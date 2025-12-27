"""
LLM Providers for SoloTech AI Service

Supports multiple LLM providers:
- Anthropic (Claude)
- OpenAI (GPT)
- Groq (Fast inference)
- Ollama (Local)
- LM Studio (Local)
"""

from .base import LLMProvider, LLMResponse, ProviderConfig
from .factory import (
    create_provider,
    create_provider_from_dict,
    get_available_providers,
    get_provider_info,
    detect_local_providers,
)

__all__ = [
    "LLMProvider",
    "LLMResponse",
    "ProviderConfig",
    "create_provider",
    "create_provider_from_dict",
    "get_available_providers",
    "get_provider_info",
    "detect_local_providers",
]
