"""
OpenAI (GPT) LLM Provider
"""
import time
import logging
from typing import Optional, List

from .base import LLMProvider, LLMResponse, ProviderConfig

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    """Provider for OpenAI's GPT models"""

    AVAILABLE_MODELS = [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
    ]

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize the OpenAI client"""
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.config.api_key)
            logger.info(f"OpenAI client initialized with model: {self.config.model}")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            raise

    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: Optional[float] = None,
                 max_tokens: Optional[int] = None) -> LLMResponse:
        """Generate a response using GPT"""
        start_time = time.time()

        temp = temperature if temperature is not None else self.config.temperature
        tokens = max_tokens if max_tokens is not None else self.config.max_tokens

        try:
            response = self.client.chat.completions.create(
                model=self.config.model,
                max_tokens=tokens,
                temperature=temp,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )

            latency = (time.time() - start_time) * 1000

            return LLMResponse(
                content=response.choices[0].message.content,
                model=self.config.model,
                provider="openai",
                usage={
                    "input_tokens": response.usage.prompt_tokens,
                    "output_tokens": response.usage.completion_tokens
                },
                latency_ms=latency,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
            )
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise

    def validate_connection(self) -> bool:
        """Test connection to OpenAI API"""
        try:
            response = self.client.chat.completions.create(
                model=self.config.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception as e:
            logger.error(f"OpenAI connection validation failed: {e}")
            return False

    def get_available_models(self) -> List[str]:
        """Return list of available GPT models"""
        return self.AVAILABLE_MODELS.copy()
