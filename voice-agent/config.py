"""
VoxSales AI — Sales Agent Configuration
Parsed from LiveKit room metadata sent by the backend.
"""
import json
import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class VoiceAgentConfig:
    # Workspace / call context
    workspace_id: str = ""
    agent_id: str = ""
    lead_id: str = ""
    call_id: str = ""
    campaign_id: str = ""

    # Agent persona
    agent_name: str = "Alex"
    company_name: str = "VoxSales AI"
    objective: str = "Book a qualified discovery call"
    opening_script: str = ""
    qualification_criteria: str = ""
    tone: str = "Professional, consultative"
    objection_playbook: dict = field(default_factory=dict)

    # Lead context
    lead_name: str = "there"
    lead_company: str = ""
    lead_title: str = ""
    lead_pain_points: list = field(default_factory=list)

    # Voice
    tts_voice: str = "nova"  # voice ID for TTS provider

    # Provider
    llm_provider: str = "mistral"
    mistral_model: str = "mistral-large-latest"
    stt_provider: str = "deepgram"
    tts_provider: str = "elevenlabs"

    @classmethod
    def from_metadata(cls, metadata: str) -> "VoiceAgentConfig":
        """Parse config from LiveKit room metadata JSON."""
        if not metadata:
            return cls()
        try:
            data = json.loads(metadata)
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        except (json.JSONDecodeError, TypeError):
            return cls()

    @classmethod
    def from_env(cls) -> "VoiceAgentConfig":
        """Load defaults from environment (useful for dev mode)."""
        return cls(
            agent_name=os.getenv("DEV_AGENT_NAME", "Alex"),
            company_name=os.getenv("DEV_COMPANY_NAME", "VoxSales AI"),
            objective=os.getenv("DEV_OBJECTIVE", "Book a qualified discovery call"),
            mistral_model=os.getenv("MISTRAL_MODEL", "mistral-large-latest"),
        )
