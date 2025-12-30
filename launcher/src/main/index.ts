/**
 * @fileoverview AIEmpires Launcher - Main Process Entry Point
 *
 * This is the main Electron process that handles:
 * - Window creation and lifecycle management
 * - IPC (Inter-Process Communication) between main and renderer processes
 * - Native OS integrations (file dialogs, external links, process spawning)
 * - Service initialization (ModManager, AIServiceManager)
 *
 * @author AIEmpires Team
 * @version 1.0.0
 * @license MIT
 *
 * Architecture Notes:
 * ------------------
 * The launcher follows Electron's process model:
 * - Main Process (this file): Node.js environment with full system access
 * - Renderer Process: Chromium-based UI with restricted access
 * - Preload Script: Bridge between main and renderer with controlled API exposure
 *
 * Security Considerations:
 * - contextIsolation: true - Prevents renderer from accessing Node.js APIs directly
 * - nodeIntegration: false - Renderer cannot use require() or Node modules
 * - All sensitive operations go through IPC handlers defined here
 */

import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { existsSync } from 'fs'
import { findBattleTechInstall } from './gameDetector'
import { ModManager } from './modManager'
import { AIServiceManager } from './aiServiceManager'

// =============================================================================
// Global State
// =============================================================================

/** Reference to the main application window */
let mainWindow: BrowserWindow | null = null

/** Singleton instance of the mod management service */
let modManager: ModManager | null = null

/** Singleton instance of the AI/LLM service manager */
let aiServiceManager: AIServiceManager | null = null

// =============================================================================
// Window Management
// =============================================================================

/**
 * Creates and configures the main application window.
 *
 * Window Features:
 * - Custom title bar with hidden menu
 * - Minimum size constraints for UI usability
 * - Dark background color matching the theme
 * - Secure preload script for IPC communication
 *
 * @remarks
 * The window is created hidden and shown only after 'ready-to-show' event
 * to prevent visual flash during initial render.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    // Window dimensions
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,

    // Visual settings
    show: false,                    // Hidden until ready to prevent flash
    autoHideMenuBar: true,          // Clean look without menu bar
    backgroundColor: '#1a1a2e',     // Match app theme during load
    title: 'AIEmpires Launcher',
    icon: join(__dirname, '../../resources/icon.png'),

    // Security settings
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,               // Required for preload script functionality
      contextIsolation: true,       // Isolate renderer from Node.js context
      nodeIntegration: false        // Prevent direct Node.js access in renderer
    }
  })

  // Show window only when fully rendered to prevent visual artifacts
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle external link clicks - open in default browser instead of new window
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }  // Prevent Electron from opening new window
  })

  // Load the appropriate URL based on environment
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Development: Use Vite dev server for hot reload
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Production: Load bundled HTML file
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// =============================================================================
// Service Initialization
// =============================================================================

/**
 * Initializes all application services.
 *
 * Services:
 * - ModManager: Handles mod downloading, installation, and configuration
 * - AIServiceManager: Manages LLM provider connections and cost estimation
 *
 * @remarks
 * Services are initialized once at app startup and persist for the session.
 * They maintain their own internal state and event emitters.
 */
function initializeManagers(): void {
  modManager = new ModManager()
  aiServiceManager = new AIServiceManager()
}

// =============================================================================
// IPC Handlers
// =============================================================================

/**
 * Sets up all IPC (Inter-Process Communication) handlers.
 *
 * IPC allows the renderer process to request actions that require
 * Node.js/system access. Each handler is a named channel that the
 * renderer can invoke through the preload script.
 *
 * Handler Categories:
 * - Game Detection: Find and validate BattleTech installation
 * - Mod Management: Install, update, and track mods
 * - Configuration: Save/load user preferences
 * - AI Service: Test connections, estimate costs
 * - Game Launch: Start BattleTech executable
 * - External Links: Open URLs in default browser
 */
