"""
VoxSales AI — TTS Provider Adapter
Provider-agnostic text-to-speech with ElevenLabs as default.
Supports ElevenLabs, Cartesia, and PlayHT.
"""
import logging
import os

logger = logging.getLogger(__name__)

# Voice ID mapping — maps friendly names to provider voice IDs
ELEVENLABS_VOICE_MAP = {
    "nova": "21m00Tcm4TlvDq8ikWAM",         # Rachel — confident US female
    "meera": "EXAVITQu4vr4xnSDxMaL",         # Bella — warm female
    "atlas": "AZnzlk1XvdvUeBnXmlld",         # Domi — calm male
    "lyra": "MF3mGyEYCl7XYWbV9V6O",          # Elli — soft female
    "orion": "TxGEqnHWrfWFTfGW9XjX",         # Josh — bright male
}

CARTESIA_VOICE_MAP = {
    "nova": "658607d6-26cd-4ab5-8a36-d964ee4b1051",      # Elise - Efficient Liaison
    "meera": "8d673f7e-4a22-47fd-973a-ead9a85b7187",     # Lindiwe - Capable Professional
    "atlas": "922e8304-2630-4779-8a86-effedfa99a79",     # Albin - Information Steward
    "lyra": "64a941ac-07ac-462c-a81c-008e353dd83e",      # Layan - Clarity Provider
    "orion": "b1d18488-4aaa-47e7-9e4b-483c90a67968",     # Matias - Process Explainer
}


def build_tts(voice_id: str = "nova"):
    """Build the TTS provider. Default: Cartesia (when CARTESIA_API_KEY set) or ElevenLabs."""
    default_provider = "cartesia" if os.getenv("CARTESIA_API_KEY") else "elevenlabs"
    provider = os.getenv("TTS_PROVIDER", default_provider)
    logger.info("Building TTS: provider=%s voice=%s", provider, voice_id)

    if provider == "cartesia":
        return _build_cartesia(voice_id)
    elif provider == "elevenlabs":
        return _build_elevenlabs(voice_id)
    elif provider == "playht":
        return _build_playht(voice_id)
    else:
        logger.warning("Unknown TTS provider '%s', falling back to Cartesia", provider)
        return _build_cartesia(voice_id)


def _build_elevenlabs(voice_id: str):
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key:
        logger.warning("ELEVENLABS_API_KEY not set")
    # Map friendly voice name to ElevenLabs voice ID
    el_voice_id = ELEVENLABS_VOICE_MAP.get(voice_id.lower(), ELEVENLABS_VOICE_MAP["nova"])
    try:
        from livekit.plugins import elevenlabs
        return elevenlabs.TTS(
            api_key=api_key,
            voice_id=el_voice_id,
            model="eleven_turbo_v2_5",  # Low-latency model
            stability=0.5,
            similarity_boost=0.75,
        )
    except ImportError:
        raise RuntimeError("livekit-plugins-elevenlabs is required for ElevenLabs TTS")


def _build_cartesia(voice_id: str):
    api_key = os.getenv("CARTESIA_API_KEY", "")
    cartesia_id = CARTESIA_VOICE_MAP.get(voice_id.lower(), list(CARTESIA_VOICE_MAP.values())[0])
    try:
        from livekit.plugins import cartesia
        return cartesia.TTS(
            api_key=api_key,
            voice=cartesia_id,
            model="sonic-3.6",
        )
    except ImportError:
        raise RuntimeError("livekit-plugins-cartesia is required for Cartesia TTS")


def _build_playht(voice_id: str):
    api_key = os.getenv("PLAYHT_API_KEY", "")
    user_id = os.getenv("PLAYHT_USER_ID", "")
    try:
        from livekit.plugins import playai
        return playai.TTS(api_key=api_key, user_id=user_id)
    except ImportError:
        raise RuntimeError("livekit-plugins-playai is required for PlayHT TTS")
