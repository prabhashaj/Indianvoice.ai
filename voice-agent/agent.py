"""
VoxSales AI — Voice Agent Entry Point (livekit-agents 1.x API)
Connects to LiveKit and runs the sales agent using Mistral as the LLM.

Usage:
    python agent.py dev   # Start in dev mode (auto-joins first room)
    python agent.py start # Production mode (listens for dispatch requests)

Required environment variables:
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    MISTRAL_API_KEY
    DEEPGRAM_API_KEY (for STT)
    CARTESIA_API_KEY (for TTS)
"""
import logging
import os

from dotenv import load_dotenv
from livekit.agents import AgentSession, JobContext, WorkerOptions, cli, RoomInputOptions
from livekit.plugins import deepgram, silero, cartesia, openai as lk_openai_plugin

from config import VoiceAgentConfig
from providers.llm import build_llm
from prompts import build_system_prompt

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


async def entrypoint(ctx: JobContext):
    """
    Called by LiveKit Workers when a room becomes available.
    Builds the STT → LLM → TTS pipeline and starts the agent session.
    """
    logger.info("Voice agent joining room: %s", ctx.room.name)

    # Load agent config from job metadata (set by backend when dispatching via
    # RoomAgentDispatch.metadata) or fall back to room metadata
    metadata = ""
    if ctx.job and ctx.job.metadata:
        metadata = ctx.job.metadata
        logger.debug("Config loaded from job metadata")
    elif ctx.room.metadata:
        metadata = ctx.room.metadata
        logger.debug("Config loaded from room metadata")
    else:
        logger.warning("No metadata found — using default agent config")

    config = VoiceAgentConfig.from_metadata(metadata)

    logger.info(
        "Agent config: workspace=%s agent_id=%s lead_id=%s",
        config.workspace_id, config.agent_id, config.lead_id,
    )

    # Connect to the room
    await ctx.connect()

    # ── Build STT ─────────────────────────────────────────────────────────────
    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY", "")
    stt = deepgram.STT(api_key=deepgram_api_key, model=os.getenv("DEEPGRAM_MODEL", "nova-2"))

    # ── Build LLM ─────────────────────────────────────────────────────────────
    llm = build_llm(config)

    # ── Build TTS (Cartesia) ──────────────────────────────────────────────────
    from providers.tts import CARTESIA_VOICE_MAP
    cartesia_api_key = os.getenv("CARTESIA_API_KEY", "")
    voice_name = config.tts_voice or "nova"
    cartesia_voice_id = CARTESIA_VOICE_MAP.get(voice_name.lower(), list(CARTESIA_VOICE_MAP.values())[0])
    tts = cartesia.TTS(
        api_key=cartesia_api_key,
        voice=cartesia_voice_id,
        model="sonic-3.6",
    )

    # ── Build VAD ─────────────────────────────────────────────────────────────
    vad = silero.VAD.load()

    # ── Create session ────────────────────────────────────────────────────────
    session = AgentSession(
        vad=vad,
        stt=stt,
        llm=llm,
        tts=tts,
    )

    logger.info("Starting sales agent session in room: %s", ctx.room.name)

    # ── Start the session with opening message ────────────────────────────────
    await session.start(
        room=ctx.room,
        agent=VoxSalesVoiceAgent(config=config),
        room_input_options=RoomInputOptions(),
    )

    # Speak the opening line as soon as a participant (phone call) connects
    if config.opening_script:
        await session.say(config.opening_script, allow_interruptions=True)

    import asyncio
    disconnect_future = asyncio.Future()

    @ctx.room.on("disconnected")
    def on_disconnected(*args, **kwargs):
        if not disconnect_future.done():
            disconnect_future.set_result(None)

    try:
        await disconnect_future
    except asyncio.CancelledError:
        pass
    
    logger.info("Sales agent session ended for room: %s", ctx.room.name)


# ─── VoxSales Voice Agent (1.x API) ──────────────────────────────────────────

from livekit.agents import Agent, ModelSettings
from states import SalesState
from prompts import get_state_instruction
from tools import AgentTools


