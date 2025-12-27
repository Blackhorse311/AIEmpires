# SoloTech - Multi-Provider LLM Architecture

## Overview
The AI service supports multiple LLM providers, allowing users to choose based on:
- Cost preferences
- Privacy requirements (local models)
- API availability
- Model capabilities

## Supported Providers

### Cloud Providers

#### 1. Anthropic (Claude)
- **Models:** claude-sonnet-4-20250514, claude-3-opus, claude-3-haiku
- **API:** https://api.anthropic.com/v1/messages
- **Key Format:** `sk-ant-api03-...`
- **Best For:** Complex strategic reasoning, in-character responses
- **Cost:** Medium-High

#### 2. OpenAI (GPT)
- **Models:** gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **API:** https://api.openai.com/v1/chat/completions
- **Key Format:** `sk-...`
- **Best For:** Fast responses, good instruction following
- **Cost:** Medium

#### 3. Google (Gemini)
- **Models:** gemini-pro, gemini-1.5-pro, gemini-1.5-flash
- **API:** https://generativelanguage.googleapis.com/v1beta/
- **Key Format:** `AIza...`
- **Best For:** Good balance of speed and quality
- **Cost:** Low-Medium

#### 4. Groq (Fast Inference)
- **Models:** llama-3.1-70b, mixtral-8x7b
- **API:** https://api.groq.com/openai/v1/chat/completions
- **Key Format:** `gsk_...`
- **Best For:** Very fast responses, good for frequent decisions
- **Cost:** Low

#### 5. Mistral AI
- **Models:** mistral-large, mistral-medium, mistral-small
- **API:** https://api.mistral.ai/v1/chat/completions
- **Key Format:** `...`
- **Best For:** European data residency, good reasoning
- **Cost:** Medium

#### 6. Together.ai
- **Models:** Various open-source (Llama, Mixtral, etc.)
- **API:** https://api.together.xyz/v1/chat/completions
- **Key Format:** `...`
- **Best For:** Access to many open-source models
- **Cost:** Low

### Local Providers (No API Key Required)

#### 7. Ollama
- **Models:** llama3.1, mistral, codellama, etc.
- **API:** http://localhost:11434/api/generate
- **Requirements:** Ollama installed locally
- **Best For:** Privacy, no costs, offline play
- **Cost:** Free (hardware only)

#### 8. LM Studio
- **Models:** Any GGUF models
- **API:** http://localhost:1234/v1/chat/completions
- **Requirements:** LM Studio running with model loaded
- **Best For:** Easy local model management
- **Cost:** Free (hardware only)

#### 9. Text Generation WebUI (oobabooga)
- **Models:** Any transformers/GGUF
- **API:** http://localhost:5000/v1/chat/completions
- **Requirements:** WebUI running
- **Best For:** Advanced local deployment
- **Cost:** Free (hardware only)

## Architecture Design

```
┌─────────────────────────────────────────────────────────┐
│                    LLM Service                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              Provider Factory                    │   │
│  │  - Creates appropriate client based on config    │   │
│  │  - Validates API keys                           │   │
│  │  - Tests connectivity                           │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌───────────┬───────────┼───────────┬───────────┐    │
│  │           │           │           │           │    │
│  ▼           ▼           ▼           ▼           ▼    │
│ ┌───┐     ┌───┐     ┌───┐     ┌───┐     ┌───┐       │
│ │Claude│   │OpenAI│   │Groq│    │Ollama│  │LMStudio│  │
│ └───┘     └───┘     └───┘     └───┘     └───┘       │
│                          │                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Unified Response Handler               │   │
│  │  - Normalizes responses from all providers       │   │
│  │  - Handles errors/retries uniformly              │   │
│  │  - Provides consistent JSON output               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Provider Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    usage: Dict[str, int]  # tokens used
    latency_ms: float

class LLMProvider(ABC):
    """Abstract base class for all LLM providers"""

    @abstractmethod
    def generate(self,
                 system_prompt: str,
                 user_message: str,
                 temperature: float = 0.7,
                 max_tokens: int = 1024) -> LLMResponse:
        """Generate a response from the LLM"""
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """Test if the provider is accessible"""
        pass

    @abstractmethod
    def get_available_models(self) -> list[str]:
        """List available models for this provider"""
        pass
```

## Configuration Schema

```json
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "api_key": "sk-ant-...",
    "endpoint": null,
    "temperature": 0.7,
    "max_tokens": 1024,
    "timeout": 30,
    "retry_attempts": 3,
    "fallback_provider": {
      "provider": "ollama",
      "model": "llama3.1",
      "endpoint": "http://localhost:11434"
    }
  }
}
```

## Launcher UI Configuration

The launcher will provide:
1. **Provider Selection** - Dropdown with all supported providers
2. **API Key Input** - Secure input field (masked)
3. **Model Selection** - Dropdown populated based on provider
4. **Test Connection** - Button to verify settings work
5. **Local Model Detection** - Auto-detect Ollama/LM Studio if running
6. **Fallback Configuration** - Optional backup provider

## Implementation Priority

### Phase 1 (MVP)
- [x] Anthropic (Claude) - Already done
- [ ] OpenAI (GPT)
- [ ] Ollama (Local)

### Phase 2
- [ ] Groq (Fast/cheap)
- [ ] LM Studio
- [ ] Together.ai

### Phase 3
- [ ] Google Gemini
- [ ] Mistral
- [ ] Text Generation WebUI

## Cost Estimation (per faction turn)

Assuming ~1000 tokens per decision request:

| Provider | Model | Cost per 1M tokens | Cost per turn (15 factions) |
|----------|-------|-------------------|----------------------------|
| Anthropic | Claude Sonnet | $3 input / $15 output | ~$0.02 |
| OpenAI | GPT-4o | $5 input / $15 output | ~$0.02 |
| OpenAI | GPT-4o-mini | $0.15 input / $0.60 output | ~$0.001 |
| Groq | Llama 70B | $0.59 input / $0.79 output | ~$0.001 |
| Ollama | Any | Free | $0 |

## Recommendations by Use Case

1. **Best Quality:** Claude Sonnet or GPT-4o
2. **Best Value:** GPT-4o-mini or Groq Llama
3. **Offline/Privacy:** Ollama with Llama 3.1
4. **Fastest:** Groq
