"""
Base class for LLM providers.
All providers must implement this interface.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
import time
import logging

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider"""
    content: str
    model: str
    provider: str
    usage: Dict[str, int] = field(default_factory=dict)
    latency_ms: float = 0.0
    raw_response: Optional[Dict[str, Any]] = None


@dataclass
class ProviderConfig:
    """Configuration for an LLM provider"""
    provider: str
    model: str
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    timeout: int = 30
    retry_attempts: int = 3


class LLMProvider(ABC):
    """Abstract base class for all LLM providers"""

    def __init__(self, config: ProviderConfig):
        self.config = config
        self.name = self.__class__.__name__

    @abstractmethod
    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: Optional[float] = None,
                 max_tokens: Optional[int] = None) -> LLMResponse:
        """
        Generate a response from the LLM.

        Args:
            system_prompt: The system/persona prompt
            user_message: The user's message/query
            temperature: Override default temperature
            max_tokens: Override default max tokens

        Returns:
            LLMResponse with the generated content
        """
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """
        Test if the provider is accessible and configured correctly.

        Returns:
            True if connection is valid, False otherwise
        """
        pass

    @abstractmethod
    def get_available_models(self) -> List[str]:
        """
        List available models for this provider.

        Returns:
            List of model identifiers
        """
        pass

    def _measure_latency(self, func):
        """Decorator to measure function latency"""
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            latency = (time.time() - start) * 1000
            if isinstance(result, LLMResponse):
                result.latency_ms = latency
            return result
        return wrapper

    def generate_with_retry(self,
                           system_prompt: str,
                           user_message: str,
                           temperature: Optional[float] = None,
                           max_tokens: Optional[int] = None) -> Optional[LLMResponse]:
        """
        Generate with automatic retry on failure.

        Returns:
            LLMResponse or None if all retries fail
        """
        last_error = None
        for attempt in range(self.config.retry_attempts):
            try:
                return self.generate(system_prompt, user_message, temperature, max_tokens)
            except Exception as e:
                last_error = e
                logger.warning(f"{self.name} attempt {attempt + 1} failed: {e}")
                if attempt < self.config.retry_attempts - 1:
                    time.sleep(1 * (attempt + 1))  # Exponential backoff

        logger.error(f"{self.name} all {self.config.retry_attempts} attempts failed: {last_error}")
        return None
