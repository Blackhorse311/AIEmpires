# Changelog

All notable changes to AIEmpires will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Electron-based launcher with configuration UI
- WarTechIIC deep integration for persistent warfare
- Era-based faction configurations (3025, 3049, 3062, 3151)
- Player influence system

---

## [0.1.0] - 2024-12-26

### Added
- Initial project structure with C# mod and Python AI service
- 15 major faction configurations with unique personalities
- Multi-provider LLM support:
  - Anthropic (Claude)
  - OpenAI (GPT-4)
  - Groq (Llama 3, Mixtral)
  - Ollama (local models)
  - LM Studio (local models)
- Strategic decision system (attack, defend, raid, diplomacy, build)
- Flask API for mod-to-AI communication
- Faction personality traits (aggressiveness, diplomacy, honor, etc.)
- WarTechIIC research and integration documentation
- PROJECT_RULES.md for development standards
- Comprehensive code commenting guidelines

### Documentation
- README.md with installation and usage
- LLM_ARCHITECTURE.md - Multi-provider design
- MOD_RESEARCH.md - Open source mod compatibility
- WARTECHIIC_RESEARCH.md - Integration points
- LAUNCHER_CONFIG_OPTIONS.md - Future launcher features
- PROJECT_STRUCTURE.md - Codebase organization

### Technical
- Harmony patches for SimGameState integration
- UnityWebRequest-based HTTP client (no System.Net.Http dependency)
- Provider factory pattern for LLM abstraction
- JSON-based faction configuration

---

## Version History Summary

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2024-12-26 | Initial development release |

---

## Upgrade Notes

### Upgrading to 0.1.0
This is the initial release. No upgrade path needed.

---

## Links

- [Repository](https://github.com/Blackhorse311/AIEmpires)
- [Issues](https://github.com/Blackhorse311/AIEmpires/issues)
- [Releases](https://github.com/Blackhorse311/AIEmpires/releases)
