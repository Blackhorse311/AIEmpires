# SoloTech Launcher Configuration Options

Based on RogueTech launcher analysis, this document outlines all configuration options for the SoloTech launcher.

## Project Name Suggestions

Considering the AI-powered faction control aspect, here are name suggestions:

| Name | Pros | Cons |
|------|------|------|
| **AIEmpire** | Short, clear, memorable | Generic |
| **AIEmpires** | Plural emphasizes multiple factions | Slightly longer |
| **AIEmpireTech** | Combines AI + Empire + BattleTech | Longer, but clear lineage |
| **SoloTech** | Emphasizes single-player focus | Doesn't highlight AI aspect |
| **AIWarfare** | Clear about the combat AI | Doesn't mention empire management |
| **StrategosAI** | Greek for "general", sophisticated | Less accessible |
| **BattleLord** | Strong, memorable | Doesn't highlight AI aspect |
| **EmpireAI** | Clear meaning | Reversed from AIEmpire |
| **InnerSphereAI** | BattleTech lore reference | Excludes Clan players |
| **MechLordAI** | BattleTech themed | Informal |

**Recommended: AIEmpires** - Clear, memorable, describes exactly what it does (AI-controlled empires).

---

## Launcher Configuration Categories

### 1. Difficulty Settings

#### Skull Rating Configuration
```json
{
  "difficultySettings": {
    "skullRating": {
      "minimum": 0.5,
      "maximum": 15.0,
      "startingSkull": 1.0,
      "skullProgression": "linear|exponential|custom"
    },
    "contractDifficulty": {
      "halfSkullVariance": 2,
      "difficultySpread": 3
    }
  }
}
```

#### Enemy Force Scaling
| Option | Values | Description |
|--------|--------|-------------|
| forceSizeMultiplier | 0.5x - 3.0x | Enemy lance size scaling |
| reinforcementChance | 0% - 100% | Chance of enemy reinforcements |
| eliteSpawnRate | 0% - 50% | Chance of elite enemy pilots |
| turretDensity | low/medium/high | Static defense frequency |

#### Economic Difficulty
| Option | Values | Description |
|--------|--------|-------------|
| cbillMultiplier | 0.25x - 2.0x | Contract payment scaling |
| salvageMultiplier | 0.25x - 2.0x | Salvage quantity scaling |
| repairCostMultiplier | 0.5x - 3.0x | Mech repair costs |
| partsToBuildMech | 1-8 | Parts needed to assemble mech |

---

### 2. Spawn Settings

#### Mech Spawning
```json
{
  "spawnSettings": {
    "mechs": {
      "maxTonnagePerLance": 400,
      "minTonnagePerLance": 80,
      "allowMixedLances": true,
      "vehicleSupport": true,
      "infantrySupport": true,
      "battleArmorSupport": true
    }
  }
}
```

#### Enemy Composition
| Option | Description |
|--------|-------------|
| purelyMechs | Only mech enemies |
| mechsAndVehicles | Mixed mech/vehicle forces |
| fullCombinedArms | Mechs, vehicles, infantry, BA |
| vehicleOnly | Vehicle-focused enemies |

#### Player Lance Options
| Option | Values | Description |
|--------|--------|-------------|
| maxPlayerLanceSize | 4-8 | Maximum player mechs per mission |
| allowMultipleLances | true/false | Deploy multiple lances |
| companionMechs | 0-4 | AI-controlled friendly mechs |

---

### 3. Era Selection

```json
{
  "eraSettings": {
    "selectedEra": "3049",
    "availableEras": [
      {"id": "2750", "name": "Star League Era", "techLevel": "lostech"},
      {"id": "3025", "name": "Succession Wars", "techLevel": "basic"},
      {"id": "3039", "name": "War of 3039", "techLevel": "early_recovery"},
      {"id": "3049", "name": "Clan Invasion", "techLevel": "clan_arrival"},
      {"id": "3057", "name": "Operation Bulldog", "techLevel": "recovered"},
      {"id": "3062", "name": "FedCom Civil War", "techLevel": "advanced"},
      {"id": "3067", "name": "Jihad Era", "techLevel": "mixed"},
      {"id": "3081", "name": "Dark Age Beginning", "techLevel": "republic"},
      {"id": "3151", "name": "ilClan Era", "techLevel": "ilclan"}
    ]
  }
}
```

#### Era-Specific Options
| Era | Tech Available | Faction Changes |
|-----|---------------|-----------------|
| 3025 | Basic IS only | No Clans |
| 3049 | Clan tech arrives | Clan invasion corridors |
| 3062 | Recovery tech | Expanded factions |
| 3151 | Full tech tree | ilClan structure |

---

### 4. Optional Content Modules

#### Gameplay Modules
| Module | Description | Default |
|--------|-------------|---------|
| BiggerDrops | More mechs per mission | OFF |
| MissionControl | Extended mission types | ON |
| CleverGirl | Improved AI behavior | ON |
| PanicSystem | Pilot morale/ejection | ON |
| LootMagnet | Improved salvage system | ON |

#### Content Packs
| Module | Description | Default |
|--------|-------------|---------|
| ClanMechs | Full Clan mech roster | ON |
| InnerSphereMechs | Complete IS mechs | ON |
| VehicleExpansion | Extended vehicle roster | ON |
| BattleArmor | Infantry and BA units | OFF |
| Aerospace | Fighter and dropship support | OFF |

