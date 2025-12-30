# WarTechIIC Research Documentation

## Overview

WarTechIIC (WIIC) is a GPL-3.0 licensed mod that provides **persistent faction warfare** for BattleTech. It creates dynamic faction conflicts that affect system ownership over time, providing the perfect foundation for AI-controlled empire management.

## Key Integration Points for AI Empires

### 1. Faction System

WIIC manages factions through several key data structures:

#### Settings Configuration (`settings.json`)
```json
{
  "ignoreFactions": ["NoFaction", "Locals", ...],  // Factions not participating in warfare
  "cantBeAttacked": ["ComStar", "Delphi"],         // Protected factions
  "wontHirePlayer": ["ClanWolf", ...],             // Factions that don't hire mercenaries
  "aggression": {"ClanNovaCat": 1.5, ...},         // Attack likelihood multipliers
  "hatred": {"Liao": {"Ives": 1.5}},               // Target preference multipliers
}
```

#### Faction Strength Settings
- `defaultAttackStrength`: Base attack force (default 10-20)
- `defaultDefenseStrength`: Base defense force (default 10-15)
- `attackStrength`: Per-faction override (e.g., "ClanWolf": 22)
- `defenseStrength`: Per-faction override (e.g., "Rasalhague": 20)
- `strengthVariation`: Random variance (+/- this value)

### 2. Attack System (`Attack.cs`)

Attacks are the primary warfare mechanic:

```csharp
public class Attack : ExtendedContract {
    public int attackerStrength;    // Current attacker forces
    public int defenderStrength;    // Current defender forces
    public int? playerDrops;        // Player participation tracking
    public bool? workingForDefender; // Which side player chose
}
```

**Attack Resolution:**
- Daily force attrition via `flareupForceLoss()`
- Combat reduces strength by 2-5 points per battle
- Victory when opponent's strength reaches 0
- Winner takes control of the system

### 3. Location Selection (`WhoAndWhere.cs`)

WIIC uses weighted random selection for attacks:

```csharp
// Weight factors:
weight = systemMultiplier * aggression[attacker] *
         (reputation[attacker] + reputation[defender]) *
         distanceMultiplier * hatred[attacker, defender]
```

**Key Methods for AI Integration:**
- `getFlareupEmployerAndLocation()` - Choose attack location
- `getTargets(system)` - Get valid targets for a system
- `getEmployers(system)` - Get valid employers for a system
- `getDistance(system)` - Distance from player position

### 4. Reputation System

```json
"reputationMultiplier": {
  "LOATHED": 5.0,    // Very likely to see conflicts
  "HATED": 3.0,
  "DISLIKED": 2.0,
  "INDIFFERENT": 1.0,
  "LIKED": 2.0,
  "FRIENDLY": 3.0,
  "HONORED": 7.0,
  "ALLIED": 10.0     // Most likely to see conflicts
}
```

### 5. Extended Contracts

WIIC supports various contract types beyond attacks:

- **Attack**: Full invasion for system control
- **Raid**: Temporary disruption without ownership change
- **Garrison Duty**: Defensive contracts
- **Field Testing**: Equipment trials
- **VIP Protection/Hunt**: Assassination/protection missions

## AI Empire Integration Strategy

### Option A: Hook into WIIC Decision Points

Modify WIIC to call our AI service at key decision points:

1. **Attack Target Selection** (`WhoAndWhere.checkForNewFlareup`)
   - Instead of random weighted selection, ask AI which system to attack

2. **Force Commitment** (`Attack` constructor)
   - AI decides strength allocation based on strategic importance

3. **Alliance Decisions** (new feature)
   - AI decides when to form/break alliances

### Option B: Parallel AI Controller

Create a separate AI controller that:
1. Monitors game state via WIIC data
2. Uses WIIC's methods to spawn attacks/raids
3. Influences outcomes through stat modifications

### Recommended: Hybrid Approach

```
┌─────────────────────────────────────────────────────────┐
│                    AI Empire Controller                  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  State Reader │  │ LLM Decision  │  │   Action    │  │
│  │  (WIIC Data)  │  │    Engine     │  │  Executor   │  │
│  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘  │
│          │                  │                  │         │
│          ▼                  ▼                  ▼         │
│  Read faction state  Make strategic     Spawn attacks   │
│  Read system control decisions via LLM  Modify stats    │
│  Read relationships                     Set aggression  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
           ┌───────────────────────────────┐
           │         WarTechIIC            │
           │  (Handles actual mechanics)   │
           └───────────────────────────────┘
```

## Key WIIC Methods to Hook

