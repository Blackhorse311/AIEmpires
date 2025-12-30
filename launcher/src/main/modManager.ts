/**
 * @fileoverview AIEmpires Mod Manager
 *
 * This module handles all mod-related operations for the AIEmpires launcher:
 * - Scanning and listing installed mods
 * - Downloading and installing mods from the manifest
 * - Managing mod configuration (enable/disable)
 * - Verifying mod dependencies
 * - Persisting user configuration
 *
 * @author AIEmpires Team
 * @version 1.0.0
 * @license MIT
 *
 * Architecture Overview:
 * ---------------------
 * The ModManager uses a manifest-based distribution system where all mod
 * information is stored in a central JSON manifest on GitHub. This allows:
 * - Centralized version control for the entire mod pack
 * - Easy updates without changing the launcher
 * - Dependency ordering through tier-based installation
 *
 * Mod Tiers (installation order):
 * 1. framework - Core dependencies (ModTek, CustomAmmoCategories, etc.)
 * 2. core - Essential gameplay mods
 * 3. strategic - Campaign and strategic layer mods
 * 4. content - Additional content (mechs, weapons, etc.)
 * 5. optional - User-choice optional mods
 *
 * Events:
 * - 'progress': Emitted during mod download/installation with DownloadProgress data
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { EventEmitter } from 'events'
import axios from 'axios'
import extract from 'extract-zip'
import { app } from 'electron'

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Information about an installed mod parsed from its mod.json file.
 *
 * @property name - Display name of the mod
 * @property version - Semantic version string (e.g., "1.2.3")
 * @property enabled - Whether the mod is currently enabled
 * @property path - Absolute path to the mod folder
 * @property dependencies - Optional array of mod names this mod depends on
 */
interface ModInfo {
  name: string
  version: string
  enabled: boolean
  path: string
  dependencies?: string[]
}

/**
 * Structure of the remote mod manifest file.
 * This file is hosted on GitHub and contains the full mod pack definition.
 *
 * @property version - Manifest version for update checking
 * @property lastUpdated - ISO date string of last manifest update
 * @property mods - Array of mod definitions to install
 */
interface ModManifest {
  version: string
  lastUpdated: string
  mods: ModDefinition[]
}

/**
 * Definition of a single mod in the manifest.
 *
 * @property name - Mod name matching the folder name
 * @property version - Expected version after installation
 * @property downloadUrl - Direct download URL for the mod zip file
 * @property checksum - SHA256 hash for integrity verification (future use)
 * @property dependencies - Array of mod names that must be installed first
 * @property tier - Installation priority tier (lower = installed first)
 */
interface ModDefinition {
  name: string
  version: string
  downloadUrl: string
  checksum: string
  dependencies: string[]
  tier: 'framework' | 'core' | 'strategic' | 'content' | 'optional'
}

/**
 * Progress information emitted during mod download/installation.
 * Used by the renderer to display progress UI.
 *
 * @property mod - Name of the mod currently being processed
 * @property current - Number of mods completed so far
 * @property total - Total number of mods to install
 * @property percentage - Completion percentage (0-100)
 * @property status - Current operation status
 * @property error - Error message if status is 'error'
 */
interface DownloadProgress {
  mod: string
  current: number
  total: number
  percentage: number
  status: 'downloading' | 'extracting' | 'complete' | 'error'
  error?: string
}

/**
 * User configuration stored locally.
 * Persisted to the user's app data directory.
 *
 * @property gamePath - Path to BattleTech installation
 * @property llmProvider - Selected LLM provider ID
 * @property llmApiKey - Encrypted API key for the provider
 * @property llmModel - Selected model identifier
 * @property factionTier - Selected faction tier (essential/major/full)
 * @property autoUpdate - Whether to auto-check for mod updates
 * @property lastPlayed - ISO date string of last game launch
 */
interface Config {
  gamePath?: string
  llmProvider?: string
  llmApiKey?: string
  llmModel?: string
  factionTier?: string
  autoUpdate?: boolean
  lastPlayed?: string
}

