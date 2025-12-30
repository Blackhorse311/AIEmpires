import React, { useState, useEffect } from 'react'
import { Config, OllamaStatus, CostEstimate } from '../App'
import './AIConfigPage.css'

interface AIConfigPageProps {
  config: Config
  onConfigUpdate: (updates: Partial<Config>) => Promise<void>
}

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', requiresKey: true },
  { id: 'openai', name: 'OpenAI (GPT)', requiresKey: true },
  { id: 'google', name: 'Google (Gemini)', requiresKey: true },
  { id: 'groq', name: 'Groq', requiresKey: true },
  { id: 'ollama', name: 'Ollama (Local)', requiresKey: false }
]

const MODELS: Record<string, string[]> = {
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  ollama: ['llama3.1', 'mistral', 'qwen2.5', 'codellama']
}

const FACTION_TIERS = [
  { id: 'essential', name: 'Essential (5 factions)', description: 'Major powers only' },
  { id: 'major', name: 'Major (15 factions)', description: 'All significant factions' },
  { id: 'full', name: 'Full (25+ factions)', description: 'Every faction with AI' }
]

function AIConfigPage({ config, onConfigUpdate }: AIConfigPageProps): React.ReactElement {
  const [provider, setProvider] = useState(config.llmProvider || '')
  const [apiKey, setApiKey] = useState(config.llmApiKey || '')
  const [model, setModel] = useState(config.llmModel || '')
  const [factionTier, setFactionTier] = useState(config.factionTier || 'essential')
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null)
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkOllama()
  }, [])

  useEffect(() => {
    if (provider && model && factionTier) {
      updateCostEstimate()
    }
  }, [provider, model, factionTier])

  const checkOllama = async () => {
    const status = await window.api.checkOllamaStatus()
    setOllamaStatus(status)
    if (status.running && status.models.length > 0) {
      MODELS.ollama = status.models
    }
  }

  const updateCostEstimate = async () => {
    const estimate = await window.api.getCostEstimate(provider, model, factionTier)
    setCostEstimate(estimate)
  }

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    setModel(MODELS[newProvider]?.[0] || '')
    setTestResult(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const success = await window.api.testLLMConnection(provider, apiKey, model)
      setTestResult(success ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await onConfigUpdate({
      llmProvider: provider,
      llmApiKey: apiKey,
      llmModel: model,
      factionTier
    })
    setSaving(false)
  }

  const selectedProvider = PROVIDERS.find(p => p.id === provider)
  const availableModels = MODELS[provider] || []

  return (
    <div className="ai-config-page">
      <div className="page-header">
        <h2>AI Configuration</h2>
        <p>Configure your LLM provider for faction AI</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>LLM Provider</h3>

          <div className="form-group">
            <label>Provider</label>
            <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
              <option value="">Select a provider...</option>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {provider === 'ollama' && ollamaStatus && (
            <div className={`ollama-status ${ollamaStatus.running ? 'running' : 'stopped'}`}>
              <span className="status-dot" />
              {ollamaStatus.running
                ? `Ollama running (${ollamaStatus.models.length} models)`
                : 'Ollama not running'}
            </div>
          )}

          {selectedProvider?.requiresKey && (
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
              />
            </div>
          )}

          <div className="form-group">
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!provider}>
              <option value="">Select a model...</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="button-row">
            <button
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={!provider || !model || testing || (selectedProvider?.requiresKey && !apiKey)}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult && (
              <span className={`test-result ${testResult}`}>
                {testResult === 'success' ? 'Connected!' : 'Failed'}
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Faction Tier</h3>
          <p className="tier-description">
            Choose how many factions will be controlled by AI. More factions = more API usage.
          </p>

          <div className="tier-options">
            {FACTION_TIERS.map((tier) => (
              <label
                key={tier.id}
                className={`tier-option ${factionTier === tier.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="factionTier"
                  value={tier.id}
                  checked={factionTier === tier.id}
                  onChange={(e) => setFactionTier(e.target.value)}
                />
                <div className="tier-info">
                  <span className="tier-name">{tier.name}</span>
                  <span className="tier-desc">{tier.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {costEstimate && (
        <div className="card cost-estimate">
          <h3>Cost Estimate</h3>
          <div className="cost-grid">
            <div className="cost-item">
              <span className="cost-label">Per Operational Period</span>
              <span className="cost-value">
                {costEstimate.estimatedCostPerPeriod === 0
                  ? 'Free'
                  : `$${costEstimate.estimatedCostPerPeriod.toFixed(4)}`}
              </span>
            </div>
            <div className="cost-item">
              <span className="cost-label">Est. Monthly (10hrs play)</span>
              <span className="cost-value">
                {costEstimate.estimatedCostPerMonth === 0
                  ? 'Free'
                  : `$${costEstimate.estimatedCostPerMonth.toFixed(2)}`}
              </span>
            </div>
            <div className="cost-item">
              <span className="cost-label">Tokens/Period</span>
              <span className="cost-value">{costEstimate.estimatedTokensPerPeriod.toLocaleString()}</span>
            </div>
          </div>
          <p className="cost-note">{costEstimate.notes}</p>
        </div>
      )}

      <div className="save-section">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !provider || !model}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}

export default AIConfigPage
