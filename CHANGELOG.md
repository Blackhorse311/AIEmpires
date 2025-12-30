# Changelog

All notable changes to the AIEmpires project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-30

### Added

#### Logging System
- Comprehensive logging system across all components (Launcher, AI Service, Game Mod)
- Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- File and console output with configurable settings
- Automatic log rotation (keeps last 5 log files, max 10MB each)
- JSON-structured log format for easy parsing
- Session tracking with unique IDs
- One-click log export for bug reports from Settings page
- LOGGING.md documentation with usage examples

#### Launcher Logging
- Logger utility in TypeScript (`launcher/src/main/logger.ts`)
- IPC handlers for log configuration from renderer
- Log management UI in Settings page
- Export logs functionality with File Explorer integration

#### AI Service Logging
- Logger utility in Python (`ai-service/utils/logger.py`)
- FastAPI middleware for request/response logging
- REST endpoints for log level configuration
- Log export endpoint for bug reports

#### Game Mod Logging
- Logger utility in C# (`game-mod/AIEmpires/Utils/Logger.cs`)
- Settings integration for debug logging toggle
- File logging to mod directory

### Changed
- Updated ARCHITECTURE.md with Section 14: Logging System
- All launcher IPC handlers now log operations
- AI Service updated to v1.0.0 with logging
- Game Mod updated to v1.0.0 with logging

---

## [1.0.0] - 2024-12-30

### Added

#### Launcher
- Initial Electron + React + Vite launcher application
- BattleTech game auto-detection (Steam and GOG)
- Windows registry-based Steam library detection
- LLM provider configuration with support for:
  - Anthropic Claude (claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3.5-sonnet)
  - OpenAI GPT (gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
  - Google Gemini (gemini-pro, gemini-1.5-pro, gemini-1.5-flash)
  - Groq (llama-3.1-70b, llama-3.1-8b, mixtral-8x7b)
  - Ollama (local models - free)
- Dynamic cost estimation based on provider, model, and faction tier
- Mod management system with manifest-based downloads
- Configuration persistence in user app data directory
- BattleTech-themed UI with military-industrial aesthetic
- Orange/amber accent colors matching BattleTech HUD style
- Executable builds for Windows (NSIS installer + portable)

#### Documentation
- Comprehensive ARCHITECTURE.md with system design
- FINAL_MOD_LIST.md with 65+ curated mods
- VERSIONING.md with semantic versioning guide
- This CHANGELOG.md

#### Project Structure
- Monorepo structure with launcher/, ai-service/, game-mod/, and data/ directories
- TypeScript for launcher with full type definitions
- Python structure for AI service
- C# structure for game mod
- Faction personality definitions
- Era configuration data

### Technical Details
- Professional JSDoc comments throughout codebase
- Semantic versioning (SemVer) implementation
- electron-builder configuration for cross-platform builds
- IPC-based communication between main and renderer processes
- Context isolation for security

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.1.0 | 2024-12-30 | Added comprehensive logging system across all components |
| 1.0.0 | 2024-12-30 | Initial release with launcher, documentation, and project structure |

---

*For upgrade instructions, see the [README](README.md).*
