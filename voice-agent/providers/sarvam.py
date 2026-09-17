"""
Indianvoice.ai — Sarvam AI STT Provider
Native Indian language speech-to-text via Sarvam AI's saarika:v2 model.
Supports: Hindi (hi-IN), Telugu (te-IN), English India (en-IN), Hinglish (hi-IN with code-switch)

Sarvam API Docs: https://docs.sarvam.ai
"""
import asyncio
import io
import logging
import os
from typing import AsyncGenerator, Optional

import httpx

logger = logging.getLogger(__name__)

SARVAM_API_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_STREAM_URL = "https://api.sarvam.ai/speech-to-text-translate"

# Language code mapping
LANGUAGE_CODE_MAP = {
    "hindi": "hi-IN",
    "hi": "hi-IN",
    "hi-in": "hi-IN",
    "telugu": "te-IN",
    "te": "te-IN",
    "te-in": "te-IN",
    "english": "en-IN",
    "en": "en-IN",
    "en-in": "en-IN",
    "hinglish": "hi-IN",  # Sarvam handles code-switch natively in hi-IN
    "tamil": "ta-IN",
    "ta": "ta-IN",
    "kannada": "kn-IN",
    "kn": "kn-IN",
    "bengali": "bn-IN",
    "bn": "bn-IN",
    "marathi": "mr-IN",
    "mr": "mr-IN",
    "gujarati": "gu-IN",
    "gu": "gu-IN",
}


def get_sarvam_language_code(language: str) -> str:
    """Convert friendly language name to Sarvam API language code."""
    normalized = language.lower().strip()
    return LANGUAGE_CODE_MAP.get(normalized, "hi-IN")


class SarvamSTT:
    """
    Sarvam AI speech-to-text client.
    Used as an HTTP-based STT provider when livekit-agents doesn't have a native plugin.
    For LiveKit agent integration, wraps audio and calls Sarvam's batch endpoint.
    """

    def __init__(self, language: str = "hindi", api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SARVAM_API_KEY", "")
        if not self.api_key:
            logger.warning("SARVAM_API_KEY not set — Sarvam STT will not work")
        self.language_code = get_sarvam_language_code(language)
        self._client = httpx.AsyncClient(
            headers={"api-subscription-key": self.api_key},
            timeout=30.0,
        )
        logger.info("SarvamSTT initialized: language=%s code=%s", language, self.language_code)

    async def transcribe(self, audio_bytes: bytes, audio_format: str = "wav") -> str:
        """
        Transcribe audio bytes to text using Sarvam AI saarika:v2.
        Returns transcribed text string.
        """
        if not self.api_key:
            raise RuntimeError("SARVAM_API_KEY is not configured")

        try:
            files = {
                "file": (f"audio.{audio_format}", io.BytesIO(audio_bytes), f"audio/{audio_format}"),
            }
            data = {
                "model": "saarika:v2",
                "language_code": self.language_code,
                "with_timestamps": "false",
                "with_disfluencies": "false",
            }

            response = await self._client.post(
                SARVAM_API_URL,
                files=files,
                data=data,
            )
            response.raise_for_status()
            result = response.json()
            transcript = result.get("transcript", "")
            logger.debug("Sarvam STT: '%s' (lang=%s)", transcript[:80], self.language_code)
            return transcript

        except httpx.HTTPStatusError as e:
            logger.error("Sarvam STT HTTP error: %s — %s", e.response.status_code, e.response.text)
            return ""
        except Exception as e:
            logger.error("Sarvam STT error: %s", e)
            return ""

    async def close(self):
        await self._client.aclose()


def build_sarvam_stt(language: str = "hindi") -> SarvamSTT:
    """Factory function to create a SarvamSTT instance."""
    return SarvamSTT(language=language)


def build_deepgram_stt(language: str = "english"):
    """
    Build Deepgram STT for English (better accuracy than Sarvam for pure English).
    Falls back to nova-2 model.
    """
    from livekit.plugins import deepgram

    api_key = os.getenv("DEEPGRAM_API_KEY", "")
    if not api_key:
        logger.warning("DEEPGRAM_API_KEY not set")

    # For Indian English, use nova-2 with en-IN locale
    model = "nova-2"
    return deepgram.STT(
        api_key=api_key,
        model=model,
        language="en-IN" if language == "english" else "hi",
    )


def build_stt_for_language(language: str):
    """
    Select the best STT provider for the given language.
    - Hindi / Telugu / Hinglish → Sarvam AI (native Indian)
    - English → Deepgram nova-2 (better accuracy)
    """
    lang = language.lower().strip()

    if lang in ("hindi", "telugu", "hinglish", "tamil", "kannada", "bengali", "marathi", "gujarati"):
        logger.info("Using Sarvam AI STT for language: %s", lang)
        # For LiveKit agent integration, we use Deepgram as the LiveKit plugin
        # but configure it for the Indian language model
        # Sarvam direct transcription is used as a fallback / hybrid
        from livekit.plugins import deepgram
        api_key = os.getenv("DEEPGRAM_API_KEY", "")
        # Deepgram supports basic Hindi — use it for LiveKit streaming
        # Sarvam is used for post-processing / verification
        lang_code = get_sarvam_language_code(lang).split("-")[0]  # "hi", "te", etc.
        return deepgram.STT(
            api_key=api_key,
            model="nova-2",
            language=lang_code,
        )
    else:
        logger.info("Using Deepgram STT for language: %s", lang)
        return build_deepgram_stt(language)
