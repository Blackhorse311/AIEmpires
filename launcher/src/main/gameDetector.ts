import { existsSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Common Steam installation paths
const STEAM_PATHS = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\BATTLETECH',
  'C:\\Program Files\\Steam\\steamapps\\common\\BATTLETECH',
  'D:\\Steam\\steamapps\\common\\BATTLETECH',
  'D:\\SteamLibrary\\steamapps\\common\\BATTLETECH',
  'E:\\Steam\\steamapps\\common\\BATTLETECH',
  'E:\\SteamLibrary\\steamapps\\common\\BATTLETECH',
  'F:\\Steam\\steamapps\\common\\BATTLETECH',
  'F:\\SteamLibrary\\steamapps\\common\\BATTLETECH',
  'F:\\Program Files (x86)\\Steam\\steamapps\\common\\BATTLETECH'
]

// GOG installation paths
const GOG_PATHS = [
  'C:\\Program Files (x86)\\GOG Galaxy\\Games\\BATTLETECH',
  'C:\\Program Files\\GOG Galaxy\\Games\\BATTLETECH',
  'C:\\GOG Games\\BATTLETECH'
]

/**
 * Attempts to find BattleTech installation automatically
 */
export async function findBattleTechInstall(): Promise<string | null> {
  // Try Steam paths first
  for (const steamPath of STEAM_PATHS) {
    if (isValidBattleTechInstall(steamPath)) {
      return steamPath
    }
  }

  // Try GOG paths
  for (const gogPath of GOG_PATHS) {
    if (isValidBattleTechInstall(gogPath)) {
      return gogPath
    }
  }

  // Try to find via Steam registry (Windows)
  const steamPath = await findSteamLibraryFolders()
  if (steamPath) {
    return steamPath
  }

  return null
}

/**
 * Validates if a path contains a valid BattleTech installation
 */
export function isValidBattleTechInstall(path: string): boolean {
  if (!existsSync(path)) {
    return false
  }

  // Check for BattleTech executable
  const hasExe = existsSync(join(path, 'BattleTech.exe')) ||
                 existsSync(join(path, 'BATTLETECH.exe'))

  // Check for BattleTech_Data folder
  const hasData = existsSync(join(path, 'BattleTech_Data'))

  return hasExe && hasData
}

/**
 * Check if Mods folder exists
 */
export function hasModsFolder(gamePath: string): boolean {
  return existsSync(join(gamePath, 'Mods'))
}

/**
 * Get the Mods folder path
 */
export function getModsPath(gamePath: string): string {
  return join(gamePath, 'Mods')
}

/**
 * Try to find Steam library folders from registry
 */
async function findSteamLibraryFolders(): Promise<string | null> {
  if (process.platform !== 'win32') {
    return null
  }

  try {
    // Query Steam install path from registry
    const { stdout } = await execAsync(
      'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
      { encoding: 'utf8' }
    )

    const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/)
    if (match) {
      const steamPath = match[1].trim()
      const btPath = join(steamPath, 'steamapps', 'common', 'BATTLETECH')
      if (isValidBattleTechInstall(btPath)) {
        return btPath
      }

      // Check libraryfolders.vdf for additional Steam libraries
      const libraryFoldersPath = join(steamPath, 'steamapps', 'libraryfolders.vdf')
      if (existsSync(libraryFoldersPath)) {
        const additionalPath = await findInLibraryFolders(libraryFoldersPath)
        if (additionalPath) {
          return additionalPath
        }
      }
    }
  } catch (error) {
    // Registry query failed, likely not on Windows or Steam not installed
  }

  return null
}

/**
 * Parse Steam's libraryfolders.vdf to find additional library locations
 */
async function findInLibraryFolders(vdfPath: string): Promise<string | null> {
  try {
    const fs = await import('fs/promises')
    const content = await fs.readFile(vdfPath, 'utf8')

    // Simple regex to find paths in the VDF file
    const pathMatches = content.matchAll(/"path"\s+"([^"]+)"/g)

    for (const match of pathMatches) {
      const libraryPath = match[1].replace(/\\\\/g, '\\')
      const btPath = join(libraryPath, 'steamapps', 'common', 'BATTLETECH')
      if (isValidBattleTechInstall(btPath)) {
        return btPath
      }
    }
  } catch (error) {
    // Failed to parse library folders
  }

  return null
}
