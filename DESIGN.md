# RogueTech AI Empires - Design Document

## Overview

AI Empires is a mod that adds LLM-powered strategic AI to RogueTech factions, creating a dynamic galaxy where empires rise and fall based on intelligent decision-making rather than simple rules.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI Empires System                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────┐         ┌────────────────────┐                  │
│  │   AIEmpires.dll    │◄───────►│  AIEmpires Service │                  │
│  │   (C# BT Mod)      │  HTTP   │  (Python + Claude) │                  │
│  └─────────┬──────────┘         └─────────┬──────────┘                  │
│            │                              │                              │
│            ▼                              ▼                              │
│  ┌────────────────────┐         ┌────────────────────┐                  │
│  │   Game Hooks       │         │   Claude API       │                  │
│  │   - OnDayPassed    │         │   - Sonnet 3.5     │                  │
│  │   - OnContractEnd  │         │   - Faction Agents │                  │
│  │   - OnSystemChange │         │   - Strategy Gen   │                  │
│  └────────────────────┘         └────────────────────┘                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Galaxy State (JSON)                          │   │
│  │  - Faction territories, military power, economies                 │   │
│  │  - Active wars and conflicts                                      │   │
│  │  - Pending AI actions                                             │   │
│  │  - Historical events log                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Configuration

### Decision Triggers
- **Monthly Tick**: Every 30 game days, all major factions evaluate strategy
- **Significant Events**: Player contract completion, system ownership change
- **Reactive**: When attacked, factions respond immediately

### Major Factions (LLM-Controlled)
15 major powers with distinct personalities:

| Faction | Personality | Playstyle |
|---------|-------------|-----------|
| WolfEmpire | Aggressive, honorable | Conquest-focused, respects strength |
| ClanJadeFalcon3150 | Militant, traditional | Territory expansion, bitter rivalry with Wolf |
| Davion3150 | Defensive, diplomatic | Holds territory, builds alliances |
| Steiner3150 | Economic, stubborn | Mercenary hiring, defensive wars |
| Kurita3150 | Honorable, patient | Strategic strikes, long-term planning |
| Liao3150 | Cunning, opportunistic | Raids, espionage, exploits weakness |
| Marik3150 | Fractured, pragmatic | Internal politics, shifting alliances |
| RasalhagueDominion | Defensive, Clan-hybrid | Protects borders, selective expansion |
| MagistracyOfCanopus3150 | Mercantile, defensive | Trade focus, hires mercenaries |
| TaurianConcordat3150 | Paranoid, defensive | Anti-Davion, fortress mentality |
| ClanHellsHorses3150 | Combined arms, mobile | Fast strikes, vehicle focus |
| ScorpionEmpire | Religious, expansionist | Seeks to "enlighten" the Inner Sphere |
| ClanSeaFox3150 | Mercantile, opportunistic | Trade leverage, information warfare |
| GalateanLeague | Mercenary hub | Neutral, profits from conflict |
| ComStar | Manipulative, secretive | Plays factions against each other |

### Player Integration
- Player joins faction via reputation threshold
- High reputation = strategic influence points
- Can suggest targets (AI considers but may refuse)
- Faction provides bonuses/special contracts
- Player actions directly impact faction power

## Data Structures

### GalaxyState.json
```json
{
  "schemaVersion": "1.0",
  "currentDay": 0,
  "lastProcessedDay": 0,
  "factions": {},
  "systems": {},
  "activeConflicts": [],
  "pendingActions": [],
  "eventLog": [],
  "playerState": {}
}
```

### FactionState
```json
{
  "factionId": "WolfEmpire",
  "controlledSystems": ["starsystemdef_Terra", "..."],
  "militaryPower": 0.95,
  "economicPower": 0.80,
  "manpower": 0.70,
  "activeWars": ["ClanJadeFalcon3150"],
  "treaties": [],
  "strategicPriorities": ["hold_terra", "destroy_jade_falcon"],
  "lastDecision": {},
  "decisionHistory": []
}
```

### AIAction
```json
{
  "id": "uuid",
  "faction": "WolfEmpire",
  "actionType": "attack|defend|raid|diplomacy|build",
  "target": "starsystemdef_Sudeten",
  "strength": 0.6,
  "createdDay": 12500,
  "executeDay": 12510,
  "status": "pending|executing|resolved",
  "outcome": null,
  "reasoning": "Jade Falcon capital vulnerable after recent losses"
}
```

## LLM Prompt Structure

### Faction Agent System Prompt
```
You are the strategic AI for {faction_name} in BattleTech, year 3151.

FACTION PERSONALITY:
{personality_description}

STRATEGIC DOCTRINE:
{doctrine_description}

You make decisions based on:
1. Military capability vs threats
2. Economic sustainability
3. Historical grudges and alliances
4. Opportunistic expansion
5. Defense of core worlds

Respond ONLY with valid JSON matching the ActionSchema.
```

### Decision Request
```
CURRENT SITUATION:
- Controlled Systems: {count}
- Military Power: {power}%
- Economy: {economy}%
- Active Wars: {wars}

BORDERS:
{neighbor_summary}

RECENT EVENTS (last 90 days):
{event_log}

PLAYER FACTION MEMBER: {yes/no}
PLAYER SUGGESTION: {suggestion or "none"}

What is your strategic decision this month?
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. C# mod skeleton with ModTek integration
2. Galaxy state persistence
3. Day advancement hooks
4. Basic HTTP service communication

### Phase 2: Python Service
1. Flask/FastAPI service
2. Claude API integration
3. Faction agent management
4. Decision caching

### Phase 3: Game Integration
1. System ownership changes
2. Contract generation based on wars
3. Map visualization
4. Player faction membership

### Phase 4: Polish
1. Event notifications
2. Faction news/intel system
3. Balance tuning
4. Performance optimization

## File Structure

```
AIEmpires/
├── src/
│   ├── AIEmpires/              # C# mod
│   │   ├── AIEmpires.csproj
│   │   ├── Main.cs
│   │   ├── Patches/
│   │   ├── State/
│   │   └── Services/
│   └── ai_service/             # Python service
│       ├── main.py
│       ├── agents/
│       ├── prompts/
│       └── config/
├── config/
│   ├── factions.json           # Faction personalities
│   ├── settings.json           # Mod settings
│   └── prompts/                # LLM prompt templates
├── data/
│   └── galaxy_state.json       # Runtime state
└── mod.json                    # ModTek manifest
```
