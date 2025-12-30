import axios from 'axios'

interface OllamaStatus {
  installed: boolean
  running: boolean
  models: string[]
}

interface CostEstimate {
  provider: string
  model: string
  factionTier: string
  inputTokenCost: number
  outputTokenCost: number
  estimatedTokensPerPeriod: number
  estimatedCostPerPeriod: number
  estimatedCostPerMonth: number
  notes: string
}

// Pricing per 1M tokens (as of late 2024)
const PROVIDER_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  anthropic: {
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
    'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 }
  },
  openai: {
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-4o': { input: 5.0, output: 15.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 }
  },
  google: {
    'gemini-pro': { input: 0.5, output: 1.5 },
    'gemini-1.5-pro': { input: 3.5, output: 10.5 },
    'gemini-1.5-flash': { input: 0.075, output: 0.3 }
  },
  groq: {
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 }
  },
  ollama: {
    // Ollama is free (local)
    'llama3.1': { input: 0, output: 0 },
    'mistral': { input: 0, output: 0 },
    'codellama': { input: 0, output: 0 },
    'qwen2.5': { input: 0, output: 0 }
  }
}

// Estimated tokens per operational period by faction tier
const TOKENS_PER_PERIOD: Record<string, number> = {
  essential: 15000,  // 5 factions
  major: 45000,      // 15 factions
  full: 75000        // 25+ factions
}

const OLLAMA_URL = 'http://localhost:11434'

export class AIServiceManager {
  /**
   * Test connection to an LLM provider
   */
  async testConnection(provider: string, apiKey: string, model: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'anthropic':
          return await this.testAnthropic(apiKey, model)
        case 'openai':
          return await this.testOpenAI(apiKey, model)
        case 'google':
          return await this.testGoogle(apiKey, model)
        case 'groq':
          return await this.testGroq(apiKey, model)
        case 'ollama':
          return await this.testOllama(model)
        default:
          return false
      }
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error)
      return false
    }
  }

  private async testAnthropic(apiKey: string, model: string): Promise<boolean> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    return response.status === 200
  }

  private async testOpenAI(apiKey: string, model: string): Promise<boolean> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    return response.status === 200
  }

  private async testGoogle(apiKey: string, model: string): Promise<boolean> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: 'Hello' }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    )
    return response.status === 200
  }

  private async testGroq(apiKey: string, model: string): Promise<boolean> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    return response.status === 200
  }

  private async testOllama(model: string): Promise<boolean> {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model,
        prompt: 'Hello',
        stream: false
      },
      { timeout: 30000 }
    )
    return response.status === 200
  }

  /**
   * Check Ollama status and available models
   */
  async checkOllamaStatus(): Promise<OllamaStatus> {
    try {
      // First check if Ollama is running
      const tagsResponse = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 })

      if (tagsResponse.status === 200) {
        const models = tagsResponse.data.models?.map((m: { name: string }) => m.name) || []
        return {
          installed: true,
          running: true,
          models
        }
      }
    } catch (error) {
      // Ollama not running or not installed
    }

    return {
      installed: false,
      running: false,
      models: []
    }
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: string): string[] {
    return Object.keys(PROVIDER_PRICING[provider] || {})
  }

  /**
   * Calculate cost estimate for a provider/model/tier combination
   */
  getCostEstimate(provider: string, model: string, factionTier: string): CostEstimate | null {
    const pricing = PROVIDER_PRICING[provider]?.[model]
    if (!pricing) {
      return null
    }

    const tokensPerPeriod = TOKENS_PER_PERIOD[factionTier] || TOKENS_PER_PERIOD.essential

    // Assume roughly 40% input, 60% output tokens
    const inputTokens = tokensPerPeriod * 0.4
    const outputTokens = tokensPerPeriod * 0.6

    // Cost per period (30 days of game time = 1 operational period)
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output
    const costPerPeriod = inputCost + outputCost

    // Assume ~4 operational periods per real-world session hour
    // And maybe 10 hours of play per month
    const periodsPerMonth = 40
    const costPerMonth = costPerPeriod * periodsPerMonth

    let notes = ''
    if (provider === 'ollama') {
      notes = 'Free - runs locally on your machine'
    } else if (costPerMonth < 1) {
      notes = 'Very affordable for casual play'
    } else if (costPerMonth < 5) {
      notes = 'Reasonable for regular play'
    } else if (costPerMonth < 20) {
      notes = 'Premium model - best for enthusiasts'
    } else {
      notes = 'High-end model - consider for special occasions'
    }

    return {
      provider,
      model,
      factionTier,
      inputTokenCost: pricing.input,
      outputTokenCost: pricing.output,
      estimatedTokensPerPeriod: tokensPerPeriod,
      estimatedCostPerPeriod: Math.round(costPerPeriod * 10000) / 10000,
      estimatedCostPerMonth: Math.round(costPerMonth * 100) / 100,
      notes
    }
  }

  /**
   * Get all providers
   */
  getProviders(): string[] {
    return Object.keys(PROVIDER_PRICING)
  }

  /**
   * Get recommended models per budget tier
   */
  getRecommendations(): { budget: string[]; balanced: string[]; premium: string[] } {
    return {
      budget: [
        'ollama:llama3.1',
        'ollama:mistral',
        'groq:llama-3.1-8b-instant',
        'openai:gpt-4o-mini',
        'google:gemini-1.5-flash'
      ],
      balanced: [
        'groq:llama-3.1-70b-versatile',
        'anthropic:claude-3-haiku-20240307',
        'google:gemini-pro',
        'openai:gpt-3.5-turbo'
      ],
      premium: [
        'anthropic:claude-3-5-sonnet-20241022',
        'openai:gpt-4o',
        'google:gemini-1.5-pro',
        'anthropic:claude-3-opus-20240229'
      ]
    }
  }
}
