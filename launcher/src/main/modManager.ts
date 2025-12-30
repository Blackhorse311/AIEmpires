import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { EventEmitter } from 'events'
import axios from 'axios'
import extract from 'extract-zip'
import { app } from 'electron'

interface ModInfo {
  name: string
  version: string
  enabled: boolean
  path: string
  dependencies?: string[]
}

interface ModManifest {
  version: string
  lastUpdated: string
  mods: ModDefinition[]
}

interface ModDefinition {
  name: string
  version: string
  downloadUrl: string
  checksum: string
  dependencies: string[]
  tier: 'framework' | 'core' | 'strategic' | 'content' | 'optional'
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

const MANIFEST_URL = 'https://raw.githubusercontent.com/Blackhorse311/AIEmpires/main/manifest.json'
const CONFIG_FILE = 'aiempires-config.json'

export class ModManager extends EventEmitter {
  private configPath: string
  private cacheDir: string

  constructor() {
    super()
    this.configPath = join(app.getPath('userData'), CONFIG_FILE)
    this.cacheDir = join(app.getPath('userData'), 'mod-cache')

    // Ensure cache directory exists
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  /**
   * Get list of installed mods in the game's Mods folder
   */
  getInstalledMods(gamePath: string): ModInfo[] {
    const modsPath = join(gamePath, 'Mods')
    const installedMods: ModInfo[] = []

    if (!existsSync(modsPath)) {
      return installedMods
    }

    const modFolders = readdirSync(modsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const folder of modFolders) {
      const modJsonPath = join(modsPath, folder, 'mod.json')
      if (existsSync(modJsonPath)) {
        try {
          const modJson = JSON.parse(readFileSync(modJsonPath, 'utf8'))
          installedMods.push({
            name: modJson.Name || folder,
            version: modJson.Version || 'unknown',
            enabled: modJson.Enabled !== false,
            path: join(modsPath, folder),
            dependencies: modJson.DependsOn || []
          })
        } catch (error) {
          // If mod.json is invalid, still list the mod
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

  /**
   * Fetch the mod manifest from GitHub
   */
  async fetchManifest(): Promise<ModManifest | null> {
    try {
      const response = await axios.get(MANIFEST_URL, {
        timeout: 10000,
        headers: { 'Cache-Control': 'no-cache' }
      })
      return response.data as ModManifest
    } catch (error) {
      console.error('Failed to fetch manifest:', error)
      return null
    }
  }

  /**
   * Download and install all mods from manifest
   */
  async downloadAllMods(gamePath: string): Promise<{ success: boolean; error?: string }> {
    const manifest = await this.fetchManifest()
    if (!manifest) {
      return { success: false, error: 'Failed to fetch mod manifest' }
    }

    const modsPath = join(gamePath, 'Mods')
    if (!existsSync(modsPath)) {
      mkdirSync(modsPath, { recursive: true })
    }

    const totalMods = manifest.mods.length
    let completedMods = 0

    // Sort mods by tier to ensure dependencies are installed first
    const tierOrder = ['framework', 'core', 'strategic', 'content', 'optional']
    const sortedMods = [...manifest.mods].sort((a, b) => {
      return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
    })

    for (const mod of sortedMods) {
      try {
        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'downloading'
        } as DownloadProgress)

        // Download mod
        const zipPath = join(this.cacheDir, `${mod.name}.zip`)
        await this.downloadFile(mod.downloadUrl, zipPath)

        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'extracting'
        } as DownloadProgress)

        // Extract to mods folder
        await extract(zipPath, { dir: modsPath })

        completedMods++
        this.emit('progress', {
          mod: mod.name,
          current: completedMods,
          total: totalMods,
          percentage: Math.round((completedMods / totalMods) * 100),
          status: 'complete'
        } as DownloadProgress)
      } catch (error) {
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
   * Download a file with progress tracking
   */
  private async downloadFile(url: string, destPath: string): Promise<void> {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 300000 // 5 minute timeout for large files
    })

    writeFileSync(destPath, Buffer.from(response.data))
  }

  /**
   * Check for mod updates
   */
  async checkForUpdates(gamePath: string): Promise<ModDefinition[]> {
    const manifest = await this.fetchManifest()
    if (!manifest) {
      return []
    }

    const installedMods = this.getInstalledMods(gamePath)
    const updates: ModDefinition[] = []

    for (const manifestMod of manifest.mods) {
      const installed = installedMods.find(m => m.name === manifestMod.name)
      if (installed && installed.version !== manifestMod.version) {
        updates.push(manifestMod)
      }
    }

    return updates
  }

  /**
   * Save launcher configuration
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
   * Load launcher configuration
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

  /**
   * Enable or disable a mod
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

  /**
   * Verify mod dependencies are met
   */
  verifyDependencies(gamePath: string): { valid: boolean; missing: string[] } {
    const installedMods = this.getInstalledMods(gamePath)
    const installedNames = new Set(installedMods.map(m => m.name))
    const missing: string[] = []

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
