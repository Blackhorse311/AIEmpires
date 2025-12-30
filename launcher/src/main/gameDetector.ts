/**
 * @fileoverview BattleTech Game Installation Detector
 *
 * This module provides functionality to automatically locate BattleTech
 * installations on Windows systems. It supports multiple storefronts and
 * installation methods.
 *
 * Detection Methods (in order of priority):
 * 1. Common Steam installation paths on drives C-F
 * 2. Common GOG Galaxy installation paths
 * 3. Windows Registry lookup for Steam installation
 * 4. Steam libraryfolders.vdf parsing for custom library locations
 *
 * @author AIEmpires Team
 * @version 1.0.0
 * @license MIT
 *
 * Usage Example:
 * ```typescript
 * import { findBattleTechInstall, isValidBattleTechInstall } from './gameDetector'
 *
 * const gamePath = await findBattleTechInstall()
 * if (gamePath && isValidBattleTechInstall(gamePath)) {
 *   console.log(`Found BattleTech at: ${gamePath}`)
 * }
 * ```
 *
 * Extending This Module:
 * - To add support for new storefronts, add paths to the appropriate array
 * - To support new platforms, add platform-specific detection in findBattleTechInstall()
 * - The validation checks for both executable variants (BattleTech.exe / BATTLETECH.exe)
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

// Promisified exec for async/await usage
const execAsync = promisify(exec)

// =============================================================================
// Installation Path Constants
// =============================================================================

/**
 * Common Steam installation paths across multiple drive letters.
 *
 * These paths cover the most common Steam installation patterns:
 * - Default Steam install locations on various drives
 * - Custom Steam library folders (SteamLibrary)
 * - Program Files locations
 *
 * @remarks
 * The order matters for performance - most common locations are checked first.
 * Add new paths at the end unless they're more common than existing entries.
 */
const STEAM_PATHS: readonly string[] = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\BATTLETECH',
  'C:\\Program Files\\Steam\\steamapps\\common\\BATTLETECH',
  'D:\\Steam\\steamapps\\common\\BATTLETECH',
  'D:\\SteamLibrary\\steamapps\\common\\BATTLETECH',
  'E:\\Steam\\steamapps\\common\\BATTLETECH',
  'E:\\SteamLibrary\\steamapps\\common\\BATTLETECH',
  'F:\\Steam\\steamapps\\common\\BATTLETECH',
  'F:\\SteamLibrary\\steamapps\\common\\BATTLETECH',
  'F:\\Program Files (x86)\\Steam\\steamapps\\common\\BATTLETECH'
] as const

/**
 * Common GOG Galaxy installation paths.
 *
 * GOG installations are typically in:
 * - GOG Galaxy's default games folder
 * - Standalone GOG Games folder (for offline installers)
 *
 * @remarks
 * GOG allows highly customized install locations, so registry lookup
 * would be more reliable but is not implemented yet.
 */
const GOG_PATHS: readonly string[] = [
  'C:\\Program Files (x86)\\GOG Galaxy\\Games\\BATTLETECH',
  'C:\\Program Files\\GOG Galaxy\\Games\\BATTLETECH',
  'C:\\GOG Games\\BATTLETECH'
] as const

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Attempts to automatically find a BattleTech installation.
 *
 * This function uses multiple detection strategies in order of speed:
 * 1. Direct path checking for common Steam locations
 * 2. Direct path checking for common GOG locations
 * 3. Windows Registry lookup for Steam's install path
 * 4. Parsing Steam's libraryfolders.vdf for custom library locations
 *
 * @returns Promise resolving to the game path if found, null otherwise
 *
 * @example
 * ```typescript
 * const gamePath = await findBattleTechInstall()
 * if (gamePath) {
 *   console.log(`Found game at: ${gamePath}`)
 * } else {
 *   console.log('Game not found - please select manually')
 * }
 * ```
 *
 * @remarks
 * This function is designed to fail fast - it returns the first valid
 * installation found rather than scanning all possible locations.
 */
export async function findBattleTechInstall(): Promise<string | null> {
  // Strategy 1: Check common Steam paths (fastest)
  for (const steamPath of STEAM_PATHS) {
    if (isValidBattleTechInstall(steamPath)) {
      return steamPath
    }
  }

  // Strategy 2: Check common GOG paths
  for (const gogPath of GOG_PATHS) {
    if (isValidBattleTechInstall(gogPath)) {
      return gogPath
    }
  }

  // Strategy 3: Try Windows Registry lookup (slower but more thorough)
  const steamPath = await findSteamLibraryFolders()
  if (steamPath) {
    return steamPath
  }

  // No installation found
  return null
}

/**
 * Validates whether a given path contains a valid BattleTech installation.
 *
 * A valid installation must have:
 * 1. The path must exist
 * 2. A BattleTech executable (either BattleTech.exe or BATTLETECH.exe)
 * 3. The BattleTech_Data folder (Unity game data)
 *
 * @param path - The filesystem path to validate
 * @returns True if the path contains a valid BattleTech installation
 *
 * @example
 * ```typescript
 * if (isValidBattleTechInstall('D:\\Games\\BATTLETECH')) {
 *   // Safe to use this path for modding
 * }
 * ```
 *
 * @remarks
 * The dual executable check handles different game versions and storefronts
 * that may use different casing for the executable name.
 */
