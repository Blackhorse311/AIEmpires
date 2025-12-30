import React, { useState } from 'react'
import { Config } from '../App'
import './HomePage.css'

interface HomePageProps {
  config: Config
  gameDetected: boolean
  onConfigUpdate: (updates: Partial<Config>) => Promise<void>
  onGameDetected: (detected: boolean) => void
}

function HomePage({ config, gameDetected, onConfigUpdate, onGameDetected }: HomePageProps): React.ReactElement {
  const [launching, setLaunching] = useState(false)
  const [detecting, setDetecting] = useState(false)

  const handleLaunch = async () => {
    if (!config.gamePath) return
    setLaunching(true)
    try {
      await window.api.launchGame(config.gamePath)
      await onConfigUpdate({ lastPlayed: new Date().toISOString() })
    } catch (error) {
      console.error('Failed to launch game:', error)
    } finally {
      setLaunching(false)
    }
  }

  const handleBrowse = async () => {
    const path = await window.api.browseGameFolder()
    if (path) {
      await onConfigUpdate({ gamePath: path })
      onGameDetected(true)
    }
  }

  const handleAutoDetect = async () => {
    setDetecting(true)
    try {
      const path = await window.api.detectGame()
      if (path) {
        await onConfigUpdate({ gamePath: path })
        onGameDetected(true)
      }
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <h2>Welcome to AIEmpires</h2>
        <p>LLM-powered faction AI for BattleTech</p>
      </div>

      {!gameDetected ? (
        <div className="card setup-card">
          <h3>Game Not Found</h3>
          <p>We couldn't detect your BattleTech installation. Please locate it manually or try auto-detect.</p>
          <div className="button-row">
            <button className="btn btn-primary" onClick={handleBrowse}>
              Browse...
            </button>
            <button className="btn btn-secondary" onClick={handleAutoDetect} disabled={detecting}>
              {detecting ? 'Detecting...' : 'Auto-Detect'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid-2">
            <div className="card status-card">
              <h3>Game Status</h3>
              <div className="status-row">
                <span className="label">Installation</span>
                <span className="value success">Detected</span>
              </div>
              <div className="status-row">
                <span className="label">Path</span>
                <span className="value path">{config.gamePath}</span>
              </div>
              <div className="status-row">
                <span className="label">Last Played</span>
                <span className="value">
                  {config.lastPlayed
                    ? new Date(config.lastPlayed).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </div>

            <div className="card status-card">
              <h3>AI Configuration</h3>
              <div className="status-row">
                <span className="label">Provider</span>
                <span className={`value ${config.llmProvider ? 'success' : 'warning'}`}>
                  {config.llmProvider || 'Not configured'}
                </span>
              </div>
              <div className="status-row">
                <span className="label">Model</span>
                <span className="value">{config.llmModel || '-'}</span>
              </div>
              <div className="status-row">
                <span className="label">Faction Tier</span>
                <span className="value">{config.factionTier || 'Essential (5)'}</span>
              </div>
            </div>
          </div>

          <div className="launch-section">
            <button
              className="btn btn-launch"
              onClick={handleLaunch}
              disabled={launching || !config.gamePath}
            >
              {launching ? 'Launching...' : 'Launch BattleTech'}
            </button>
            <p className="launch-hint">
              Make sure to configure your AI settings before playing for the full experience.
            </p>
          </div>

          <div className="card info-card">
            <h3>Getting Started</h3>
            <ol>
              <li>
                <strong>Install Mods</strong> - Go to the Mods tab to download and install the AIEmpires mod pack
              </li>
              <li>
                <strong>Configure AI</strong> - Set up your LLM provider in the AI Config tab
              </li>
              <li>
                <strong>Choose Your Era</strong> - Select from 8 different eras spanning 3025 to 3151+
              </li>
              <li>
                <strong>Play</strong> - Launch the game and experience dynamic faction AI!
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage
