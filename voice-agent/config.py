"""
Indianvoice.ai — Sales Agent Configuration
Parsed from LiveKit room metadata sent by the backend.
Now supports Indian languages (Hindi, Telugu, English, Hinglish)
and Indian telephony via Exotel.
"""
import json
import os
from dataclasses import dataclass, field
from typing import Optional, Literal

# Supported Indian languages
SUPPORTED_LANGUAGES = ["hindi", "english", "telugu", "hinglish", "tamil", "kannada", "bengali", "marathi", "gujarati"]

# Language display names
LANGUAGE_DISPLAY = {
    "hindi": "हिंदी",
    "english": "English (India)",
    "telugu": "తెలుగు",
    "hinglish": "Hinglish (Hindi + English)",
    "tamil": "தமிழ்",
    "kannada": "ಕನ್ನಡ",
    "bengali": "বাংলা",
    "marathi": "मराठी",
    "gujarati": "ગુજરાતી",
}


@dataclass
class VoiceAgentConfig:
    # Workspace / call context
    workspace_id: str = ""
    agent_id: str = ""
    lead_id: str = ""
    call_id: str = ""
    campaign_id: str = ""

    # Agent persona
    agent_name: str = "Priya"
    company_name: str = "Indianvoice.ai"
    objective: str = "Book a qualified discovery call"
    opening_script: str = ""
    qualification_criteria: str = ""
    tone: str = "Warm, conversational — like a trusted dost (friend)"
    objection_playbook: dict = field(default_factory=dict)

    # Lead context
    lead_name: str = "ji"
    lead_company: str = ""
    lead_title: str = ""
    lead_pain_points: list = field(default_factory=list)
    lead_phone: str = ""

    # ── Indian Language Settings ──────────────────────────────────────────────
    language: str = "hindi"          # Primary language: hindi / english / telugu / hinglish
    language_mode: str = "monolingual"  # monolingual / hinglish / bilingual
    # Whether to allow natural code-switching (Hinglish) even in Hindi mode
    allow_code_switch: bool = True

    # ── Voice ─────────────────────────────────────────────────────────────────
    tts_voice: str = "priya"         # Voice name from SARVAM/ElevenLabs/Cartesia map

    # ── Provider Selection ────────────────────────────────────────────────────
    llm_provider: str = "mistral"
    mistral_model: str = "mistral-large-latest"
    stt_provider: str = "sarvam"     # sarvam / deepgram
    tts_provider: str = "sarvam"     # sarvam / elevenlabs / cartesia

    # ── Telephony ─────────────────────────────────────────────────────────────
    telephony_provider: str = "exotel"  # exotel / twilio / telnyx / livekit
    caller_id: str = ""              # Indian caller ID (+91...)

    # ── TRAI Compliance ───────────────────────────────────────────────────────
    trai_enabled: bool = True
    calling_window_start: int = 9    # 9 AM IST
    calling_window_end: int = 21     # 9 PM IST
    max_calls_per_week: int = 3      # Per lead, per TRAI guidelines

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
            agent_name=os.getenv("DEV_AGENT_NAME", "Priya"),
            company_name=os.getenv("DEV_COMPANY_NAME", "Indianvoice.ai"),
            objective=os.getenv("DEV_OBJECTIVE", "Book a qualified discovery call"),
            language=os.getenv("DEV_LANGUAGE", "hindi"),
            mistral_model=os.getenv("MISTRAL_MODEL", "mistral-large-latest"),
        )

    @property
    def is_indian_language(self) -> bool:
        """True if the primary language is a non-English Indian language."""
        return self.language.lower() in (
            "hindi", "telugu", "hinglish", "tamil", "kannada", "bengali", "marathi", "gujarati"
        )

    @property
    def language_display_name(self) -> str:
        return LANGUAGE_DISPLAY.get(self.language.lower(), self.language.title())