### Reading State
```csharp
// Get all systems owned by a faction
sim.StarSystems.Where(s => s.OwnerValue.Name == factionName)

// Get extended contracts (active attacks/raids)
WIIC.extendedContracts  // Dictionary<string, ExtendedContract>

// Get faction relationships
sim.GetReputation(faction)  // SimGameReputation enum
faction.FactionDef.Enemies  // List of enemy faction names
faction.FactionDef.Allies   // List of allied faction names
```

### Spawning Conflicts
```csharp
// Create new attack
Attack attack = new Attack(system, attacker, WIIC.extendedContractTypes["Attack"]);
WIIC.extendedContracts[system.ID] = attack;

// Create new raid
Raid raid = new Raid(system, attacker, WIIC.extendedContractTypes["Raid"]);
WIIC.extendedContracts[system.ID] = raid;
```

### Modifying Behavior
```csharp
// Set faction aggression via stats
sim.CompanyStats.SetValue($"WIIC_{faction}_attack_strength", modifier);
sim.CompanyStats.SetValue($"WIIC_{faction}_defense_strength", modifier);

// Daily attack/raid chances can be modified
WIIC.settings.dailyAttackChance
WIIC.settings.dailyRaidChance
```

## Data Flow for AI Decisions

```
┌──────────────────────────────────────────────────────────────┐
│                     Monthly AI Cycle                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. GATHER STATE                                              │
│     ├─ Current system ownership (Map<SystemID, Faction>)     │
│     ├─ Active conflicts (WIIC.extendedContracts)             │
│     ├─ Faction strengths (calculate from owned systems)      │
│     └─ Recent battle outcomes                                 │
│                                                               │
│  2. FOR EACH AI-CONTROLLED FACTION:                          │
│     ├─ Build context prompt with faction lore + state        │
│     ├─ Send to LLM for strategic decision                    │
│     ├─ Parse response: ATTACK/DEFEND/RAID/ALLIANCE           │
│     └─ Store decision for execution                          │
│                                                               │
│  3. EXECUTE DECISIONS                                         │
│     ├─ Spawn new attacks via WIIC                            │
│     ├─ Modify aggression/hatred settings                     │
│     └─ Adjust strength modifiers                             │
│                                                               │
│  4. LOG & REPORT                                              │
│     ├─ Store decisions in game journal                       │
│     └─ Update player via event popups                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Major Factions for AI Control

Based on WIIC settings and BattleTech lore:

### Inner Sphere Major Powers
| Faction | Aggression | Special Notes |
|---------|------------|---------------|
| Davion | Normal | Traditional rival of Liao |
| Steiner | Normal | Allied with Davion (FedCom) |
| Liao | Normal | Hates Ives, aggressive expansion |
| Marik | Normal | Internal divisions |
| Kurita | Normal | Honorable warriors |

### Clans
| Faction | Aggression | Special Notes |
|---------|------------|---------------|
| ClanWolf | High (22) | Most powerful, won't hire player |
| ClanJadeFalcon | High (23) | Aggressive, territorial |
| ClanGhostBear | High (22) | Defensive but powerful |
| ClanNovaCat | High (21) | 1.5x aggression modifier |

### Periphery
| Faction | Aggression | Special Notes |
|---------|------------|---------------|
| TaurianConcordat | Normal | Hates SanctuaryAlliance |
| MagistracyOfCanopus | Normal | Defensive posture |
| Marian | High (22) | Hates Marik, Illyrian |
| Circinus | High (21) | Pirate-adjacent |

## Implementation Phases

### Phase 1: Read-Only Integration
- Create state reader that extracts WIIC data
- Build faction context generator
- Test LLM decision making without execution

### Phase 2: Basic Execution
- Implement attack spawning via WIIC
- Add aggression/hatred modifiers
- Monthly decision cycle

### Phase 3: Advanced Features
- Alliance system
- Economic considerations
- Player reputation impact
- Multi-faction coordination

## File Locations in WarTechIIC

```
WarTechIIC/
├── src/
│   ├── WarTechIIC.cs      # Main entry point, settings loading
│   ├── Settings.cs         # Settings data class
│   ├── Attack.cs           # Attack mechanics
│   ├── Raid.cs             # Raid mechanics
│   ├── WhoAndWhere.cs      # Location/faction selection
│   ├── ExtendedContract.cs # Base contract class
│   ├── Campaign.cs         # Campaign/story system
│   └── patches/            # Harmony patches
└── data/
    ├── settings.json       # Main configuration
    ├── campaignSettings.json
    └── extendedContracts/  # Contract type definitions
```

## Next Steps

1. Create AIEmpireController class that interfaces with WIIC
2. Design prompt templates for each faction
3. Implement state extraction from WIIC
4. Build decision execution layer
5. Add configuration for AI update frequency
6. Create UI for AI faction display