#### Quality of Life
| Module | Description | Default |
|--------|-------------|---------|
| SkipIntro | Skip intro cinematics | ON |
| FastMechLab | Quicker mech customization | ON |
| NavigationComputer | Extended travel planning | ON |
| PilotQuirks | Unique pilot abilities | ON |

---

### 5. AI Empire Settings (New for SoloTech)

```json
{
  "aiEmpireSettings": {
    "enabled": true,
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "${AI_API_KEY}",
    "updateFrequency": "monthly",
    "factionPersonalities": {
      "useHistoricalPersonalities": true,
      "customPersonalityFile": null
    },
    "decisionTypes": {
      "attacks": true,
      "alliances": true,
      "economicPolicies": true,
      "playerInteraction": true
    },
    "difficultyModifier": {
      "aiAggression": 1.0,
      "aiCoordination": 0.5,
      "expansionRate": 1.0
    }
  }
}
```

#### AI Provider Options
| Provider | Local | API Key Required | Notes |
|----------|-------|-----------------|-------|
| Anthropic | No | Yes | Best reasoning |
| OpenAI | No | Yes | Fast, reliable |
| Groq | No | Yes | Very fast |
| Ollama | Yes | No | Free, private |
| LM Studio | Yes | No | GUI-based local |

#### AI Behavior Settings
| Option | Values | Description |
|--------|--------|-------------|
| updateFrequency | daily/weekly/monthly | How often AI makes decisions |
| showDecisionReasoning | true/false | Display AI thought process |
| playerNotifications | all/major/none | Notify player of AI actions |
| historicalAccuracy | low/medium/high | How closely AI follows lore |

---

### 6. Graphics & Performance

#### Visual Settings
| Option | Values | Description |
|--------|--------|-------------|
| resolution | auto/1080p/1440p/4K | Display resolution |
| quality | low/medium/high/ultra | Overall quality preset |
| shadows | off/low/high | Shadow quality |
| particles | low/medium/high | Explosion/effect quality |

#### Performance
| Option | Values | Description |
|--------|--------|-------------|
| targetFPS | 30/60/120/unlimited | Frame rate target |
| asyncLoading | true/false | Background asset loading |
| memoryLimit | auto/4GB/8GB/16GB | RAM usage limit |

---

### 7. Career/Campaign Settings

#### Starting Options
| Option | Values | Description |
|--------|--------|-------------|
| startingCbills | 1M - 50M | Initial funds |
| startingMechs | 1-12 | Starting lance size |
| mechQuality | random/set | Mech selection method |
| startingLocation | random/select | Initial system |
| startingReputation | neutral/varied | Faction standings |

#### Campaign Length
| Option | Values | Description |
|--------|--------|-------------|
| endGameCondition | none/conquest/reputation | Victory condition |
| maxGameDays | unlimited/365/730/1825 | Time limit |
| ironmanMode | true/false | Permadeath |

---

### 8. Multiplayer/Co-op (Future)

```json
{
  "multiplayerSettings": {
    "enabled": false,
    "mode": "coop|versus|spectate",
    "maxPlayers": 4,
    "syncFrequency": "realtime|turn-based",
    "hostMigration": true
  }
}
```

---

## Launcher UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  SoloTech Launcher                                    [─][□][×]│
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌────────────────────────────────────┐ │
│  │                 │  │                                    │ │
│  │   [PLAY GAME]   │  │         Configuration Tabs         │ │
│  │                 │  │  ┌─────┬──────┬──────┬──────┬────┐ │ │
│  │                 │  │  │Era  │Diff. │Mods  │ AI   │Perf│ │ │
│  │                 │  │  └─────┴──────┴──────┴──────┴────┘ │ │
│  │  [Validate]     │  │                                    │ │
│  │  [Update Mods]  │  │  ┌──────────────────────────────┐  │ │
│  │                 │  │  │                              │  │ │
│  └─────────────────┘  │  │    Active Tab Content        │  │ │
│                       │  │                              │  │ │
│  Status:              │  │                              │  │ │
│  ● Mods: Valid        │  │                              │  │ │
│  ● AI: Connected      │  │                              │  │ │
│  ● Game: Ready        │  └──────────────────────────────┘  │ │
│                       │                                    │ │
│  Game Version: 1.9.1  │  [Save Config]  [Load Config]      │ │
│  Mod Version: 2.0.0   │  [Reset to Defaults]               │ │
└──────────────────────────────────────────────────────────────┘
```

---

## Configuration File Structure

```
SoloTech/
├── config/
│   ├── launcher-settings.json    # Launcher preferences
│   ├── game-config.json          # Game configuration
│   ├── ai-config.json            # AI Empire settings
│   ├── mod-selection.json        # Enabled/disabled mods
│   └── profiles/                 # Saved configurations
│       ├── default.json
│       ├── hardcore.json
│       └── casual.json
├── cache/
│   ├── mod-versions.json         # Installed mod versions
│   └── ai-decisions/             # Cached AI responses
└── logs/
    ├── launcher.log
    └── ai-service.log
```

---

## Implementation Priority

### Phase 1 (MVP)
1. Era selection
2. Basic difficulty settings
3. AI provider configuration
4. Play/Validate buttons

### Phase 2
1. Mod enable/disable
2. Save/load configurations
3. AI behavior settings
4. Performance options

### Phase 3
1. Full mod management
2. Auto-updates
3. Profile system
4. Advanced AI configuration
