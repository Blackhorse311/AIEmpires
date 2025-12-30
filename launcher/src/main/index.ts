import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { existsSync } from 'fs'
import { findBattleTechInstall } from './gameDetector'
import { ModManager } from './modManager'
import { AIServiceManager } from './aiServiceManager'

let mainWindow: BrowserWindow | null = null
let modManager: ModManager | null = null
let aiServiceManager: AIServiceManager | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a2e',
    title: 'AIEmpires Launcher',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize managers
function initializeManagers(): void {
  modManager = new ModManager()
  aiServiceManager = new AIServiceManager()
}

// IPC Handlers
function setupIpcHandlers(): void {
  // Game Detection
  ipcMain.handle('detect-game', async () => {
    const gamePath = await findBattleTechInstall()
    return gamePath
  })

  ipcMain.handle('browse-game-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select BattleTech Installation Folder'
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const path = result.filePaths[0]
      // Verify it's a valid BattleTech install
      if (existsSync(join(path, 'BattleTech.exe')) || existsSync(join(path, 'BATTLETECH.exe'))) {
        return path
      }
      return null
    }
    return null
  })

  ipcMain.handle('validate-game-path', async (_, path: string) => {
    return existsSync(join(path, 'BattleTech.exe')) || existsSync(join(path, 'BATTLETECH.exe'))
  })

  // Mod Management
  ipcMain.handle('get-installed-mods', async (_, gamePath: string) => {
    return modManager?.getInstalledMods(gamePath) ?? []
  })

  ipcMain.handle('download-mods', async (_, gamePath: string) => {
    if (!modManager) return { success: false, error: 'Mod manager not initialized' }

    modManager.on('progress', (progress) => {
      mainWindow?.webContents.send('mod-download-progress', progress)
    })

    return await modManager.downloadAllMods(gamePath)
  })

  // Configuration
  ipcMain.handle('save-config', async (_, config: object) => {
    return modManager?.saveConfig(config) ?? false
  })

  ipcMain.handle('load-config', async () => {
    return modManager?.loadConfig() ?? null
  })

  // AI Service
  ipcMain.handle('test-llm-connection', async (_, provider: string, apiKey: string, model: string) => {
    return aiServiceManager?.testConnection(provider, apiKey, model) ?? false
  })

  ipcMain.handle('check-ollama-status', async () => {
    return aiServiceManager?.checkOllamaStatus() ?? { installed: false, models: [] }
  })

  ipcMain.handle('get-cost-estimate', async (_, provider: string, model: string, factionTier: string) => {
    return aiServiceManager?.getCostEstimate(provider, model, factionTier) ?? null
  })

  // Launch Game
  ipcMain.handle('launch-game', async (_, gamePath: string) => {
    const { spawn } = require('child_process')
    const exePath = existsSync(join(gamePath, 'BattleTech.exe'))
      ? join(gamePath, 'BattleTech.exe')
      : join(gamePath, 'BATTLETECH.exe')

    spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref()
    return true
  })

  // Open External Links
  ipcMain.handle('open-external', async (_, url: string) => {
    shell.openExternal(url)
    return true
  })
}

// App lifecycle
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.aiempires.launcher')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initializeManagers()
  setupIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
