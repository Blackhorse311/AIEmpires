"""
Groq LLM Provider
Fast inference for open-source models
"""
import time
import logging
from typing import Optional, List

from .base import LLMProvider, LLMResponse, ProviderConfig

logger = logging.getLogger(__name__)


class GroqProvider(LLMProvider):
    """Provider for Groq's fast inference API"""

    AVAILABLE_MODELS = [
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        "llama-3.2-90b-text-preview",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize the Groq client (uses OpenAI-compatible API)"""
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.config.api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            logger.info(f"Groq client initialized with model: {self.config.model}")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
            raise

    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: Optional[float] = None,
                 max_tokens: Optional[int] = None) -> LLMResponse:
        """Generate a response using Groq"""
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
                provider="groq",
                usage={
                    "input_tokens": response.usage.prompt_tokens,
                    "output_tokens": response.usage.completion_tokens
                },
                latency_ms=latency,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
            )
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise

    def validate_connection(self) -> bool:
        """Test connection to Groq API"""
        try:
            response = self.client.chat.completions.create(
                model=self.config.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception as e:
            logger.error(f"Groq connection validation failed: {e}")
            return False

    def get_available_models(self) -> List[str]:
        """Return list of available Groq models"""
        return self.AVAILABLE_MODELS.copy()