// =============================================================================
// Constants
// =============================================================================

/**
 * URL to the mod manifest file on GitHub.
 * This file defines all mods in the AIEmpires pack with download URLs.
 */
const MANIFEST_URL = 'https://raw.githubusercontent.com/Blackhorse311/AIEmpires/main/manifest.json'

/** Name of the local configuration file */
const CONFIG_FILE = 'aiempires-config.json'

// =============================================================================
// ModManager Class
// =============================================================================

/**
 * Manages all mod-related operations for the AIEmpires launcher.
 *
 * This class extends EventEmitter to allow progress tracking during
 * long-running operations like mod downloads.
 *
 * @example
 * ```typescript
 * const manager = new ModManager()
 *
 * // Listen for download progress
 * manager.on('progress', (progress) => {
 *   console.log(`${progress.mod}: ${progress.percentage}%`)
 * })
 *
 * // Download all mods
 * const result = await manager.downloadAllMods('C:/Games/BATTLETECH')
 * if (result.success) {
 *   console.log('All mods installed!')
 * }
 * ```
 */
export class ModManager extends EventEmitter {
  /** Path to the user's configuration file */
  private configPath: string

  /** Path to the mod download cache directory */
  private cacheDir: string

  /**
   * Creates a new ModManager instance.
   *
   * Initializes paths using Electron's app.getPath() for platform-appropriate
   * locations and ensures the cache directory exists.
   */
  constructor() {
    super()

    // Use Electron's userData path for configuration storage
    // Windows: %APPDATA%/aiempires-launcher
    // macOS: ~/Library/Application Support/aiempires-launcher
    // Linux: ~/.config/aiempires-launcher
    this.configPath = join(app.getPath('userData'), CONFIG_FILE)
    this.cacheDir = join(app.getPath('userData'), 'mod-cache')

    // Ensure cache directory exists for mod downloads
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  // ---------------------------------------------------------------------------
  // Mod Discovery
  // ---------------------------------------------------------------------------

  /**
   * Scans the game's Mods folder and returns information about installed mods.
   *
   * This function reads each mod's mod.json file to extract:
   * - Name and version
   * - Enabled/disabled state
   * - Dependencies
   *
   * @param gamePath - Path to the BattleTech installation
   * @returns Array of ModInfo objects for each installed mod
   *
   * @remarks
   * If a mod.json file is missing or invalid, the mod is still listed
   * with the folder name and "unknown" version to ensure visibility.
   *
   * @example
   * ```typescript
   * const mods = manager.getInstalledMods('C:/Games/BATTLETECH')
   * console.log(`Found ${mods.length} mods`)
   * mods.forEach(mod => console.log(`- ${mod.name} v${mod.version}`))
   * ```
   */
  getInstalledMods(gamePath: string): ModInfo[] {
    const modsPath = join(gamePath, 'Mods')
    const installedMods: ModInfo[] = []

    // Return empty array if Mods folder doesn't exist
    if (!existsSync(modsPath)) {
      return installedMods
    }

    // Get all directories in the Mods folder
    const modFolders = readdirSync(modsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    // Parse each mod's mod.json file
    for (const folder of modFolders) {
      const modJsonPath = join(modsPath, folder, 'mod.json')

      if (existsSync(modJsonPath)) {
        try {
          // Parse the mod.json file
          const modJson = JSON.parse(readFileSync(modJsonPath, 'utf8'))

          installedMods.push({
            name: modJson.Name || folder,
            version: modJson.Version || 'unknown',
            enabled: modJson.Enabled !== false,  // Default to enabled if not specified
            path: join(modsPath, folder),
            dependencies: modJson.DependsOn || []
          })
        } catch (error) {
          // If mod.json is invalid JSON, still list the mod with defaults
          // This ensures users can see and manage broken mods
          installedMods.push({
            name: folder,
            version: 'unknown',
            enabled: true,
            path: join(modsPath, folder)
          })
        }
      }
    }

    return installedMods
  }

  // ---------------------------------------------------------------------------
  // Manifest Operations
  // ---------------------------------------------------------------------------

  /**
   * Fetches the mod manifest from the GitHub repository.
   *
   * The manifest contains all mod definitions including download URLs,
   * versions, and dependency information.
   *
   * @returns Promise resolving to ModManifest or null if fetch fails
   *
   * @remarks
   * Uses Cache-Control: no-cache to ensure fresh data on each request.
   * Has a 10-second timeout to prevent hanging on slow connections.
   */
  async fetchManifest(): Promise<ModManifest | null> {
    try {
      const response = await axios.get(MANIFEST_URL, {
        timeout: 10000,  // 10 second timeout
        headers: { 'Cache-Control': 'no-cache' }  // Bypass caches for fresh data
      })
      return response.data as ModManifest
    } catch (error) {
      console.error('Failed to fetch manifest:', error)
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Mod Installation
  // ---------------------------------------------------------------------------

  /**
   * Downloads and installs all mods from the manifest.
   *
   * This is the main installation function that:
   * 1. Fetches the manifest from GitHub
   * 2. Sorts mods by tier to ensure dependencies are installed first
   * 3. Downloads each mod's zip file
   * 4. Extracts the zip to the game's Mods folder
   * 5. Emits progress events throughout
   *
   * @param gamePath - Path to the BattleTech installation
   * @returns Promise with success status and optional error message
   *
   * @fires ModManager#progress
   *
   * @example
   * ```typescript
   * manager.on('progress', (p) => updateUI(p))
   * const result = await manager.downloadAllMods(gamePath)
   * if (!result.success) {
   *   showError(result.error)
   * }
   * ```
   */
  async downloadAllMods(gamePath: string): Promise<{ success: boolean; error?: string }> {
    // Fetch the manifest
    const manifest = await this.fetchManifest()
    if (!manifest) {
      return { success: false, error: 'Failed to fetch mod manifest' }
    }

    // Ensure Mods folder exists
    const modsPath = join(gamePath, 'Mods')
    if (!existsSync(modsPath)) {
      mkdirSync(modsPath, { recursive: true })
    }

    const totalMods = manifest.mods.length
    let completedMods = 0

    // Sort mods by tier to ensure dependencies are installed first
    // Tier order: framework -> core -> strategic -> content -> optional
    const tierOrder = ['framework', 'core', 'strategic', 'content', 'optional']
    const sortedMods = [...manifest.mods].sort((a, b) => {
      return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
    })

    // Download and install each mod
    for (const mod of sortedMods) {
      try {
        // Emit downloading status
        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'downloading'
        } as DownloadProgress)

        // Download mod to cache
        const zipPath = join(this.cacheDir, `${mod.name}.zip`)
        await this.downloadFile(mod.downloadUrl, zipPath)

        // Emit extracting status
        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'extracting'
        } as DownloadProgress)

        // Extract to mods folder
        await extract(zipPath, { dir: modsPath })

        // Update progress
        completedMods++
        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'complete'
        } as DownloadProgress)

      } catch (error) {
        // Handle installation failure
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'error',
          error: errorMessage
        } as DownloadProgress)

        return { success: false, error: `Failed to install ${mod.name}: ${errorMessage}` }
      }
    }

    return { success: true }
  }

  /**
   * Downloads a file from a URL to a local path.
   *
   * @param url - URL to download from
   * @param destPath - Local path to save the file
   *
   * @remarks
   * Uses a 5-minute timeout to accommodate large mod files on slow connections.
   * Downloads the entire file to memory before writing (suitable for mod-sized files).
   */
  private async downloadFile(url: string, destPath: string): Promise<void> {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 300000  // 5 minute timeout for large files
    })

    writeFileSync(destPath, Buffer.from(response.data))
  }

  // ---------------------------------------------------------------------------
  // Update Checking
  // ---------------------------------------------------------------------------

  /**
   * Checks for available mod updates by comparing installed versions to manifest.
   *
   * @param gamePath - Path to the BattleTech installation
   * @returns Array of ModDefinition objects for mods with available updates
   *
   * @example
   * ```typescript
   * const updates = await manager.checkForUpdates(gamePath)
   * if (updates.length > 0) {
   *   console.log(`${updates.length} updates available`)
   * }
   * ```
   */
  async checkForUpdates(gamePath: string): Promise<ModDefinition[]> {
    const manifest = await this.fetchManifest()
    if (!manifest) {
      return []
    }

    const installedMods = this.getInstalledMods(gamePath)
    const updates: ModDefinition[] = []

    // Compare versions
    for (const manifestMod of manifest.mods) {
      const installed = installedMods.find(m => m.name === manifestMod.name)
      if (installed && installed.version !== manifestMod.version) {
        updates.push(manifestMod)
      }
    }

    return updates
  }

  // ---------------------------------------------------------------------------
  // Configuration Management
  // ---------------------------------------------------------------------------

  /**
   * Saves the user configuration to persistent storage.
   *
   * @param config - Configuration object to save
   * @returns True if save successful, false otherwise
   *
   * @remarks
   * Configuration is saved as formatted JSON for human readability.
   * File is stored in the user's app data directory.
   */
  saveConfig(config: Config): boolean {
    try {
      writeFileSync(this.configPath, JSON.stringify(config, null, 2))
      return true
    } catch (error) {
      console.error('Failed to save config:', error)
      return false
    }
  }

  /**
   * Loads the user configuration from persistent storage.
   *
   * @returns Saved configuration or null if none exists or on error
   */
  loadConfig(): Config | null {
    try {
      if (existsSync(this.configPath)) {
        return JSON.parse(readFileSync(this.configPath, 'utf8'))
      }
      return null
    } catch (error) {
      console.error('Failed to load config:', error)
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Mod State Management
  // ---------------------------------------------------------------------------

  /**
   * Enables or disables a mod by modifying its mod.json file.
   *
   * @param modPath - Path to the mod folder
   * @param enabled - Whether to enable or disable the mod
   * @returns True if successful, false otherwise
   *
   * @remarks
   * This modifies the Enabled field in the mod's mod.json file.
   * BattleTech/ModTek reads this field to determine whether to load the mod.
   */
  setModEnabled(modPath: string, enabled: boolean): boolean {
    const modJsonPath = join(modPath, 'mod.json')

    try {
      if (existsSync(modJsonPath)) {
        const modJson = JSON.parse(readFileSync(modJsonPath, 'utf8'))
        modJson.Enabled = enabled
        writeFileSync(modJsonPath, JSON.stringify(modJson, null, 2))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to toggle mod:', error)
      return false
    }
  }

  // ---------------------------------------------------------------------------
  // Dependency Verification
  // ---------------------------------------------------------------------------

  /**
   * Verifies that all mod dependencies are satisfied.
   *
   * Checks each installed mod's dependencies against the list of
   * installed mods to identify any missing requirements.
   *
   * @param gamePath - Path to the BattleTech installation
   * @returns Object with validity flag and array of missing dependency messages
   *
   * @example
   * ```typescript
   * const deps = manager.verifyDependencies(gamePath)
   * if (!deps.valid) {
   *   deps.missing.forEach(msg => console.warn(msg))
   * }
   * ```
   */
  verifyDependencies(gamePath: string): { valid: boolean; missing: string[] } {
    const installedMods = this.getInstalledMods(gamePath)
    const installedNames = new Set(installedMods.map(m => m.name))
    const missing: string[] = []

    // Check each mod's dependencies
    for (const mod of installedMods) {
      if (mod.dependencies) {
        for (const dep of mod.dependencies) {
          if (!installedNames.has(dep)) {
            missing.push(`${mod.name} requires ${dep}`)
          }
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    }
  }
}
