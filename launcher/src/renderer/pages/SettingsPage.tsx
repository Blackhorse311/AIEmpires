import React, { useState, useEffect } from 'react'
import { Config } from '../App'
import './SettingsPage.css'

interface SettingsPageProps {
  config: Config
  onConfigUpdate: (updates: Partial<Config>) => Promise<void>
  gameDetected: boolean
  onGameDetected: (detected: boolean) => void
}

interface LogConfig {
  enabled: boolean
  level: number
  consoleOutput: boolean
  fileOutput: boolean
  maxFiles: number
  maxFileSizeMB: number
}

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']

function SettingsPage({
  config,
  onConfigUpdate,
  gameDetected,
  onGameDetected
}: SettingsPageProps): React.ReactElement {
  const [detecting, setDetecting] = useState(false)
  const [logConfig, setLogConfig] = useState<LogConfig | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportPath, setExportPath] = useState<string | null>(null)

  useEffect(() => {
    loadLogConfig()
  }, [])

  const loadLogConfig = async () => {
    const config = await window.api.getLogConfig()
    setLogConfig(config)
  }

  const handleLogLevelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = parseInt(e.target.value, 10)
    await window.api.setLogLevel(level)
    await loadLogConfig()
  }

  const handleLoggingToggle = async () => {
    if (logConfig) {
      await window.api.setLoggingEnabled(!logConfig.enabled)
      await loadLogConfig()
    }
  }

  const handleExportLogs = async () => {
    setExporting(true)
    try {
      const path = await window.api.exportLogs()
      setExportPath(path)
      setTimeout(() => setExportPath(null), 5000)
    } finally {
      setExporting(false)
    }
  }

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all log files?')) {
      await window.api.clearLogs()
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

  const handleToggleAutoUpdate = async () => {
    await onConfigUpdate({ autoUpdate: !config.autoUpdate })
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure AIEmpires Launcher</p>
      </div>

      <div className="card">
        <h3>Game Location</h3>
        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-label">BattleTech Installation</span>
            <span className="setting-value">
              {config.gamePath || 'Not configured'}
            </span>
          </div>
          <div className="setting-actions">
            <button className="btn btn-secondary" onClick={handleBrowse}>
              Browse...
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleAutoDetect}
              disabled={detecting}
            >
              {detecting ? 'Detecting...' : 'Auto-Detect'}
            </button>
          </div>
        </div>
        <div className="status-indicator">
          <span className={`status-dot ${gameDetected ? 'success' : 'error'}`} />
          <span>{gameDetected ? 'Game found and verified' : 'Game not found'}</span>
        </div>
      </div>

      <div className="card">
        <h3>Updates</h3>
        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-label">Auto-Update Mods</span>
            <span className="setting-description">
              Automatically check for and download mod updates when launching
            </span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={config.autoUpdate || false}
              onChange={handleToggleAutoUpdate}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="card">
        <h3>About</h3>
        <div className="about-info">
          <div className="about-row">
            <span>Version</span>
            <span>0.1.0</span>
          </div>
          <div className="about-row">
            <span>Repository</span>
            <a
              href="#"
              onClick={() => window.api.openExternal('https://github.com/Blackhorse311/AIEmpires')}
            >
              github.com/Blackhorse311/AIEmpires
            </a>
          </div>
          <div className="about-row">
            <span>License</span>
            <span>MIT</span>
          </div>
        </div>
        <p className="about-description">
          AIEmpires brings LLM-powered faction AI to BattleTech, creating dynamic
          strategic gameplay where each faction has its own personality, goals, and
          decision-making process powered by modern AI.
        </p>
      </div>

      <div className="card">
        <h3>Logging</h3>
        <p className="card-description">
          Configure logging for troubleshooting. Export logs to send with bug reports.
        </p>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-label">Enable Logging</span>
            <span className="setting-description">
              Record application events for debugging
            </span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={logConfig?.enabled || false}
              onChange={handleLoggingToggle}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-label">Log Level</span>
            <span className="setting-description">
              DEBUG captures everything, ERROR only critical issues
            </span>
          </div>
          <select
            className="setting-select"
            value={logConfig?.level || 1}
            onChange={handleLogLevelChange}
            disabled={!logConfig?.enabled}
          >
            {LOG_LEVELS.map((level, index) => (
              <option key={level} value={index}>{level}</option>
            ))}
          </select>
        </div>

        <div className="log-actions">
          <button
            className="btn btn-primary"
            onClick={handleExportLogs}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Logs for Bug Report'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClearLogs}
          >
            Clear Logs
          </button>
        </div>

        {exportPath && (
          <div className="export-success">
            Logs exported! File location opened in explorer.
          </div>
        )}

        <p className="log-help">
          Having issues? Click "Export Logs for Bug Report" and attach the file
          when reporting issues on our{' '}
          <a
            href="#"
            onClick={() => window.api.openExternal('https://github.com/Blackhorse311/AIEmpires/issues')}
          >
            GitHub Issues
          </a>
          {' '}page.
        </p>
      </div>

      <div className="card">
        <h3>Links</h3>
        <div className="link-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => window.api.openExternal('https://github.com/Blackhorse311/AIEmpires/issues')}
          >
            Report Issue
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.api.openExternal('https://github.com/Blackhorse311/AIEmpires/wiki')}
          >
            Documentation
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.api.openExternal('https://discord.gg/battletech')}
          >
            Discord
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
