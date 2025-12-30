/**
 * @fileoverview AIEmpires Logging System - Main Process Logger
 *
 * Provides a robust, configurable logging system for the AIEmpires launcher.
 * Logs can be enabled/disabled, filtered by level, and exported for bug reports.
 *
 * @author AIEmpires Team
 * @version 1.0.0
 * @license MIT
 *
 * Features:
 * ---------
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - File and console output
 * - Log rotation (keeps last 5 log files)
 * - Structured JSON logs for parsing
 * - Easy export for bug reports
 * - Performance timestamps
 * - Context tagging (module/function names)
 *
 * Usage:
 * ------
 * ```typescript
 * import { logger, LogLevel } from './logger'
 *
 * // Configure logging
 * logger.setLevel(LogLevel.DEBUG)
 * logger.enable()
 *
 * // Log messages
 * logger.info('ModManager', 'Starting mod download', { modName: 'CustomAmmo' })
 * logger.error('AIService', 'Connection failed', { provider: 'anthropic', error: err })
 *
 * // Export logs for bug report
 * const logPath = await logger.exportLogs()
 * ```
 */

import { app } from 'electron'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync, appendFileSync } from 'fs'
import { join } from 'path'

// =============================================================================
// Types and Enums
// =============================================================================

/**
 * Log severity levels in ascending order of importance.
 * Higher values indicate more critical issues.
 */
export enum LogLevel {
  DEBUG = 0,    // Detailed debugging information
  INFO = 1,     // General operational information
  WARN = 2,     // Warning conditions that should be reviewed
  ERROR = 3,    // Error conditions that need attention
  FATAL = 4     // Critical errors that may crash the application
}

/**
 * Structure of a single log entry.
 */
interface LogEntry {
  timestamp: string       // ISO 8601 timestamp
  level: string          // Log level name
  module: string         // Source module/component
  message: string        // Log message
  data?: unknown         // Optional structured data
  stack?: string         // Error stack trace if applicable
}

/**
 * Logger configuration options.
 */
interface LoggerConfig {
  enabled: boolean           // Whether logging is active
  level: LogLevel           // Minimum level to log
  consoleOutput: boolean    // Write to console
  fileOutput: boolean       // Write to file
  maxFiles: number          // Maximum log files to keep
  maxFileSizeMB: number     // Max size per log file in MB
}

// =============================================================================
// Logger Class
// =============================================================================

/**
 * Centralized logging system for the AIEmpires launcher.
 *
 * Provides consistent, configurable logging across all modules with
 * support for multiple output destinations and log levels.
 *
 * @example
 * ```typescript
 * // Get the singleton instance
 * const log = Logger.getInstance()
 *
 * // Configure
 * log.setLevel(LogLevel.DEBUG)
 * log.enable()
 *
 * // Use throughout the application
 * log.info('MyModule', 'Operation completed', { duration: 150 })
 * ```
 */
