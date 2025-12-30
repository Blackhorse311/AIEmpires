/**
 * @fileoverview AI Service Manager for LLM Provider Integration
 *
 * This module manages all LLM (Large Language Model) provider interactions:
 * - Connection testing for multiple providers
 * - Cost estimation based on model and faction tier
 * - Ollama (local LLM) status checking
 * - Provider and model recommendations
 *
 * @author AIEmpires Team
 * @version 1.0.0
 * @license MIT
 *
 * Supported Providers:
 * -------------------
 * - Anthropic (Claude): claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3.5-sonnet
 * - OpenAI (GPT): gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo
 * - Google (Gemini): gemini-pro, gemini-1.5-pro, gemini-1.5-flash
 * - Groq: llama-3.1-70b, llama-3.1-8b, mixtral-8x7b
 * - Ollama (Local): Any locally installed model (free)
 *
 * Cost Estimation:
 * ---------------
 * Costs are calculated based on:
 * - Provider's per-token pricing (input and output separately)
 * - Estimated tokens per operational period (varies by faction tier)
 * - Assumed gameplay patterns (4 periods/hour, 10 hours/month)
 *
 * Usage Example:
 * ```typescript
 * const manager = new AIServiceManager()
 *
 * // Test a connection
 * const isValid = await manager.testConnection('anthropic', 'sk-ant-...', 'claude-3-sonnet-20240229')
 *
 * // Get cost estimate
 * const cost = manager.getCostEstimate('anthropic', 'claude-3-sonnet-20240229', 'major')
 * console.log(`Estimated monthly cost: $${cost.estimatedCostPerMonth}`)
 * ```
 */

import axios from 'axios'

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Status information for the local Ollama installation.
 *
 * @property installed - Whether Ollama appears to be installed
 * @property running - Whether the Ollama server is currently running
 * @property models - Array of available model names
 */
interface OllamaStatus {
  installed: boolean
  running: boolean
  models: string[]
}

/**
 * Cost estimation breakdown for a provider/model/tier combination.
 *
 * @property provider - Provider ID (anthropic, openai, etc.)
 * @property model - Model identifier
 * @property factionTier - Faction tier (essential, major, full)
 * @property inputTokenCost - Cost per 1M input tokens in USD
 * @property outputTokenCost - Cost per 1M output tokens in USD
 * @property estimatedTokensPerPeriod - Total tokens used per operational period
 * @property estimatedCostPerPeriod - Cost in USD per operational period
 * @property estimatedCostPerMonth - Projected monthly cost based on typical usage
 * @property notes - Human-readable cost assessment
 */
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

// =============================================================================
// Pricing Configuration
// =============================================================================

/**
 * Token pricing data for all supported providers and models.
 *
 * Prices are in USD per 1 million tokens.
 * Data sourced from official provider pricing pages.
 * Last updated: December 2024
 *
 * @remarks
 * This data should be updated periodically as providers change their pricing.
 * Prices are approximate and may vary based on usage tier or region.
 *
 * Structure: { [provider]: { [model]: { input: number, output: number } } }
 */
const PROVIDER_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  // -------------------------------------------------------------------------
  // Anthropic Claude Models
  // https://www.anthropic.com/pricing
  // -------------------------------------------------------------------------
  anthropic: {
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },      // Most capable
    'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },     // Balanced
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },     // Fast & cheap
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 }    // Latest sonnet
  },

  // -------------------------------------------------------------------------
  // OpenAI GPT Models
  // https://openai.com/pricing
  // -------------------------------------------------------------------------
  openai: {
    'gpt-4-turbo': { input: 10.0, output: 30.0 },     // Previous flagship
    'gpt-4o': { input: 5.0, output: 15.0 },           // Current flagship
    'gpt-4o-mini': { input: 0.15, output: 0.6 },      // Budget option
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 }      // Legacy fast model
  },

  // -------------------------------------------------------------------------
  // Google Gemini Models
  // https://ai.google.dev/pricing
  // -------------------------------------------------------------------------
  google: {
    'gemini-pro': { input: 0.5, output: 1.5 },            // Standard
    'gemini-1.5-pro': { input: 3.5, output: 10.5 },       // Advanced
    'gemini-1.5-flash': { input: 0.075, output: 0.3 }     // Ultra-fast
  },

  // -------------------------------------------------------------------------
  // Groq Models (Ultra-fast inference)
  // https://groq.com/pricing
  // -------------------------------------------------------------------------
  groq: {
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },  // Powerful
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },     // Super cheap
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 }        // MoE model
  },

  // -------------------------------------------------------------------------
  // Ollama (Local models - free)
  // https://ollama.ai
  // -------------------------------------------------------------------------
  ollama: {
    'llama3.1': { input: 0, output: 0 },      // Meta's Llama 3.1
    'mistral': { input: 0, output: 0 },       // Mistral AI
    'codellama': { input: 0, output: 0 },     // Code-focused Llama
    'qwen2.5': { input: 0, output: 0 }        // Alibaba's Qwen
  }
}

