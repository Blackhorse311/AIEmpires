"""
Anthropic (Claude) LLM Provider
"""
import time
import logging
from typing import Optional, List

from .base import LLMProvider, LLMResponse, ProviderConfig

logger = logging.getLogger(__name__)


class AnthropicProvider(LLMProvider):
    """Provider for Anthropic's Claude models"""

    AVAILABLE_MODELS = [
        "claude-sonnet-4-20250514",
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229",
        "claude-3-haiku-20240307",
    ]

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize the Anthropic client"""
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.config.api_key)
            logger.info(f"Anthropic client initialized with model: {self.config.model}")
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {e}")
            raise

    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: Optional[float] = None,
                 max_tokens: Optional[int] = None) -> LLMResponse:
        """Generate a response using Claude"""
        start_time = time.time()

        temp = temperature if temperature is not None else self.config.temperature
        tokens = max_tokens if max_tokens is not None else self.config.max_tokens

        try:
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=tokens,
                temperature=temp,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            latency = (time.time() - start_time) * 1000

            return LLMResponse(
                content=response.content[0].text,
                model=self.config.model,
                provider="anthropic",
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                },
                latency_ms=latency,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
            )
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            raise

    def validate_connection(self) -> bool:
        """Test connection to Anthropic API"""
        try:
            # Make a minimal request to verify credentials
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception as e:
            logger.error(f"Anthropic connection validation failed: {e}")
            return False

    def get_available_models(self) -> List[str]:
        """Return list of available Claude models"""
        return self.AVAILABLE_MODELS.copy()
