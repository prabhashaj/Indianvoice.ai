"""
VoxSales AI — Sales Agent State Machine
Implements the structured sales conversation flow using an explicit state machine.
The LLM provides conversational intelligence within each state while the state machine
controls valid transitions and business rules.

States: INTRODUCTION → QUALIFICATION → DISCOVERY → VALUE_PROPOSITION →
        OBJECTION_HANDLING → CLOSING → SCHEDULING → HUMAN_HANDOFF → END
"""
import asyncio
import logging
from enum import Enum, auto
from typing import Optional

from livekit.agents import AgentSession, Agent
from livekit.agents.llm import ChatMessage, ChatRole

from config import VoiceAgentConfig
from states import SalesState
from prompts import build_system_prompt, get_state_instruction
from tools import AgentTools

logger = logging.getLogger(__name__)


# Valid state transitions — the agent cannot jump freely between states
VALID_TRANSITIONS: dict[SalesState, list[SalesState]] = {
    SalesState.INTRODUCTION: [
        SalesState.QUALIFICATION,
        SalesState.HUMAN_HANDOFF,
        SalesState.END,
    ],
    SalesState.QUALIFICATION: [
        SalesState.DISCOVERY,
        SalesState.OBJECTION_HANDLING,
        SalesState.HUMAN_HANDOFF,
        SalesState.END,
    ],
    SalesState.DISCOVERY: [
        SalesState.VALUE_PROPOSITION,
        SalesState.QUALIFICATION,
        SalesState.OBJECTION_HANDLING,
        SalesState.HUMAN_HANDOFF,
        SalesState.END,
    ],
    SalesState.VALUE_PROPOSITION: [
        SalesState.CLOSING,
        SalesState.OBJECTION_HANDLING,
        SalesState.DISCOVERY,
        SalesState.HUMAN_HANDOFF,
        SalesState.END,
    ],
    SalesState.OBJECTION_HANDLING: [
        SalesState.VALUE_PROPOSITION,
        SalesState.CLOSING,
        SalesState.DISCOVERY,
        SalesState.HUMAN_HANDOFF,
        SalesState.END,
    ],
    SalesState.CLOSING: [
        SalesState.SCHEDULING,
        SalesState.OBJECTION_HANDLING,
        SalesState.HUMAN_HANDOFF,
        SalesState.END,
    ],
    SalesState.SCHEDULING: [
        SalesState.END,
        SalesState.HUMAN_HANDOFF,
    ],
    SalesState.HUMAN_HANDOFF: [SalesState.END],
    SalesState.END: [],
}