function setupIpcHandlers(): void {
  // ---------------------------------------------------------------------------
  // Game Detection Handlers
  // ---------------------------------------------------------------------------

  /**
   * Attempts to automatically detect BattleTech installation.
   * Searches common Steam/GOG paths and Windows registry.
   * @returns {Promise<string | null>} Game path if found, null otherwise
   */
  ipcMain.handle('detect-game', async () => {
    const gamePath = await findBattleTechInstall()
    return gamePath
  })

  /**
   * Opens a folder selection dialog for manual game path selection.
   * Validates the selected folder contains BattleTech executable.
   * @returns {Promise<string | null>} Valid game path or null if invalid/cancelled
   */
  ipcMain.handle('browse-game-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select BattleTech Installation Folder'
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const path = result.filePaths[0]
      // Verify it's a valid BattleTech install by checking for executable
      // Note: Steam uses 'BattleTech.exe', some versions use 'BATTLETECH.exe'
      if (existsSync(join(path, 'BattleTech.exe')) || existsSync(join(path, 'BATTLETECH.exe'))) {
        return path
      }
      return null  // Selected folder doesn't contain BattleTech
    }
    return null  // User cancelled dialog
  })

  /**
   * Validates if a given path contains a valid BattleTech installation.
   * @param {string} path - Path to validate
   * @returns {Promise<boolean>} True if valid BattleTech installation
   */
  ipcMain.handle('validate-game-path', async (_, path: string) => {
    return existsSync(join(path, 'BattleTech.exe')) || existsSync(join(path, 'BATTLETECH.exe'))
  })

  // ---------------------------------------------------------------------------
  // Mod Management Handlers
  // ---------------------------------------------------------------------------

  /**
   * Retrieves list of all installed mods in the game's Mods folder.
   * Parses mod.json files to extract name, version, and enabled status.
   * @param {string} gamePath - Path to BattleTech installation
   * @returns {Promise<ModInfo[]>} Array of installed mod information
   */
  ipcMain.handle('get-installed-mods', async (_, gamePath: string) => {
    return modManager?.getInstalledMods(gamePath) ?? []
  })

  /**
   * Downloads and installs all mods from the AIEmpires manifest.
   * Emits progress events to renderer for UI updates.
   * @param {string} gamePath - Path to BattleTech installation
   * @returns {Promise<{success: boolean, error?: string}>} Result of operation
   */
  ipcMain.handle('download-mods', async (_, gamePath: string) => {
    if (!modManager) {
      return { success: false, error: 'Mod manager not initialized' }
    }

    // Forward progress events to renderer for UI updates
    modManager.on('progress', (progress) => {
      mainWindow?.webContents.send('mod-download-progress', progress)
    })

    return await modManager.downloadAllMods(gamePath)
  })

  // ---------------------------------------------------------------------------
  // Configuration Handlers
  // ---------------------------------------------------------------------------

  /**
   * Saves user configuration to persistent storage.
   * Configuration includes game path, LLM settings, and preferences.
   * @param {object} config - Configuration object to save
   * @returns {Promise<boolean>} True if save successful
   */
  ipcMain.handle('save-config', async (_, config: object) => {
    return modManager?.saveConfig(config) ?? false
  })

  /**
   * Loads user configuration from persistent storage.
   * @returns {Promise<Config | null>} Saved configuration or null if none exists
   */
  ipcMain.handle('load-config', async () => {
    return modManager?.loadConfig() ?? null
  })

  // ---------------------------------------------------------------------------
  // AI Service Handlers
  // ---------------------------------------------------------------------------

  /**
   * Tests connection to an LLM provider with the given credentials.
   * Makes a minimal API call to verify the key and model are valid.
   * @param {string} provider - Provider ID (anthropic, openai, google, groq, ollama)
   * @param {string} apiKey - API key for the provider
   * @param {string} model - Model identifier to test
   * @returns {Promise<boolean>} True if connection successful
   */
  ipcMain.handle('test-llm-connection', async (_, provider: string, apiKey: string, model: string) => {
    return aiServiceManager?.testConnection(provider, apiKey, model) ?? false
  })

  /**
   * Checks if Ollama is installed and running locally.
   * Lists available models if Ollama is active.
   * @returns {Promise<OllamaStatus>} Status object with installed, running, and models
   */
  ipcMain.handle('check-ollama-status', async () => {
    return aiServiceManager?.checkOllamaStatus() ?? { installed: false, running: false, models: [] }
  })

  /**
   * Calculates estimated API costs for a provider/model/tier combination.
   * Uses token pricing data and gameplay estimates to project costs.
   * @param {string} provider - LLM provider ID
   * @param {string} model - Model identifier
   * @param {string} factionTier - Faction tier (essential, major, full)
   * @returns {Promise<CostEstimate | null>} Cost breakdown or null if unknown model
   */
  ipcMain.handle('get-cost-estimate', async (_, provider: string, model: string, factionTier: string) => {
    return aiServiceManager?.getCostEstimate(provider, model, factionTier) ?? null
  })

  // ---------------------------------------------------------------------------
  // Game Launch Handler
  // ---------------------------------------------------------------------------

  /**
   * Launches the BattleTech executable.
   * Spawns the process detached so it continues after launcher closes.
   * @param {string} gamePath - Path to BattleTech installation
   * @returns {Promise<boolean>} True if launch initiated
   */
  ipcMain.handle('launch-game', async (_, gamePath: string) => {
    const { spawn } = require('child_process')

    // Determine which executable name exists
    const exePath = existsSync(join(gamePath, 'BattleTech.exe'))
      ? join(gamePath, 'BattleTech.exe')
      : join(gamePath, 'BATTLETECH.exe')

    // Spawn detached process that continues after launcher exits
    spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref()
    return true
  })

  // ---------------------------------------------------------------------------
  // External Links Handler
  // ---------------------------------------------------------------------------

  /**
   * Opens a URL in the user's default browser.
   * Used for GitHub links, documentation, Discord, etc.
   * @param {string} url - URL to open
   * @returns {Promise<boolean>} True (always succeeds)
   */
  ipcMain.handle('open-external', async (_, url: string) => {
    shell.openExternal(url)
    return true
  })
}

// =============================================================================
// Application Lifecycle
// =============================================================================

/**
 * Main application initialization.
 * Called when Electron has finished initialization and is ready to create windows.
 */
app.whenReady().then(() => {
  // Set the application ID for Windows taskbar grouping
  electronApp.setAppUserModelId('com.aiempires.launcher')

  // Watch for new windows and apply keyboard shortcut optimizations
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize services and create the main window
  initializeManagers()
  setupIpcHandlers()
  createWindow()

  // macOS: Re-create window when dock icon is clicked and no windows exist
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * Handle all windows being closed.
 * On macOS, applications typically stay active until explicitly quit.
 * On Windows/Linux, closing all windows quits the application.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