class VoxSalesVoiceAgent(Agent):
    """
    AI sales agent using livekit-agents 1.x Agent API.
    Implements the sales state machine within the Agent lifecycle hooks.
    """

    def __init__(self, config: VoiceAgentConfig):
        super().__init__(instructions=build_system_prompt(config))
        self.config = config
        self.state = SalesState.INTRODUCTION
        self.sales_tools = AgentTools(config=config)
        self.qualification_score = 0
        self.pain_points: list[str] = []
        self.meeting_scheduled = False
        logger.info("[%s] Agent initialized in state: %s", config.call_id, self.state.name)

    def transition_to(self, new_state: SalesState) -> bool:
        from sales_agent import VALID_TRANSITIONS
        if new_state in VALID_TRANSITIONS.get(self.state, []):
            logger.info(
                "[%s] State: %s → %s",
                self.config.call_id, self.state.name, new_state.name,
            )
            self.state = new_state
            return True
        return False

    async def on_user_turn_completed(self, turn_ctx, new_message=None) -> None:
        """
        Called after each customer utterance. Analyzes and may trigger
        state transitions or tool calls.
        Compatible with both 1.x (single arg) and older (two args) calling conventions.
        """
        # Get message text — handle both API versions
        if new_message is not None:
            text_content = getattr(new_message, "content", "") or ""
        elif hasattr(turn_ctx, "new_message"):
            msg = turn_ctx.new_message
            text_content = getattr(msg, "content", "") or ""
        else:
            text_content = ""

        text = text_content.lower() if isinstance(text_content, str) else ""

        # Detect opt-out — highest priority
        if any(phrase in text for phrase in [
            "don't call me", "remove me", "unsubscribe", "stop calling",
            "do not contact", "not interested", "take me off",
        ]):
            await self.sales_tools.mark_do_not_contact(reason=text_content)
            self.transition_to(SalesState.END)
            await self.session.say(
                "I completely understand. I'll remove you from our list right away. "
                "Have a great day, and I'm sorry for any inconvenience.",
                allow_interruptions=True,
            )
            return

        # Detect human handoff request
        if any(phrase in text for phrase in [
            "speak to a human", "talk to a person", "real person",
            "manager", "your supervisor", "customer service",
        ]):
            self.transition_to(SalesState.HUMAN_HANDOFF)
            return

        # State-specific analysis
        await self._analyze_turn(text)

    async def _analyze_turn(self, text: str):
        """Heuristic state transitions based on conversation content."""
        if self.state == SalesState.INTRODUCTION:
            positive_signals = ["sure", "okay", "yes", "go ahead", "sounds good", "tell me"]
            if any(s in text for s in positive_signals):
                self.transition_to(SalesState.QUALIFICATION)

        elif self.state == SalesState.QUALIFICATION:
            budget_signals = ["budget", "approved", "we have", "allocated"]
            pain_signals = ["problem", "challenge", "issue", "struggle", "difficult"]
            if any(s in text for s in budget_signals + pain_signals):
                self.qualification_score += 25
            if self.qualification_score >= 50:
                self.transition_to(SalesState.DISCOVERY)

        elif self.state == SalesState.DISCOVERY:
            if len(self.pain_points) >= 1 or any(
                w in text for w in ["we currently", "we use", "right now", "at the moment"]
            ):
                self.transition_to(SalesState.VALUE_PROPOSITION)

        elif self.state == SalesState.VALUE_PROPOSITION:
            objection_signals = ["expensive", "cost", "price", "how much", "competitor", "already have"]
            closing_signals = ["demo", "show me", "interested", "how does it work", "when can"]
            if any(s in text for s in objection_signals):
                self.transition_to(SalesState.OBJECTION_HANDLING)
            elif any(s in text for s in closing_signals):
                self.transition_to(SalesState.CLOSING)

        elif self.state == SalesState.CLOSING:
            schedule_signals = [
                "yes", "sure", "works", "thursday", "friday", "monday",
                "next week", "what time", "calendar", "invite",
            ]
            if any(s in text for s in schedule_signals):
                self.transition_to(SalesState.SCHEDULING)
                if hasattr(self, "session") and self.session:
                    await self.sales_tools.create_follow_up(
                        reason="Meeting scheduling in progress",
                        action=f"Book meeting with {self.config.lead_name}",
                    )

        elif self.state == SalesState.SCHEDULING:
            confirm_signals = ["great", "perfect", "see you", "talk then", "thanks"]
            if any(s in text for s in confirm_signals):
                self.meeting_scheduled = True
                await self.tools.create_follow_up(
                    reason="Meeting scheduled from voice call",
                    action=f"Send calendar invite to {self.config.lead_name}",
                )
                self.transition_to(SalesState.END)
                await self.tools.finalize_call(
                    outcome="Meeting booked",
                    intent_score=min(100, self.qualification_score + len(self.pain_points) * 10),
                )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="voxsales-agent",
        )
    )
