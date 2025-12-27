# SoloTech - Project Structure

## Overview

```
SoloTech/
├── docs/                           # Documentation
│   ├── MOD_RESEARCH.md            # Mod research and licensing
│   ├── LLM_ARCHITECTURE.md        # LLM provider design
│   ├── PROJECT_STRUCTURE.md       # This file
│   └── ERA_SYSTEM.md              # Era configuration docs
│
├── sources/                        # Cloned mod source repos (reference)
│   ├── ModTek/
│   ├── WarTechIIC/
│   ├── MechEngineer/
│   └── ... (other mods)
│
├── launcher/                       # Electron desktop application
│   ├── src/
│   │   ├── main/                  # Electron main process
│   │   │   ├── index.ts
│   │   │   ├── config-manager.ts
│   │   │   └── game-launcher.ts
│   │   ├── renderer/              # React frontend
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── LLMConfig.tsx
│   │   │   │   ├── EraSelector.tsx
│   │   │   │   ├── ModManager.tsx
│   │   │   │   └── LaunchButton.tsx
│   │   │   └── styles/
│   │   └── preload/
│   ├── package.json
│   └── electron-builder.json
│
├── ai-service/                     # Python AI service (enhanced from AIEmpires)
│   ├── main.py                    # Flask API
│   ├── config.py                  # Configuration
│   ├── providers/                 # LLM provider implementations
│   │   ├── __init__.py
│   │   ├── base.py               # Abstract base class
│   │   ├── anthropic_provider.py
│   │   ├── openai_provider.py
│   │   ├── ollama_provider.py
│   │   ├── groq_provider.py
│   │   └── factory.py            # Provider factory
│   ├── agents/
│   │   ├── faction_agent.py
│   │   └── strategic_agent.py
│   ├── models/
│   │   └── decision.py
│   └── requirements.txt
│
├── mods/                           # Our custom mods
│   ├── SoloTechCore/              # Core mod (replaces RTCore)
│   │   ├── src/
│   │   │   └── SoloTechCore/
│   │   │       ├── SoloTechCore.csproj
│   │   │       ├── Main.cs
│   │   │       └── Settings.cs
│   │   ├── mod.json
│   │   └── config/
│   │
│   ├── AIEmpires/                 # AI faction warfare
│   │   ├── src/
│   │   │   └── AIEmpires/
│   │   │       ├── AIEmpires.csproj
│   │   │       ├── Main.cs
│   │   │       ├── Patches/
│   │   │       ├── Services/
│   │   │       └── State/
│   │   ├── mod.json
│   │   └── config/
│   │       ├── settings.json
│   │       └── factions.json
│   │
│   └── SoloTechUI/                # In-game UI enhancements
│       ├── src/
│       ├── mod.json
│       └── config/
│
├── data/                           # Game data configurations
│   ├── eras/                      # Era-specific configurations
│   │   ├── 3025/
│   │   │   ├── factions.json     # Faction setup for 3025
│   │   │   ├── systems.json      # System ownership
│   │   │   └── mechs.json        # Available mechs
│   │   ├── 3049/
│   │   ├── 3062/
│   │   └── 3151/
│   ├── factions/                  # Faction personalities (all eras)
│   │   └── personalities.json
│   └── campaigns/                 # Custom campaigns
│
├── scripts/                        # Build and utility scripts
│   ├── build-all.bat
│   ├── install-mods.bat
│   ├── start-ai-service.bat
│   └── package-release.bat
│
└── releases/                       # Built releases
    └── .gitkeep
```

## Component Descriptions

### Launcher (Electron + React)
The desktop application that:
- Configures LLM provider and API keys
- Selects game era and starting conditions
- Manages mod installation
- Launches the game with correct settings
- Starts the AI service

### AI Service (Python + Flask)
Background service that:
- Provides REST API for faction decisions
- Supports multiple LLM providers
- Manages faction AI agents
- Persists galaxy state

### SoloTechCore (C# Mod)
Core mod that:
- Initializes the modpack
- Manages era-based loading
- No launcher validation (unlike RTCore)
- Handles core configuration

### AIEmpires (C# Mod)
Faction warfare mod that:
- Hooks into game events
- Communicates with AI service
- Simulates faction warfare
- Processes player actions

### Data Files
JSON configurations for:
- Era-specific faction ownership
- Mech availability by era
- Faction personalities and relationships
- Campaign definitions

## Build Order

1. **AI Service** - Python, standalone
2. **SoloTechCore** - C#, depends on ModTek
3. **AIEmpires** - C#, depends on SoloTechCore
4. **Launcher** - Electron, packages everything

## Technology Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Launcher | Electron + React + TypeScript | Cross-platform, modern UI |
| AI Service | Python + Flask | AI libraries, easy LLM integration |
| Game Mods | C# + Harmony | Required for BattleTech modding |
| Config | JSON | Universal, human-readable |
| Build | .NET SDK, npm, pip | Standard toolchains |
