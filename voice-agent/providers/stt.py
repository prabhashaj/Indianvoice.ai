"""
Indianvoice.ai — STT Provider Adapter
Provider-agnostic speech-to-text with Deepgram as default.
"""
import logging
import os

logger = logging.getLogger(__name__)


def build_stt():
    """Build the STT provider. Default: Deepgram Nova-2."""
    provider = os.getenv("STT_PROVIDER", "deepgram")
    logger.info("Building STT: provider=%s", provider)

    if provider == "deepgram":
        return _build_deepgram()
    elif provider == "assemblyai":
        return _build_assemblyai()
    else:
        logger.warning("Unknown STT provider '%s', falling back to Deepgram", provider)
        return _build_deepgram()


def _build_deepgram():
    api_key = os.getenv("DEEPGRAM_API_KEY", "")
    model = os.getenv("DEEPGRAM_MODEL", "nova-2")
    if not api_key:
        logger.warning("DEEPGRAM_API_KEY not set")
    try:
        from livekit.plugins import deepgram
        return deepgram.STT(
            api_key=api_key,
            model=model,
            language="en-US",
            punctuate=True,
            interim_results=True,
            endpointing_ms=200,
        )
    except ImportError:
        raise RuntimeError("livekit-plugins-deepgram is required for Deepgram STT")


def _build_assemblyai():
    api_key = os.getenv("ASSEMBLYAI_API_KEY", "")
    try:
        from livekit.plugins import assemblyai
        return assemblyai.STT(api_key=api_key)
    except ImportError:
        raise RuntimeError("livekit-plugins-assemblyai is required for AssemblyAI STT")
