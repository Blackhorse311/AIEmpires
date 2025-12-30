import { contextBridge, ipcRenderer } from 'electron'

// Exposed API for the renderer process
const api = {
  // Game Detection
  detectGame: (): Promise<string | null> => ipcRenderer.invoke('detect-game'),
  browseGameFolder: (): Promise<string | null> => ipcRenderer.invoke('browse-game-folder'),
  validateGamePath: (path: string): Promise<boolean> => ipcRenderer.invoke('validate-game-path', path),

  // Mod Management
  getInstalledMods: (gamePath: string): Promise<ModInfo[]> => ipcRenderer.invoke('get-installed-mods', gamePath),
  downloadMods: (gamePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('download-mods', gamePath),
  onModDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('mod-download-progress', handler)
    return () => ipcRenderer.removeListener('mod-download-progress', handler)
  },

  // Configuration
  saveConfig: (config: Config): Promise<boolean> => ipcRenderer.invoke('save-config', config),
  loadConfig: (): Promise<Config | null> => ipcRenderer.invoke('load-config'),

  // AI Service
  testLLMConnection: (provider: string, apiKey: string, model: string): Promise<boolean> =>
    ipcRenderer.invoke('test-llm-connection', provider, apiKey, model),
  checkOllamaStatus: (): Promise<OllamaStatus> => ipcRenderer.invoke('check-ollama-status'),
  getCostEstimate: (provider: string, model: string, factionTier: string): Promise<CostEstimate | null> =>
    ipcRenderer.invoke('get-cost-estimate', provider, model, factionTier),

  // Game Launch
  launchGame: (gamePath: string): Promise<boolean> => ipcRenderer.invoke('launch-game', gamePath),

  // External Links
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('open-external', url),

  // Logging
  getLogConfig: (): Promise<LoggerConfig> => ipcRenderer.invoke('get-log-config'),
  setLogLevel: (level: number): Promise<void> => ipcRenderer.invoke('set-log-level', level),
  setLoggingEnabled: (enabled: boolean): Promise<void> => ipcRenderer.invoke('set-logging-enabled', enabled),
  exportLogs: (): Promise<string> => ipcRenderer.invoke('export-logs'),
  getRecentLogs: (count?: number): Promise<LogEntry[]> => ipcRenderer.invoke('get-recent-logs', count),
  clearLogs: (): Promise<void> => ipcRenderer.invoke('clear-logs'),
  getLogDirectory: (): Promise<string> => ipcRenderer.invoke('get-log-directory')
}

// Type definitions for the renderer
interface ModInfo {
  name: string
  version: string
  enabled: boolean
  path: string
  dependencies?: string[]
}

interface DownloadProgress {
  mod: string
  current: number
  total: number
  percentage: number
  status: 'downloading' | 'extracting' | 'complete' | 'error'
  error?: string
}

interface Config {
  gamePath?: string
  llmProvider?: string
  llmApiKey?: string
  llmModel?: string
  factionTier?: string
  autoUpdate?: boolean
  lastPlayed?: string
}

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

interface LoggerConfig {
  enabled: boolean
  level: number
  consoleOutput: boolean
  fileOutput: boolean
  maxFiles: number
  maxFileSizeMB: number
}

interface LogEntry {
  timestamp: string
  level: string
  module: string
  message: string
  data?: unknown
  stack?: string
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api)

// Type declaration for window.api
export type API = typeof api