/**
 * Estimated token usage per operational period based on faction tier.
 *
 * These estimates are based on:
 * - Average prompt size for faction state updates
 * - Average response size for strategic decisions
 * - Number of factions being processed
 *
 * Faction Tiers:
 * - essential: 5 major powers (great houses, ComStar)
 * - major: 15 significant factions (periphery states, merc commands)
 * - full: 25+ all factions with AI (including minor houses)
 */
const TOKENS_PER_PERIOD: Record<string, number> = {
  essential: 15000,   // ~5 factions × ~3000 tokens each
  major: 45000,       // ~15 factions × ~3000 tokens each
  full: 75000         // ~25 factions × ~3000 tokens each
}

/** Local Ollama server URL (default installation) */
const OLLAMA_URL = 'http://localhost:11434'

// =============================================================================
// AIServiceManager Class
// =============================================================================

/**
 * Manages LLM provider connections and cost estimation.
 *
 * This class provides:
 * - Connection testing for all supported providers
 * - Cost estimation based on usage patterns
 * - Ollama status checking for local LLM support
 * - Model recommendations by budget tier
 *
 * @example
 * ```typescript
 * const manager = new AIServiceManager()
 *
 * // Check if Ollama is running
 * const ollama = await manager.checkOllamaStatus()
 * if (ollama.running) {
 *   console.log(`Ollama has ${ollama.models.length} models`)
 * }
 *
 * // Get cost estimate for Claude
 * const estimate = manager.getCostEstimate('anthropic', 'claude-3-sonnet-20240229', 'major')
 * ```
 */
export class AIServiceManager {
  // ---------------------------------------------------------------------------
  // Connection Testing
  // ---------------------------------------------------------------------------

  /**
   * Tests connection to an LLM provider with the given credentials.
   *
   * Makes a minimal API call to verify:
   * - API key is valid
   * - Model is accessible
   * - Network connectivity works
   *
   * @param provider - Provider ID (anthropic, openai, google, groq, ollama)
   * @param apiKey - API key for the provider (ignored for Ollama)
   * @param model - Model identifier to test
   * @returns Promise resolving to true if connection successful
   *
   * @example
   * ```typescript
   * const valid = await manager.testConnection('anthropic', 'sk-ant-...', 'claude-3-haiku-20240307')
   * if (valid) {
   *   console.log('API key is valid!')
   * }
   * ```
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

  /**
   * Tests connection to Anthropic's Claude API.
   *
   * @param apiKey - Anthropic API key (starts with sk-ant-)
   * @param model - Claude model identifier
   * @returns Promise resolving to true if successful
   */
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

  /**
   * Tests connection to OpenAI's API.
   *
   * @param apiKey - OpenAI API key (starts with sk-)
   * @param model - GPT model identifier
   * @returns Promise resolving to true if successful
   */
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

  /**
   * Tests connection to Google's Gemini API.
   *
   * @param apiKey - Google AI API key
   * @param model - Gemini model identifier
   * @returns Promise resolving to true if successful
   */
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

  /**
   * Tests connection to Groq's API.
   *
   * Groq uses an OpenAI-compatible API format.
   *
   * @param apiKey - Groq API key
   * @param model - Model identifier (llama, mixtral, etc.)
   * @returns Promise resolving to true if successful
   */
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

