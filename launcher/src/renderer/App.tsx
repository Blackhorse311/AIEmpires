import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ModsPage from './pages/ModsPage'
import AIConfigPage from './pages/AIConfigPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

declare global {
  interface Window {
    api: {
      detectGame: () => Promise<string | null>
      browseGameFolder: () => Promise<string | null>
      validateGamePath: (path: string) => Promise<boolean>
      getInstalledMods: (gamePath: string) => Promise<ModInfo[]>
      downloadMods: (gamePath: string) => Promise<{ success: boolean; error?: string }>
      onModDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
      saveConfig: (config: Config) => Promise<boolean>
      loadConfig: () => Promise<Config | null>
      testLLMConnection: (provider: string, apiKey: string, model: string) => Promise<boolean>
      checkOllamaStatus: () => Promise<OllamaStatus>
      getCostEstimate: (provider: string, model: string, factionTier: string) => Promise<CostEstimate | null>
      launchGame: (gamePath: string) => Promise<boolean>
      openExternal: (url: string) => Promise<boolean>
    }
  }
}

export interface ModInfo {
  name: string
  version: string
  enabled: boolean
  path: string
  dependencies?: string[]
}

export interface DownloadProgress {
  mod: string
  current: number
  total: number
  percentage: number
  status: 'downloading' | 'extracting' | 'complete' | 'error'
  error?: string
}

export interface Config {
  gamePath?: string
  llmProvider?: string
  llmApiKey?: string
  llmModel?: string
  factionTier?: string
  autoUpdate?: boolean
  lastPlayed?: string
}

export interface OllamaStatus {
  installed: boolean
  running: boolean
  models: string[]
}

export interface CostEstimate {
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

function App(): React.ReactElement {
  const [config, setConfig] = useState<Config>({})
  const [gameDetected, setGameDetected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialConfig()
  }, [])

  const loadInitialConfig = async () => {
    try {
      const savedConfig = await window.api.loadConfig()
      if (savedConfig) {
        setConfig(savedConfig)
        if (savedConfig.gamePath) {
          const valid = await window.api.validateGamePath(savedConfig.gamePath)
          setGameDetected(valid)
        }
      } else {
        // Try auto-detect
        const gamePath = await window.api.detectGame()
        if (gamePath) {
          setConfig({ gamePath })
          setGameDetected(true)
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (updates: Partial<Config>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    await window.api.saveConfig(newConfig)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner large" />
        <p>Loading AIEmpires...</p>
      </div>
    )
  }

  return (
    <HashRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <h1>AIEmpires</h1>
            <span className="version">v0.1.0</span>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="icon">&#9675;</span>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/mods" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="icon">&#9635;</span>
                Mods
              </NavLink>
            </li>
            <li>
              <NavLink to="/ai-config" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="icon">&#9733;</span>
                AI Config
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="icon">&#9881;</span>
                Settings
              </NavLink>
            </li>
          </ul>
          <div className="sidebar-footer">
            <a href="#" onClick={() => window.api.openExternal('https://github.com/Blackhorse311/AIEmpires')}>
              GitHub
            </a>
          </div>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={
              <HomePage
                config={config}
                gameDetected={gameDetected}
                onConfigUpdate={updateConfig}
                onGameDetected={setGameDetected}
              />
            } />
            <Route path="/mods" element={
              <ModsPage config={config} gameDetected={gameDetected} />
            } />
            <Route path="/ai-config" element={
              <AIConfigPage config={config} onConfigUpdate={updateConfig} />
            } />
            <Route path="/settings" element={
              <SettingsPage
                config={config}
                onConfigUpdate={updateConfig}
                gameDetected={gameDetected}
                onGameDetected={setGameDetected}
              />
            } />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