class VoxSalesAgent(Agent):
    """
    The AI sales representative. Wraps the LiveKit Agent interface with
    an explicit sales state machine.
    """

    def __init__(self, config: VoiceAgentConfig, session: AgentSession, room):
        super().__init__(instructions=build_system_prompt(config))
        self.config = config
        self.session = session
        self.room = room
        self.state = SalesState.INTRODUCTION
        self.tools = AgentTools(config=config)
        self._end_event = asyncio.Event()

        # Conversation context
        self.qualification_score = 0
        self.objections_raised: list[str] = []
        self.pain_points: list[str] = []
        self.meeting_scheduled = False

        logger.info("[%s] Agent initialized in state: %s", config.call_id, self.state.name)

    def transition_to(self, new_state: SalesState) -> bool:
        """
        Attempt a state transition. Returns True if successful.
        Guards against invalid jumps.
        """
        if new_state in VALID_TRANSITIONS.get(self.state, []):
            logger.info("[%s] State: %s → %s", self.config.call_id, self.state.name, new_state.name)
            self.state = new_state
            return True
        logger.warning(
            "[%s] Invalid transition attempt: %s → %s",
            self.config.call_id, self.state.name, new_state.name,
        )
        return False

    async def on_enter_state(self):
        """
        Called when entering a new state.
        Injects a state-specific instruction into the conversation context.
        """
        instruction = get_state_instruction(self.state, self.config)
        if instruction:
            # Add a system message that guides the LLM within this state
            self.session.chat_ctx.append(
                ChatMessage(role=ChatRole.SYSTEM, content=instruction)
            )

    async def on_user_turn_completed(self, turn_ctx, new_message):
        """
        Called after each customer utterance. Analyzes the turn and may
        trigger state transitions or tool calls.
        """
        text = new_message.content.lower() if new_message.content else ""

        # Detect opt-out immediately — highest priority
        if any(phrase in text for phrase in [
            "don't call me", "remove me", "unsubscribe", "stop calling",
            "do not contact", "not interested", "take me off"
        ]):
            await self.tools.mark_do_not_contact(reason=new_message.content)
            self.transition_to(SalesState.END)
            await self.session.say(
                "I completely understand. I'll remove you from our list right away. "
                "Have a great day, and I'm sorry for any inconvenience.",
                allow_interruptions=True,
            )
            self._end_event.set()
            return

        # Detect human handoff request
        if any(phrase in text for phrase in [
            "speak to a human", "talk to a person", "real person",
            "manager", "your supervisor", "customer service"
        ]):
            self.transition_to(SalesState.HUMAN_HANDOFF)
            await self.on_enter_state()
            return

        # Detect call-end signals
        if any(phrase in text for phrase in [
            "goodbye", "bye", "have to go", "call me later",
            "not a good time", "busy right now"
        ]):
            if self.state not in (SalesState.SCHEDULING, SalesState.END):
                # Check if we can schedule a callback
                self.transition_to(SalesState.END)

        # State-specific analysis
        await self._analyze_turn(text)

    async def _analyze_turn(self, text: str):
        """
        Heuristic state transition logic based on conversation context.
        In production, this can be supplemented with LLM classification.
        """
        if self.state == SalesState.INTRODUCTION:
            # Move to qualification once prospect is engaged
            positive_signals = ["sure", "okay", "yes", "go ahead", "sounds good", "tell me"]
            if any(s in text for s in positive_signals):
                self.transition_to(SalesState.QUALIFICATION)
                await self.on_enter_state()

        elif self.state == SalesState.QUALIFICATION:
            # Move to discovery if qualified signals detected
            budget_signals = ["budget", "approved", "we have", "allocated"]
            pain_signals = ["problem", "challenge", "issue", "struggle", "difficult"]
            if any(s in text for s in budget_signals + pain_signals):
                self.qualification_score += 25
            if self.qualification_score >= 50:
                self.transition_to(SalesState.DISCOVERY)
                await self.on_enter_state()

        elif self.state == SalesState.DISCOVERY:
            # Move to value prop once pain is established
            if len(self.pain_points) >= 1 or any(
                w in text for w in ["we currently", "we use", "right now", "at the moment"]
            ):
                self.transition_to(SalesState.VALUE_PROPOSITION)
                await self.on_enter_state()

        elif self.state == SalesState.VALUE_PROPOSITION:
            # Objection or closing signals
            objection_signals = ["expensive", "cost", "price", "how much", "competitor", "already have"]
            closing_signals = ["demo", "show me", "interested", "how does it work", "when can"]
            if any(s in text for s in objection_signals):
                self.transition_to(SalesState.OBJECTION_HANDLING)
                await self.on_enter_state()
            elif any(s in text for s in closing_signals):
                self.transition_to(SalesState.CLOSING)
                await self.on_enter_state()

        elif self.state == SalesState.CLOSING:
            # Move to scheduling if they agree
            schedule_signals = [
                "yes", "sure", "works", "thursday", "friday", "monday",
                "next week", "what time", "calendar", "invite"
            ]
            if any(s in text for s in schedule_signals):
                self.transition_to(SalesState.SCHEDULING)
                await self.on_enter_state()

        elif self.state == SalesState.SCHEDULING:
            # End after scheduling is confirmed
            confirm_signals = ["great", "perfect", "see you", "talk then", "thanks"]
            if any(s in text for s in confirm_signals):
                self.meeting_scheduled = True
                await self.tools.create_follow_up(
                    reason="Meeting scheduled from voice call",
                    action=f"Send calendar invite to {self.config.lead_name}",
                )
                self.transition_to(SalesState.END)
                self._end_event.set()

    async def on_agent_state_changed(self, state):
        """Log LiveKit agent state changes for observability."""
        logger.debug("[%s] LiveKit agent state: %s", self.config.call_id, state)

    async def wait_for_end(self):
        """Wait until the sales session has concluded."""
        await self._end_event.wait()
        await self.tools.finalize_call(
            outcome="Meeting booked" if self.meeting_scheduled else "Completed",
            intent_score=min(100, self.qualification_score + len(self.pain_points) * 10),
        )
