import React, { useState, useEffect } from 'react'
import { Config, ModInfo, DownloadProgress } from '../App'
import './ModsPage.css'

interface ModsPageProps {
  config: Config
  gameDetected: boolean
}

function ModsPage({ config, gameDetected }: ModsPageProps): React.ReactElement {
  const [mods, setMods] = useState<ModInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gameDetected && config.gamePath) {
      loadMods()
    }
  }, [gameDetected, config.gamePath])

  useEffect(() => {
    if (downloading) {
      const unsubscribe = window.api.onModDownloadProgress((prog) => {
        setProgress(prog)
        if (prog.status === 'complete' && prog.current === prog.total) {
          setDownloading(false)
          loadMods()
        } else if (prog.status === 'error') {
          setError(prog.error || 'Download failed')
          setDownloading(false)
        }
      })
      return unsubscribe
    }
  }, [downloading])

  const loadMods = async () => {
    if (!config.gamePath) return
    setLoading(true)
    try {
      const installedMods = await window.api.getInstalledMods(config.gamePath)
      setMods(installedMods)
    } catch (err) {
      console.error('Failed to load mods:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!config.gamePath) return
    setDownloading(true)
    setError(null)
    setProgress(null)

    const result = await window.api.downloadMods(config.gamePath)
    if (!result.success) {
      setError(result.error || 'Download failed')
      setDownloading(false)
    }
  }

  if (!gameDetected) {
    return (
      <div className="mods-page">
        <div className="page-header">
          <h2>Mod Management</h2>
          <p>Install and manage AIEmpires mods</p>
        </div>
        <div className="card">
          <p className="warning-text">Please configure your game path first in the Settings tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mods-page">
      <div className="page-header">
        <h2>Mod Management</h2>
        <p>Install and manage AIEmpires mods</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="card">
        <div className="mod-actions">
          <h3>AIEmpires Mod Pack</h3>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Installing...' : 'Install/Update Mods'}
          </button>
        </div>

        {downloading && progress && (
          <div className="download-progress">
            <div className="progress-info">
              <span>{progress.mod}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="progress-status">
              {progress.status === 'downloading' && 'Downloading...'}
              {progress.status === 'extracting' && 'Extracting...'}
              {progress.status === 'complete' && 'Complete!'}
            </p>
          </div>
        )}

        <p className="mod-description">
          The AIEmpires mod pack includes 65+ carefully selected mods for the ultimate BattleTech experience,
          featuring advanced AI faction control, expanded content, and strategic gameplay enhancements.
        </p>
      </div>

      <div className="card">
        <h3>Installed Mods ({mods.length})</h3>
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading mods...</span>
          </div>
        ) : mods.length === 0 ? (
          <p className="no-mods">No mods installed. Click "Install/Update Mods" to get started.</p>
        ) : (
          <div className="mod-list">
            {mods.map((mod) => (
              <div key={mod.path} className={`mod-item ${mod.enabled ? '' : 'disabled'}`}>
                <div className="mod-info">
                  <span className="mod-name">{mod.name}</span>
                  <span className="mod-version">v{mod.version}</span>
                </div>
                <span className={`badge ${mod.enabled ? 'badge-success' : 'badge-warning'}`}>
                  {mod.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ModsPage
