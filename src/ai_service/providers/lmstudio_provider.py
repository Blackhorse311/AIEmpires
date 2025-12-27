"""
LM Studio Local LLM Provider
Requires LM Studio to be running with a model loaded
"""
import time
import logging
from typing import Optional, List

from .base import LLMProvider, LLMResponse, ProviderConfig

logger = logging.getLogger(__name__)


class LMStudioProvider(LLMProvider):
    """Provider for LM Studio local server"""

    DEFAULT_ENDPOINT = "http://localhost:1234/v1"

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.endpoint = config.endpoint or self.DEFAULT_ENDPOINT
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize the OpenAI-compatible client for LM Studio"""
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key="lm-studio",  # LM Studio doesn't require a real key
                base_url=self.endpoint
            )
            logger.info(f"LM Studio client initialized at {self.endpoint}")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        except Exception as e:
            logger.error(f"Failed to initialize LM Studio client: {e}")
            raise

    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: Optional[float] = None,
                 max_tokens: Optional[int] = None) -> LLMResponse:
        """Generate a response using LM Studio"""
        start_time = time.time()

        temp = temperature if temperature is not None else self.config.temperature
        tokens = max_tokens if max_tokens is not None else self.config.max_tokens

        try:
            response = self.client.chat.completions.create(
                model=self.config.model or "local-model",  # LM Studio uses whatever is loaded
                max_tokens=tokens,
                temperature=temp,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )

            latency = (time.time() - start_time) * 1000

            # LM Studio may not provide usage stats
            usage = {}
            if hasattr(response, 'usage') and response.usage:
                usage = {
                    "input_tokens": getattr(response.usage, 'prompt_tokens', 0),
                    "output_tokens": getattr(response.usage, 'completion_tokens', 0)
                }

            return LLMResponse(
                content=response.choices[0].message.content,
                model=self.config.model or "local-model",
                provider="lmstudio",
                usage=usage,
                latency_ms=latency,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
            )
        except Exception as e:
            logger.error(f"LM Studio generation failed: {e}")
            raise

    def validate_connection(self) -> bool:
        """Test if LM Studio is running with a model loaded"""
        try:
            # Try to list models - will fail if LM Studio isn't running
            models = self.client.models.list()
            if not models.data:
                logger.warning("LM Studio is running but no model is loaded")
                return False
            return True
        except Exception as e:
            logger.error(f"LM Studio connection validation failed: {e}")
            return False

    def get_available_models(self) -> List[str]:
        """Get list of models available in LM Studio"""
        try:
            models = self.client.models.list()
            return [m.id for m in models.data]
        except Exception as e:
            logger.warning(f"Could not fetch LM Studio models: {e}")
            return ["local-model"]
