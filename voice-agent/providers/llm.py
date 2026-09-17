import logging
import os
from typing import Optional

from config import VoiceAgentConfig

# Must import at module level (main thread) so LiveKit plugin is registered correctly
from livekit.plugins import openai as lk_openai

logger = logging.getLogger(__name__)


def build_llm(config: Optional[VoiceAgentConfig] = None):
    """
    Build the LLM provider for the voice agent.
    Default: Mistral AI via OpenAI-compatible endpoint.
    """
    provider = (config.llm_provider if config else None) or os.getenv("LLM_PROVIDER", "mistral")
    model = (config.mistral_model if config else None) or os.getenv("MISTRAL_MODEL", "mistral-large-latest")
    api_key = os.getenv("MISTRAL_API_KEY", "")

    logger.info("Building LLM: provider=%s model=%s", provider, model)

    if provider == "mistral":
        return _build_mistral(model=model, api_key=api_key)
    elif provider == "openai":
        return _build_openai()
    else:
        logger.warning("Unknown LLM provider '%s', falling back to Mistral", provider)
        return _build_mistral(model=model, api_key=api_key)


def _build_mistral(model: str, api_key: str):
    """
    Mistral AI via OpenAI-compatible API endpoint.
    Mistral fully supports the OpenAI REST API format at api.mistral.ai/v1.
    """
    if not api_key:
        logger.warning("MISTRAL_API_KEY not set — LLM responses will be unavailable")

    logger.info("Using Mistral via OpenAI-compatible endpoint: %s", model)
    return lk_openai.LLM(
        model=model,
        api_key=api_key,
        base_url="https://api.mistral.ai/v1",
        temperature=float(os.getenv("MISTRAL_TEMPERATURE", "0.7")),
    )


def _build_openai():
    """OpenAI GPT fallback."""
    return lk_openai.LLM(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        api_key=os.getenv("OPENAI_API_KEY", ""),
    )

