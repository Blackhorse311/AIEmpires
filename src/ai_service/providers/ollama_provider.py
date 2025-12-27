"""
Ollama Local LLM Provider
Requires Ollama to be running locally: https://ollama.ai
"""
import time
import logging
import requests
from typing import Optional, List

from .base import LLMProvider, LLMResponse, ProviderConfig

logger = logging.getLogger(__name__)


class OllamaProvider(LLMProvider):
    """Provider for local Ollama models"""

    DEFAULT_ENDPOINT = "http://localhost:11434"

    # Common models - actual availability depends on what user has pulled
    COMMON_MODELS = [
        "llama3.1",
        "llama3.1:70b",
        "llama3.2",
        "mistral",
        "mixtral",
        "codellama",
        "phi3",
        "gemma2",
        "qwen2.5",
    ]

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self.endpoint = config.endpoint or self.DEFAULT_ENDPOINT
        logger.info(f"Ollama provider initialized at {self.endpoint} with model: {config.model}")

    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: Optional[float] = None,
                 max_tokens: Optional[int] = None) -> LLMResponse:
        """Generate a response using Ollama"""
        start_time = time.time()

        temp = temperature if temperature is not None else self.config.temperature

        try:
            # Ollama API format
            response = requests.post(
                f"{self.endpoint}/api/generate",
                json={
                    "model": self.config.model,
                    "prompt": user_message,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "temperature": temp,
                    }
                },
                timeout=self.config.timeout
            )
            response.raise_for_status()
            data = response.json()

            latency = (time.time() - start_time) * 1000

            return LLMResponse(
                content=data.get("response", ""),
                model=self.config.model,
                provider="ollama",
                usage={
                    "input_tokens": data.get("prompt_eval_count", 0),
                    "output_tokens": data.get("eval_count", 0)
                },
                latency_ms=latency,
                raw_response=data
            )
        except requests.exceptions.ConnectionError:
            logger.error(f"Cannot connect to Ollama at {self.endpoint}. Is Ollama running?")
            raise
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise

    def validate_connection(self) -> bool:
        """Test if Ollama is running and model is available"""
        try:
            # Check if Ollama is running
            response = requests.get(f"{self.endpoint}/api/tags", timeout=5)
            if response.status_code != 200:
                return False

            # Check if our model is available
            models = response.json().get("models", [])
            model_names = [m.get("name", "").split(":")[0] for m in models]
            model_base = self.config.model.split(":")[0]

            if model_base not in model_names:
                logger.warning(f"Model {self.config.model} not found. Available: {model_names}")
                return False

            return True
        except requests.exceptions.ConnectionError:
            logger.error(f"Ollama not running at {self.endpoint}")
            return False
        except Exception as e:
            logger.error(f"Ollama connection validation failed: {e}")
            return False

    def get_available_models(self) -> List[str]:
        """Get list of models available in this Ollama instance"""
        try:
            response = requests.get(f"{self.endpoint}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                return [m.get("name", "") for m in models]
        except Exception as e:
            logger.warning(f"Could not fetch Ollama models: {e}")

        # Return common models as fallback
        return self.COMMON_MODELS.copy()

    def pull_model(self, model_name: str) -> bool:
        """Pull a model if not already available"""
        try:
            logger.info(f"Pulling Ollama model: {model_name}")
            response = requests.post(
                f"{self.endpoint}/api/pull",
                json={"name": model_name},
                stream=True,
                timeout=None  # Pulling can take a long time
            )
            response.raise_for_status()
            logger.info(f"Successfully pulled model: {model_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            return False