  /**
   * Tests connection to a local Ollama instance.
   *
   * @param model - Model name as installed in Ollama
   * @returns Promise resolving to true if successful
   *
   * @remarks
   * Uses a longer timeout (30s) as local models may need to load into memory.
   */
  private async testOllama(model: string): Promise<boolean> {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model,
        prompt: 'Hello',
        stream: false
      },
      { timeout: 30000 }  // Longer timeout for model loading
    )
    return response.status === 200
  }

  // ---------------------------------------------------------------------------
  // Ollama Status
  // ---------------------------------------------------------------------------

  /**
   * Checks the status of the local Ollama installation.
   *
   * Attempts to connect to the local Ollama server and retrieve
   * the list of installed models.
   *
   * @returns Promise resolving to OllamaStatus object
   *
   * @example
   * ```typescript
   * const status = await manager.checkOllamaStatus()
   * if (status.running) {
   *   console.log('Available models:', status.models.join(', '))
   * } else {
   *   console.log('Start Ollama with: ollama serve')
   * }
   * ```
   */
  async checkOllamaStatus(): Promise<OllamaStatus> {
    try {
      // Query the Ollama API for available models
      const tagsResponse = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 })

      if (tagsResponse.status === 200) {
        // Extract model names from response
        const models = tagsResponse.data.models?.map((m: { name: string }) => m.name) || []
        return {
          installed: true,
          running: true,
          models
        }
      }
    } catch (error) {
      // Connection failed - Ollama not running or not installed
    }

    return {
      installed: false,
      running: false,
      models: []
    }
  }

  // ---------------------------------------------------------------------------
  // Model Information
  // ---------------------------------------------------------------------------

  /**
   * Gets the list of available models for a provider.
   *
   * @param provider - Provider ID
   * @returns Array of model identifiers
   */
  getAvailableModels(provider: string): string[] {
    return Object.keys(PROVIDER_PRICING[provider] || {})
  }

  /**
   * Gets the list of all supported providers.
   *
   * @returns Array of provider IDs
   */
  getProviders(): string[] {
    return Object.keys(PROVIDER_PRICING)
  }

  // ---------------------------------------------------------------------------
  // Cost Estimation
  // ---------------------------------------------------------------------------

  /**
   * Calculates cost estimate for a provider/model/faction tier combination.
   *
   * Estimation is based on:
   * - Provider's per-token pricing
   * - Estimated tokens per operational period
   * - Assumed 40% input / 60% output token ratio
   * - Assumed 4 operational periods per hour of gameplay
   * - Assumed 10 hours of gameplay per month
   *
   * @param provider - Provider ID
   * @param model - Model identifier
   * @param factionTier - Faction tier (essential, major, full)
   * @returns CostEstimate object or null if model pricing unknown
   *
   * @example
   * ```typescript
   * const estimate = manager.getCostEstimate('anthropic', 'claude-3-haiku-20240307', 'essential')
   * if (estimate) {
   *   console.log(`Per period: $${estimate.estimatedCostPerPeriod}`)
   *   console.log(`Per month: $${estimate.estimatedCostPerMonth}`)
   *   console.log(estimate.notes)  // "Very affordable for casual play"
   * }
   * ```
   */
  getCostEstimate(provider: string, model: string, factionTier: string): CostEstimate | null {
    const pricing = PROVIDER_PRICING[provider]?.[model]
    if (!pricing) {
      return null
    }

    // Get tokens per period based on faction tier
    const tokensPerPeriod = TOKENS_PER_PERIOD[factionTier] || TOKENS_PER_PERIOD.essential

    // Token distribution assumption: 40% input (prompts), 60% output (responses)
    // This ratio is based on typical LLM usage patterns
    const inputTokens = tokensPerPeriod * 0.4
    const outputTokens = tokensPerPeriod * 0.6

    // Calculate cost per operational period (30 in-game days)
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output
    const costPerPeriod = inputCost + outputCost

    // Monthly cost estimation:
    // - Assume ~4 operational periods per real-world hour of gameplay
    // - Assume ~10 hours of play per month (casual player)
    // - Total: ~40 operational periods per month
    const periodsPerMonth = 40
    const costPerMonth = costPerPeriod * periodsPerMonth

    // Generate human-readable cost assessment
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
      estimatedCostPerPeriod: Math.round(costPerPeriod * 10000) / 10000,  // 4 decimal places
      estimatedCostPerMonth: Math.round(costPerMonth * 100) / 100,        // 2 decimal places
      notes
    }
  }

  // ---------------------------------------------------------------------------
  // Recommendations
  // ---------------------------------------------------------------------------

  /**
   * Gets model recommendations organized by budget tier.
   *
   * Recommendations are based on:
   * - Cost-effectiveness for AIEmpires gameplay
   * - Model quality and response speed
   * - Availability and reliability
   *
   * @returns Object with budget, balanced, and premium model arrays
   *
   * @example
   * ```typescript
   * const recs = manager.getRecommendations()
   * console.log('Budget options:', recs.budget)
   * console.log('Premium options:', recs.premium)
   * ```
   */
  getRecommendations(): { budget: string[]; balanced: string[]; premium: string[] } {
    return {
      // Budget tier: Free or very cheap, suitable for testing or casual play
      budget: [
        'ollama:llama3.1',            // Free local model
        'ollama:mistral',             // Free local model
        'groq:llama-3.1-8b-instant',  // Ultra-cheap cloud
        'openai:gpt-4o-mini',         // Cheap and capable
        'google:gemini-1.5-flash'     // Google's budget option
      ],

      // Balanced tier: Good quality at reasonable cost for regular play
      balanced: [
        'groq:llama-3.1-70b-versatile',     // Great value
        'anthropic:claude-3-haiku-20240307', // Fast Claude
        'google:gemini-pro',                 // Google standard
        'openai:gpt-3.5-turbo'               // Reliable classic
      ],

      // Premium tier: Best quality for the best experience
      premium: [
        'anthropic:claude-3-5-sonnet-20241022', // Latest Claude
        'openai:gpt-4o',                        // OpenAI flagship
        'google:gemini-1.5-pro',                // Google flagship
        'anthropic:claude-3-opus-20240229'      // Most capable Claude
      ]
    }
  }
}