class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private logDir: string
  private currentLogFile: string
  private sessionId: string

  private constructor() {
    // Generate unique session ID for this launch
    this.sessionId = this.generateSessionId()

    // Default configuration
    this.config = {
      enabled: true,
      level: LogLevel.INFO,
      consoleOutput: true,
      fileOutput: true,
      maxFiles: 5,
      maxFileSizeMB: 10
    }

    // Set up log directory
    this.logDir = join(app.getPath('userData'), 'logs')
    this.ensureLogDirectory()

    // Create log file for this session
    this.currentLogFile = this.createLogFile()

    // Log session start
    this.info('Logger', 'Logging session started', {
      sessionId: this.sessionId,
      logFile: this.currentLogFile,
      appVersion: app.getVersion(),
      platform: process.platform,
      arch: process.arch
    })
  }

  /**
   * Gets the singleton Logger instance.
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // ---------------------------------------------------------------------------
  // Configuration Methods
  // ---------------------------------------------------------------------------

  /**
   * Enables logging output.
   */
  enable(): void {
    this.config.enabled = true
    this.info('Logger', 'Logging enabled')
  }

  /**
   * Disables all logging output.
   */
  disable(): void {
    this.info('Logger', 'Logging disabled')
    this.config.enabled = false
  }

  /**
   * Checks if logging is currently enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Sets the minimum log level to output.
   * Messages below this level will be ignored.
   *
   * @param level - Minimum LogLevel to output
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
    this.info('Logger', `Log level set to ${LogLevel[level]}`)
  }

  /**
   * Gets the current log level.
   */
  getLevel(): LogLevel {
    return this.config.level
  }

  /**
   * Enables or disables console output.
   */
  setConsoleOutput(enabled: boolean): void {
    this.config.consoleOutput = enabled
  }

  /**
   * Enables or disables file output.
   */
  setFileOutput(enabled: boolean): void {
    this.config.fileOutput = enabled
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): LoggerConfig {
    return { ...this.config }
  }

  /**
   * Updates configuration from saved settings.
   */
  loadConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // ---------------------------------------------------------------------------
  // Logging Methods
  // ---------------------------------------------------------------------------

  /**
   * Logs a DEBUG level message.
   * Use for detailed debugging information during development.
   *
   * @param module - Source module/component name
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  debug(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, module, message, data)
  }

  /**
   * Logs an INFO level message.
   * Use for general operational information.
   *
   * @param module - Source module/component name
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  info(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, module, message, data)
  }

  /**
   * Logs a WARN level message.
   * Use for warning conditions that should be reviewed.
   *
   * @param module - Source module/component name
   * @param message - Log message
   * @param data - Optional structured data to include
   */
  warn(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, module, message, data)
  }

  /**
   * Logs an ERROR level message.
   * Use for error conditions that need attention.
   *
   * @param module - Source module/component name
   * @param message - Log message
   * @param data - Optional structured data or Error object
   */
  error(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, module, message, data)
  }

  /**
   * Logs a FATAL level message.
   * Use for critical errors that may crash the application.
   *
   * @param module - Source module/component name
   * @param message - Log message
   * @param data - Optional structured data or Error object
   */
  fatal(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.FATAL, module, message, data)
  }

  // ---------------------------------------------------------------------------
  // Export and Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Exports all logs from the current session to a single file for bug reports.
   *
   * @returns Path to the exported log file
   */
  async exportLogs(): Promise<string> {
    const exportPath = join(this.logDir, `aiempires-logs-export-${this.sessionId}.txt`)

    // Read current log file
    let content = '='.repeat(80) + '\n'
    content += 'AIEMPIRES LOG EXPORT\n'
    content += '='.repeat(80) + '\n\n'
    content += `Export Date: ${new Date().toISOString()}\n`
    content += `Session ID: ${this.sessionId}\n`
    content += `App Version: ${app.getVersion()}\n`
    content += `Platform: ${process.platform} ${process.arch}\n`
    content += `Node Version: ${process.version}\n`
    content += `Electron Version: ${process.versions.electron}\n\n`
    content += '='.repeat(80) + '\n'
    content += 'LOG ENTRIES\n'
    content += '='.repeat(80) + '\n\n'

    if (existsSync(this.currentLogFile)) {
      content += readFileSync(this.currentLogFile, 'utf8')
    }

    writeFileSync(exportPath, content)
    this.info('Logger', 'Logs exported', { path: exportPath })

    return exportPath
  }

  /**
   * Gets the path to the current log file.
   */
  getLogFilePath(): string {
    return this.currentLogFile
  }

  /**
   * Gets the log directory path.
   */
  getLogDirectory(): string {
    return this.logDir
  }

  /**
   * Gets the current session ID.
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Reads and returns recent log entries.
   *
   * @param count - Maximum number of entries to return
   * @returns Array of log entries
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    try {
      if (!existsSync(this.currentLogFile)) {
        return []
      }

      const content = readFileSync(this.currentLogFile, 'utf8')
      const lines = content.trim().split('\n').filter(line => line.trim())
      const recentLines = lines.slice(-count)

      return recentLines.map(line => {
        try {
          return JSON.parse(line) as LogEntry
        } catch {
          return {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            module: 'Unknown',
            message: line
          }
        }
      })
    } catch (error) {
      return []
    }
  }

  /**
   * Clears all log files.
   */
  clearLogs(): void {
    try {
      const files = readdirSync(this.logDir)
      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.txt')) {
          unlinkSync(join(this.logDir, file))
        }
      }
      this.currentLogFile = this.createLogFile()
      this.info('Logger', 'All logs cleared')
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  /**
   * Core logging method that handles all log levels.
   */
  private log(level: LogLevel, module: string, message: string, data?: unknown): void {
    // Check if logging is enabled and level is sufficient
    if (!this.config.enabled || level < this.config.level) {
      return
    }

    // Build log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      module,
      message
    }

    // Handle Error objects specially
    if (data instanceof Error) {
      entry.data = {
        name: data.name,
        message: data.message
      }
      entry.stack = data.stack
    } else if (data !== undefined) {
      entry.data = data
    }

    // Output to console
    if (this.config.consoleOutput) {
      this.writeToConsole(level, entry)
    }

    // Output to file
    if (this.config.fileOutput) {
      this.writeToFile(entry)
    }
  }

  /**
   * Writes a log entry to the console with appropriate formatting.
   */
  private writeToConsole(level: LogLevel, entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.module}]`
    const message = `${prefix} ${entry.message}`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '')
        break
      case LogLevel.INFO:
        console.info(message, entry.data || '')
        break
      case LogLevel.WARN:
        console.warn(message, entry.data || '')
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data || '', entry.stack || '')
        break
    }
  }

  /**
   * Writes a log entry to the current log file as JSON.
   */
  private writeToFile(entry: LogEntry): void {
    try {
      const line = JSON.stringify(entry) + '\n'
      appendFileSync(this.currentLogFile, line)
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }

  /**
   * Ensures the log directory exists.
   */
  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }

    // Clean up old log files
    this.rotateLogFiles()
  }

  /**
   * Creates a new log file for this session.
   */
  private createLogFile(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return join(this.logDir, `aiempires-${timestamp}.log`)
  }

  /**
   * Generates a unique session ID.
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Removes old log files, keeping only the most recent ones.
   */
  private rotateLogFiles(): void {
    try {
      const files = readdirSync(this.logDir)
        .filter(f => f.startsWith('aiempires-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: join(this.logDir, f),
          mtime: require('fs').statSync(join(this.logDir, f)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      // Remove files beyond the limit
      const filesToRemove = files.slice(this.config.maxFiles)
      for (const file of filesToRemove) {
        unlinkSync(file.path)
      }
    } catch (error) {
      console.error('Failed to rotate log files:', error)
    }
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

/**
 * Singleton logger instance for use throughout the application.
 *
 * @example
 * ```typescript
 * import { logger } from './logger'
 *
 * logger.info('MyModule', 'Hello world')
 * logger.error('MyModule', 'Something went wrong', error)
 * ```
 */
export const logger = Logger.getInstance()

/**
 * Re-export the Logger class for advanced usage.
 */
export { Logger }
