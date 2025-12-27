"""
LLM Provider Factory
Creates appropriate provider based on configuration
"""
import logging
from typing import Optional, Dict, Type

from .base import LLMProvider, ProviderConfig
from .anthropic_provider import AnthropicProvider
from .openai_provider import OpenAIProvider
from .ollama_provider import OllamaProvider
from .groq_provider import GroqProvider
from .lmstudio_provider import LMStudioProvider

logger = logging.getLogger(__name__)


# Registry of available providers
PROVIDERS: Dict[str, Type[LLMProvider]] = {
    "anthropic": AnthropicProvider,
    "claude": AnthropicProvider,  # Alias
    "openai": OpenAIProvider,
    "gpt": OpenAIProvider,  # Alias
    "ollama": OllamaProvider,
    "groq": GroqProvider,
    "lmstudio": LMStudioProvider,
    "lm-studio": LMStudioProvider,  # Alias
}

# Default models per provider
DEFAULT_MODELS: Dict[str, str] = {
    "anthropic": "claude-sonnet-4-20250514",
    "openai": "gpt-4o-mini",
    "ollama": "llama3.1",
    "groq": "llama-3.1-70b-versatile",
    "lmstudio": "local-model",
}


def create_provider(config: ProviderConfig) -> LLMProvider:
    """
    Create an LLM provider based on configuration.

    Args:
        config: Provider configuration

    Returns:
        Initialized LLM provider

    Raises:
        ValueError: If provider is not supported
    """
    provider_name = config.provider.lower()

    if provider_name not in PROVIDERS:
        available = list(set(PROVIDERS.keys()) - {"claude", "gpt", "lm-studio"})  # Remove aliases
        raise ValueError(
            f"Unknown provider: {config.provider}. "
            f"Available providers: {', '.join(available)}"
        )

    provider_class = PROVIDERS[provider_name]

    # Use default model if not specified
    if not config.model:
        base_name = provider_name
        if base_name == "claude":
            base_name = "anthropic"
        elif base_name == "gpt":
            base_name = "openai"
        elif base_name == "lm-studio":
            base_name = "lmstudio"

        config.model = DEFAULT_MODELS.get(base_name, "")

    logger.info(f"Creating {provider_name} provider with model: {config.model}")
    return provider_class(config)


def create_provider_from_dict(config_dict: dict) -> LLMProvider:
    """
    Create a provider from a dictionary configuration.

    Args:
        config_dict: Dictionary with provider settings

    Returns:
        Initialized LLM provider
    """
    config = ProviderConfig(
        provider=config_dict.get("provider", "anthropic"),
        model=config_dict.get("model", ""),
        api_key=config_dict.get("api_key"),
        endpoint=config_dict.get("endpoint"),
        temperature=config_dict.get("temperature", 0.7),
        max_tokens=config_dict.get("max_tokens", 1024),
        timeout=config_dict.get("timeout", 30),
        retry_attempts=config_dict.get("retry_attempts", 3),
    )
    return create_provider(config)


def get_available_providers() -> list:
    """Get list of available provider names (excluding aliases)"""
    return ["anthropic", "openai", "ollama", "groq", "lmstudio"]


def get_provider_info() -> dict:
    """
    Get information about all available providers.

    Returns:
        Dictionary with provider info including:
        - requires_api_key: bool
        - requires_local: bool (needs local software running)
        - default_model: str
        - description: str
    """
    return {
        "anthropic": {
            "name": "Anthropic (Claude)",
            "requires_api_key": True,
            "requires_local": False,
            "default_model": DEFAULT_MODELS["anthropic"],
            "description": "Best for complex strategic reasoning and in-character responses"
        },
        "openai": {
            "name": "OpenAI (GPT)",
            "requires_api_key": True,
            "requires_local": False,
            "default_model": DEFAULT_MODELS["openai"],
            "description": "Fast responses, good instruction following"
        },
        "groq": {
            "name": "Groq",
            "requires_api_key": True,
            "requires_local": False,
            "default_model": DEFAULT_MODELS["groq"],
            "description": "Very fast inference, low cost"
        },
        "ollama": {
            "name": "Ollama (Local)",
            "requires_api_key": False,
            "requires_local": True,
            "default_model": DEFAULT_MODELS["ollama"],
            "description": "Run models locally - free, private, offline capable"
        },
        "lmstudio": {
            "name": "LM Studio (Local)",
            "requires_api_key": False,
            "requires_local": True,
            "default_model": DEFAULT_MODELS["lmstudio"],
            "description": "Easy local model management with GUI"
        }
    }


def detect_local_providers() -> Dict[str, bool]:
    """
    Detect which local providers are available.

    Returns:
        Dictionary mapping provider name to availability
    """
    available = {}

    # Check Ollama
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        available["ollama"] = response.status_code == 200
    except Exception:
        available["ollama"] = False

    # Check LM Studio
    try:
        import requests
        response = requests.get("http://localhost:1234/v1/models", timeout=2)
        available["lmstudio"] = response.status_code == 200
    except Exception:
        available["lmstudio"] = False

    return available
