"""
Indianvoice.ai — TTS Provider Adapter
Provider-agnostic text-to-speech.
Supports: Sarvam AI (Hindi/Telugu), ElevenLabs (Indian accents), Cartesia, PlayHT.
"""
import logging
import os

logger = logging.getLogger(__name__)

# ─── Sarvam AI Voices ─────────────────────────────────────────────────────────
# Sarvam bulbul:v1 voice IDs for Indian languages
SARVAM_VOICE_MAP = {
    # Hindi voices
    "priya":    "pavithra:en",       # Hindi female — warm, professional
    "arjun":    "amol:hi",           # Hindi male — confident
    "meera":    "meera:hi",          # Hindi female — friendly
    "rahul":    "rahul:hi",          # Hindi male — conversational
    # Telugu voices
    "ananya":   "ananya:te",         # Telugu female
    "krishna":  "chitra:te",         # Telugu male
    # English India voices
    "kavya":    "kavya:en",          # Indian English female
    "aarav":    "aarav:en",          # Indian English male
}

# ─── ElevenLabs Voices (Indian-accented) ──────────────────────────────────────
ELEVENLABS_VOICE_MAP = {
    # Indian English / Hindi accent voices
    "nova":     "21m00Tcm4TlvDq8ikWAM",  # Rachel — warm, neutral
    "meera":    "EXAVITQu4vr4xnSDxMaL",  # Bella — warm female (Indian-ish)
    "atlas":    "AZnzlk1XvdvUeBnXmlld",  # Domi — calm male
    "lyra":     "MF3mGyEYCl7XYWbV9V6O",  # Elli — soft female
    "orion":    "TxGEqnHWrfWFTfGW9XjX",  # Josh — confident male
    "priya":    "EXAVITQu4vr4xnSDxMaL",  # alias for Bella
    "arjun":    "AZnzlk1XvdvUeBnXmlld",  # alias for Domi
}

# ─── Cartesia Voices ──────────────────────────────────────────────────────────
CARTESIA_VOICE_MAP = {
    "nova":     "658607d6-26cd-4ab5-8a36-d964ee4b1051",
    "meera":    "8d673f7e-4a22-47fd-973a-ead9a85b7187",
    "atlas":    "922e8304-2630-4779-8a86-effedfa99a79",
    "lyra":     "64a941ac-07ac-462c-a81c-008e353dd83e",
    "orion":    "b1d18488-4aaa-47e7-9e4b-483c90a67968",
    "priya":    "8d673f7e-4a22-47fd-973a-ead9a85b7187",
    "arjun":    "922e8304-2630-4779-8a86-effedfa99a79",
}

# ─── Default voice per language ───────────────────────────────────────────────
LANGUAGE_DEFAULT_VOICE = {
    "hindi":    "priya",
    "hinglish": "priya",
    "telugu":   "ananya",
    "english":  "meera",
    "tamil":    "priya",
    "default":  "priya",
}


def get_default_voice_for_language(language: str) -> str:
    """Return the best default voice name for a given language."""
    lang = language.lower().strip()
    return LANGUAGE_DEFAULT_VOICE.get(lang, LANGUAGE_DEFAULT_VOICE["default"])


def build_tts_for_language(language: str, voice_id: str = ""):
    """
    Select the best TTS provider and voice for the given language.
    - Hindi / Telugu / Indian languages → Sarvam AI bulbul:v1
    - English / fallback → Cartesia or ElevenLabs
    """
    lang = language.lower().strip()
    voice = voice_id or get_default_voice_for_language(lang)

    sarvam_key = os.getenv("SARVAM_API_KEY", "")

    if lang in ("hindi", "hinglish", "telugu", "tamil", "kannada", "bengali", "marathi") and sarvam_key:
        logger.info("Using Sarvam TTS for language: %s voice: %s", lang, voice)
        return _build_sarvam_tts(voice, language)
    else:
        logger.info("Using Cartesia/ElevenLabs TTS for language: %s voice: %s", lang, voice)
        return build_tts(voice)


def build_tts(voice_id: str = "priya"):
    """Build the TTS provider. Default: Cartesia (when key set) or ElevenLabs."""
    default_provider = "cartesia" if os.getenv("CARTESIA_API_KEY") else "elevenlabs"
    provider = os.getenv("TTS_PROVIDER", default_provider)
    logger.info("Building TTS: provider=%s voice=%s", provider, voice_id)

    if provider == "sarvam":
        return _build_sarvam_tts(voice_id)
    elif provider == "cartesia":
        return _build_cartesia(voice_id)
    elif provider == "elevenlabs":
        return _build_elevenlabs(voice_id)
    elif provider == "playht":
        return _build_playht(voice_id)
    else:
        logger.warning("Unknown TTS provider '%s', falling back to Cartesia", provider)
        return _build_cartesia(voice_id)


def _build_sarvam_tts(voice_id: str, language: str = "hindi"):
    """
    Build Sarvam AI TTS (bulbul:v1) for Indian languages.
    Falls back to ElevenLabs if Sarvam is unavailable.
    """
    api_key = os.getenv("SARVAM_API_KEY", "")
    if not api_key:
        logger.warning("SARVAM_API_KEY not set — falling back to ElevenLabs for TTS")
        return _build_elevenlabs(voice_id)

    sarvam_voice = SARVAM_VOICE_MAP.get(voice_id.lower(), list(SARVAM_VOICE_MAP.values())[0])

    # Sarvam's TTS is HTTP-based — use ElevenLabs plugin for LiveKit streaming
    # and use Sarvam for pre-generated audio. For now use ElevenLabs as stream.
    # TODO: implement native Sarvam TTS LiveKit plugin when available
    logger.info("Sarvam TTS: voice=%s (LiveKit streaming via ElevenLabs fallback)", sarvam_voice)
    el_voice = ELEVENLABS_VOICE_MAP.get(voice_id.lower(), ELEVENLABS_VOICE_MAP["priya"])
    el_api_key = os.getenv("ELEVENLABS_API_KEY", "")
    try:
        from livekit.plugins import elevenlabs
        return elevenlabs.TTS(
            api_key=el_api_key,
            voice_id=el_voice,
            model="eleven_turbo_v2_5",
            stability=0.6,
            similarity_boost=0.8,
        )
    except ImportError:
        raise RuntimeError("livekit-plugins-elevenlabs is required")


def _build_elevenlabs(voice_id: str):
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key:
        logger.warning("ELEVENLABS_API_KEY not set")
    el_voice_id = ELEVENLABS_VOICE_MAP.get(voice_id.lower(), ELEVENLABS_VOICE_MAP["priya"])
    try:
        from livekit.plugins import elevenlabs
        return elevenlabs.TTS(
            api_key=api_key,
            voice_id=el_voice_id,
            model="eleven_turbo_v2_5",
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
