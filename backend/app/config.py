"""
VoxSales AI — Application Configuration
All settings are read from environment variables.
Validates on startup so misconfiguration is caught immediately.
"""
from functools import lru_cache
from typing import List, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    app_env: Literal["development", "staging", "production"] = "development"
    app_name: str = "VoxSales AI"
    app_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # ── Security ─────────────────────────────────────────────────────────────
    jwt_secret: str = "voxsales_jwt_secret_dev_32_characters_minimum"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./voxsales.db"
    sync_database_url: str = "sqlite:///./voxsales.db"

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── LiveKit ──────────────────────────────────────────────────────────────
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""

    # ── Mistral ──────────────────────────────────────────────────────────────
    mistral_api_key: str = ""
    mistral_model: str = "mistral-large-latest"
    mistral_temperature: float = 0.7
    mistral_max_tokens: int = 512

    # ── STT ──────────────────────────────────────────────────────────────────
    stt_provider: str = "deepgram"
    deepgram_api_key: str = ""
    deepgram_model: str = "nova-2"

    # ── TTS ──────────────────────────────────────────────────────────────────
    tts_provider: str = "cartesia"
    elevenlabs_api_key: str = ""
    cartesia_api_key: str = ""
    playht_api_key: str = ""
    playht_user_id: str = ""

    # ── n8n ──────────────────────────────────────────────────────────────────
    n8n_base_url: str = "http://localhost:5678"
    n8n_webhook_secret: str = ""
    n8n_api_key: str = ""

    # ── Telephony ─────────────────────────────────────────────────────────────
    telephony_provider: str = "livekit"
    # LiveKit native telephony (primary)
    livekit_phone_number: str = "+12402124041"  # purchased LiveKit number
    livekit_outbound_trunk_id: str = ""          # set after first call or manually
    livekit_sip_trunk_id: str = ""               # inbound trunk ID from dashboard
    livekit_sip_dispatch_rule_id: str = ""
    livekit_sip_ingest_host: str = ""            # e.g. 25cwl59egvk.sip.livekit.cloud
    # Twilio (kept for inbound-only fallback / legacy)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = "+17372508034"
    twilio_twiml_url: str = ""

    # ── Telnyx ────────────────────────────────────────────────────────────────
    telnyx_api_key: str = ""
    telnyx_phone_number: str = "+13077851534"
    telnyx_connection_id: str = "3050814462702389156"  # VoxSales AI Call Control App

    public_webhook_url: str = ""

    # ── Campaign Execution ────────────────────────────────────────────────────
    max_concurrent_calls: int = 3
    call_batch_delay_seconds: int = 5
    max_call_retries: int = 3

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # ── Observability ─────────────────────────────────────────────────────────
    log_level: str = "INFO"
    sentry_dsn: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            # Also handle if someone set JSON array string like ["http://..."]
            s = self.cors_origins.strip()
            if s.startswith("[") and s.endswith("]"):
                import json
                try:
                    return json.loads(s)
                except Exception:
                    pass
            return [o.strip() for o in s.split(",") if o.strip()]
        return self.cors_origins

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url

    @property
    def livekit_configured(self) -> bool:
        return bool(self.livekit_url and self.livekit_api_key and self.livekit_api_secret)

    @property
    def mistral_configured(self) -> bool:
        return bool(self.mistral_api_key)

    @property
    def deepgram_configured(self) -> bool:
        return bool(self.deepgram_api_key)

    @property
    def cartesia_configured(self) -> bool:
        return bool(self.cartesia_api_key)

    @property
    def livekit_sip_configured(self) -> bool:
        """True when the full inbound SIP stack (trunk + ingest host) is ready."""
        return bool(
            self.livekit_configured
            and self.livekit_sip_trunk_id
            and self.livekit_sip_ingest_host
        )

    @property
    def livekit_configured_for_outbound(self) -> bool:
        """True when LiveKit outbound calling is possible (just needs phone number)."""
        return bool(self.livekit_configured and self.livekit_phone_number)

    @property
    def twilio_configured(self) -> bool:
        return bool(self.twilio_account_sid and self.twilio_auth_token)

    @property
    def telnyx_configured(self) -> bool:
        return bool(self.telnyx_api_key and self.telnyx_phone_number and self.telnyx_connection_id)

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