export function isValidBattleTechInstall(path: string): boolean {
  // Path must exist
  if (!existsSync(path)) {
    return false
  }

  // Check for BattleTech executable (Steam uses 'BattleTech.exe', some use 'BATTLETECH.exe')
  const hasExe = existsSync(join(path, 'BattleTech.exe')) ||
                 existsSync(join(path, 'BATTLETECH.exe'))

  // Check for Unity game data folder (required for all Unity games)
  const hasData = existsSync(join(path, 'BattleTech_Data'))

  return hasExe && hasData
}

/**
 * Checks if the Mods folder exists in the game installation.
 *
 * The Mods folder is created by ModTek or similar mod loaders.
 * Its absence may indicate:
 * - Fresh game installation without mods
 * - Need to run ModTek injector first
 *
 * @param gamePath - Path to the BattleTech installation
 * @returns True if Mods folder exists
 */
export function hasModsFolder(gamePath: string): boolean {
  return existsSync(join(gamePath, 'Mods'))
}

/**
 * Gets the full path to the Mods folder.
 *
 * @param gamePath - Path to the BattleTech installation
 * @returns Full path to the Mods folder
 *
 * @remarks
 * This does not verify the folder exists - use hasModsFolder() to check first.
 */
export function getModsPath(gamePath: string): string {
  return join(gamePath, 'Mods')
}

// =============================================================================
// Private Helper Functions
// =============================================================================

/**
 * Attempts to find BattleTech through Steam's Windows Registry entries.
 *
 * This function:
 * 1. Queries the Windows Registry for Steam's installation path
 * 2. Checks the default Steam library for BattleTech
 * 3. If not found, parses libraryfolders.vdf for additional library locations
 *
 * @returns Promise resolving to game path if found, null otherwise
 *
 * @remarks
 * This only works on Windows - other platforms return null immediately.
 * Registry access uses the 'reg' command-line tool.
 */
async function findSteamLibraryFolders(): Promise<string | null> {
  // Only supported on Windows
  if (process.platform !== 'win32') {
    return null
  }

  try {
    // Query Steam install path from Windows Registry
    // Uses WOW6432Node for 32-bit Steam on 64-bit Windows
    const { stdout } = await execAsync(
      'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
      { encoding: 'utf8' }
    )

    // Parse the registry output to extract the path
    // Format: "    InstallPath    REG_SZ    C:\Program Files (x86)\Steam"
    const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/)
    if (match) {
      const steamPath = match[1].trim()

      // First, check the default Steam library
      const btPath = join(steamPath, 'steamapps', 'common', 'BATTLETECH')
      if (isValidBattleTechInstall(btPath)) {
        return btPath
      }

      // If not in default library, check for additional Steam libraries
      const libraryFoldersPath = join(steamPath, 'steamapps', 'libraryfolders.vdf')
      if (existsSync(libraryFoldersPath)) {
        const additionalPath = await findInLibraryFolders(libraryFoldersPath)
        if (additionalPath) {
          return additionalPath
        }
      }
    }
  } catch (error) {
    // Registry query failed - likely:
    // - Not on Windows
    // - Steam not installed
    // - Registry permissions issue
    // Silently fail and return null
  }

  return null
}

/**
 * Parses Steam's libraryfolders.vdf to find BattleTech in additional Steam libraries.
 *
 * Steam allows users to create multiple game library folders on different drives.
 * These are tracked in the libraryfolders.vdf file using Valve's VDF format.
 *
 * @param vdfPath - Path to Steam's libraryfolders.vdf file
 * @returns Promise resolving to game path if found, null otherwise
 *
 * @remarks
 * VDF (Valve Data Format) is a text-based format similar to JSON.
 * We use regex parsing here for simplicity rather than a full VDF parser.
 * This may need updating if Valve changes the VDF format significantly.
 *
 * @example VDF content structure:
 * ```
 * "libraryfolders"
 * {
 *   "0"
 *   {
 *     "path"    "D:\\SteamLibrary"
 *     "apps"    { ... }
 *   }
 * }
 * ```
 */
async function findInLibraryFolders(vdfPath: string): Promise<string | null> {
  try {
    // Dynamic import to avoid loading fs/promises if not needed
    const fs = await import('fs/promises')
    const content = await fs.readFile(vdfPath, 'utf8')

    // Extract all "path" values from the VDF file
    // Matches: "path"    "D:\\SteamLibrary"
    const pathMatches = content.matchAll(/"path"\s+"([^"]+)"/g)

    // Check each library location for BattleTech
    for (const match of pathMatches) {
      // VDF uses escaped backslashes - convert to single backslashes
      const libraryPath = match[1].replace(/\\\\/g, '\\')
      const btPath = join(libraryPath, 'steamapps', 'common', 'BATTLETECH')

      if (isValidBattleTechInstall(btPath)) {
        return btPath
      }
    }
  } catch (error) {
    // Failed to read or parse libraryfolders.vdf
    // This is not critical - we have other detection methods
  }

  return null
}
