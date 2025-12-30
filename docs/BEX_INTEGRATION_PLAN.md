# AIEmpires + BattleTech Extended Tactics Integration Plan

**Version:** 1.0
**Date:** 2024-12-29
**Status:** Planning Phase

---

## 1. Executive Summary

This document outlines the integration strategy for adding LLM-controlled faction AI to BattleTech Extended Tactics (BEX-T). The approach uses a **Hybrid Model** where:

- **BEX Timeline** handles major historical events (Clan Invasion, etc.)
- **WarTechIIC** provides dynamic local warfare mechanics
- **AIEmpires** provides the "brain" - LLM agents making strategic decisions

This creates an experience where the broad strokes follow BattleTech lore, but the details of *how* factions fight, negotiate, and scheme are driven by AI personalities.

---

## 2. Current BEX-T Mod Stack Analysis

### 2.1 Installed Mods (Key Components)

| Mod | Purpose | AIEmpires Interaction |
|-----|---------|----------------------|
| **BT_Extended** | Base mod, mechs, equipment | No direct interaction |
| **BT_Extended_Timeline** | Scripted lore-based planet changes | Must coordinate, not conflict |
| **BT_Extended_CE** | Combat enhancements | No direct interaction |
| **Timeline** | Date system, forced events | AIEmpires hooks into events |
| **Mission Control** | Extended lances, mission variety | No direct interaction |
| **BetterAI** | Tactical combat AI | Different scope (tactical vs strategic) |
| **MechAffinity** | Pilot-mech bonding | No direct interaction |
| **PanicSystem** | Pilot morale in combat | Different scope |
| **IRBTModUtils** | Shared utilities | May use for logging/utilities |

### 2.2 What BEX-T Does NOT Have

- **WarTechIIC** - Dynamic faction warfare (NOT INSTALLED)
- **Galaxy at War** - Conflicts with Timeline (INCOMPATIBLE)
- **Strategic AI** - No AI-driven faction decisions
- **Diplomacy System** - Factions don't negotiate
- **Resource Simulation** - No economic layer

---

## 3. WarTechIIC Integration Analysis

### 3.1 Compatibility Assessment

| Factor | Status | Notes |
|--------|--------|-------|
| **Direct Conflicts** | ⚠️ Possible | BEX_Timeline conflicts with "Galaxy at War" but WarTechIIC is different |
| **Technical Compatibility** | ✅ Likely | WIIC used by BTA3062 and RogueTech with similar complexity |
| **Gameplay Overlap** | ⚠️ Needs Config | Timeline changes planets on dates; WIIC changes dynamically |
| **ModTek Compatibility** | ✅ Yes | Both use ModTek |

### 3.2 Potential Conflict: Timeline vs WarTechIIC

**The Problem:**
- Timeline changes planet ownership at specific dates (e.g., Clan Invasion 3049)
- WarTechIIC changes planet ownership dynamically via flareups
- These could fight over the same planets

**The Solution: Layered Approach**

```
┌─────────────────────────────────────────────────────────────┐
│                     TIMELINE LAYER                           │
│  Major historical events that MUST happen for lore:          │
│  - Clan Invasion corridors (3049-3052)                       │
│  - Tukayyid result (3052)                                    │
│  - Key capital changes                                       │
│  Timeline OVERRIDES WarTechIIC for these specific systems    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   WARTECHIIC LAYER                           │
│  Dynamic local conflicts on non-critical systems:            │
│  - Border skirmishes                                         │
│  - Peripheral world raids                                    │
│  - Secondary front battles                                   │
│  WarTechIIC handles "the details" of warfare                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AIEMPIRES LAYER                            │
│  LLM agents influence WarTechIIC decisions:                  │
│  - Which systems to attack                                   │
│  - Force commitment levels                                   │
│  - Diplomatic negotiations                                   │
│  - Resource allocation                                       │
│  AIEmpires provides the "why" behind faction actions         │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Configuration Strategy

**WarTechIIC Settings to Protect Timeline Systems:**

```json
{
  "cantBeAttacked": [
    "starsystemdef_Luthien",
    "starsystemdef_NewAvalon",
    "starsystemdef_Tharkad",
    "starsystemdef_Sian",
    "starsystemdef_Atreus",
    "starsystemdef_Terra"
    // ... other critical lore systems
  ],

  "ignoreFactions": [
    // Clans before 3049 (Timeline handles their appearance)
  ]
}
```

**AIEmpires Coordination:**
- Read Timeline's `ForcedTimelineEvent` data
- Ensure AI decisions don't contradict imminent timeline events
- AI can influence *how* events happen, not *whether* they happen

---

## 4. Revised Architecture

### 4.1 Component Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    BATTLETECH GAME (HBS)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  BT_Extended    │  │    Timeline     │  │  Mission Control│  │
│  │  (Base Content) │  │ (Date System)   │  │   (Missions)    │  │
│  └─────────────────┘  └────────┬────────┘  └─────────────────┘  │
│                                │                                  │
│                                ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              BT_Extended_Timeline                            │ │
│  │         (Lore-accurate planet changes)                       │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
│                                │                                  │
│                                ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    WarTechIIC                                │ │
│  │              (Dynamic Flareups/Raids)                        │ │
│  │                                                              │ │
│  │   Settings modified by AIEmpires:                            │ │
│  │   - WIIC_{faction}_attacks_{system}                          │ │
│  │   - WIIC_{faction}_attack_strength                           │ │
│  │   - WIIC_{attacker}_hates_{defender}                         │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
│                                │                                  │
│                                ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    AIEmpires Mod                             │ │
│  │                  (C# Game Integration)                       │ │
│  │                                                              │ │
│  │   - Reads game state (systems, factions, player)             │ │
│  │   - Writes WIIC stat overrides                               │ │
│  │   - Manages diplomacy state                                  │ │
│  │   - Communicates with AI Service                             │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
│                                │                                  │
└────────────────────────────────┼──────────────────────────────────┘
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Service (Python)                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Faction Agents                             ││
│  │                                                              ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           ││
│  │  │ Davion  │ │ Kurita  │ │ Steiner │ │  Liao   │  ...      ││
│  │  │  Agent  │ │  Agent  │ │  Agent  │ │  Agent  │           ││
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           ││
│  │       │           │           │           │                 ││
│  │       └───────────┴───────────┴───────────┘                 ││
│  │                           │                                  ││
│  │                           ▼                                  ││
│  │              ┌─────────────────────────┐                    ││
│  │              │     LLM Provider        │                    ││
│  │              │ (Claude/GPT/Ollama/etc) │                    ││
│  │              └─────────────────────────┘                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  State Management                            ││
│  │  - Galaxy State (systems, ownership, forces)                 ││
│  │  - Diplomatic State (treaties, trust, proposals)             ││
│  │  - Resource State (industry, commerce, morale)               ││
│  │  - Military State (units, supply lines)                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
Every Game Month (30 days):

1. AIEmpires Mod reads:
   - Current system ownership from SimGame
   - Active WarTechIIC flareups
   - Player position and reputation
   - Timeline upcoming events (next 90 days)

2. AI Service processes:
   - Each faction agent evaluates situation
   - Considers personality traits
   - Makes strategic decisions:
     - Attack targets
     - Defense priorities
     - Diplomatic actions
     - Resource allocation

3. Decisions execute via:
   - WIIC stat modifications (attacks, strength)
   - Diplomacy state updates
   - Resource state changes
   - Event triggers

4. Player sees:
   - New flareups appearing
   - Diplomatic announcements
   - Intel reports
   - Contract opportunities
```

---

## 5. What Each Design Document Becomes

### 5.1 Documents Directly Usable

| Document | Status | Changes Needed |
|----------|--------|----------------|
| **LLM_ARCHITECTURE.md** | ✅ Use as-is | None - provider-agnostic design works |
| **DIPLOMACY_DESIGN.md** | ✅ Use as-is | None - fills gap in BEX |
| **RESOURCE_SYSTEM_DESIGN.md** | ✅ Use as-is | None - fills gap in BEX |

### 5.2 Documents Needing Updates

| Document | Status | Changes Needed |
|----------|--------|----------------|
| **MOD_RESEARCH.md** | ⚠️ Update | Add BEX-specific dependencies, remove vanilla assumptions |
| **WARTECHIIC_RESEARCH.md** | ⚠️ Update | Add BEX Timeline coordination section |
| **PROJECT_STRUCTURE.md** | ⚠️ Update | Revise to show BEX integration points |

### 5.3 New Documents Needed

| Document | Purpose |
|----------|---------|
| **BEX_INTEGRATION_PLAN.md** | This document |
| **TIMELINE_COORDINATION.md** | How AIEmpires respects Timeline events |
| **WIIC_CONFIGURATION.md** | WarTechIIC settings for BEX compatibility |

---

## 6. Implementation Phases

### Phase 1: Foundation (v0.1.0)
**Goal:** Get WarTechIIC working with BEX-T

- [ ] Download and install WarTechIIC
- [ ] Configure `cantBeAttacked` for critical timeline systems
- [ ] Test that Timeline events still fire correctly
- [ ] Test that WIIC flareups occur on non-protected systems
- [ ] Document any conflicts found

### Phase 2: AI Service (v0.2.0)
**Goal:** External Python service making decisions

- [ ] Set up Python AI service (from LLM_ARCHITECTURE.md)
- [ ] Implement single LLM provider (Claude or local)
- [ ] Create basic faction agent with personality
- [ ] Test decision generation (no game integration yet)

### Phase 3: Game Integration (v0.3.0)
**Goal:** C# mod that bridges game and AI service

- [ ] Create AIEmpires C# mod skeleton
- [ ] Implement game state reader (systems, factions)
- [ ] Implement WIIC stat writer
- [ ] HTTP client to AI service
- [ ] Basic monthly decision cycle

### Phase 4: Diplomacy (v0.4.0)
**Goal:** Implement diplomatic layer

- [ ] Port DIPLOMACY_DESIGN.md to code
- [ ] Treaty system
- [ ] Trust mechanics
- [ ] AI diplomatic decisions

### Phase 5: Resources (v0.5.0)
**Goal:** Economic simulation

- [ ] Port RESOURCE_SYSTEM_DESIGN.md to code
- [ ] Resource generation/spending
- [ ] AI considers resources in decisions

### Phase 6: Polish (v0.6.0+)
**Goal:** Full experience

- [ ] Player UI integration
- [ ] Intel reports
- [ ] Narrative events
- [ ] Balance tuning

---

## 7. Key Technical Decisions

### 7.1 How AIEmpires Controls WarTechIIC

WarTechIIC uses company stats for runtime modification:

```csharp
// Force Davion to attack a specific system
sim.CompanyStats.SetValue("WIIC_Davion_attacks_starsystemdef_Capella", true);

// Increase Kurita's attack strength
sim.CompanyStats.SetValue("WIIC_Kurita_attack_strength", 5);

// Make Liao hate Davion more (prioritize as target)
sim.CompanyStats.SetValue("WIIC_Liao_hates_Davion", 2.0f);
```

AIEmpires will:
1. Query LLM for faction decisions
2. Translate decisions to WIIC stat modifications
3. Let WIIC handle the actual warfare mechanics

### 7.2 Timeline Coordination

Before making decisions, AIEmpires checks Timeline's `ForcedTimelineEvent` data:

```csharp
// Pseudo-code
var upcomingEvents = Timeline.GetEventsInRange(currentDate, currentDate + 90.days);
foreach (var evt in upcomingEvents) {
    if (evt.ChangesSystemOwnership(targetSystem)) {
        // Don't let AI attack this system - Timeline will handle it
        protectedSystems.Add(targetSystem);
    }
}
```

### 7.3 State Persistence

AIEmpires state saves alongside the game save:

```
BATTLETECH/Mods/AIEmpires/saves/
├── {saveGameId}/
│   ├── galaxy_state.json      # System ownership, forces
│   ├── diplomatic_state.json  # Treaties, trust scores
│   ├── resource_state.json    # Faction resources
│   └── decision_log.json      # History of AI decisions
```

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timeline/WIIC conflict | Medium | High | Careful configuration of protected systems |
| Performance issues | Low | Medium | Async AI calls, caching |
| Save game corruption | Low | High | Separate state files, validation |
| AI hallucinations | Medium | Low | Validate AI decisions before execution |
| BEX updates break mod | Medium | Medium | Version pinning, update monitoring |

---

## 9. Success Criteria

### Minimum Viable Product (MVP)
- [ ] WIIC integrated without breaking Timeline
- [ ] At least 5 major factions have LLM agents
- [ ] AI-driven attacks occur during gameplay
- [ ] No crashes or save corruption

### Full Release
- [ ] All major factions have distinct AI personalities
- [ ] Diplomacy system functional
- [ ] Resource system affects decisions
- [ ] Player can see AI faction "news"
- [ ] Intel reports provide strategic information

---

## 10. References

### External Resources
- [WarTechIIC GitHub](https://github.com/BlueWinds/WarTechIIC)
- [BattleTech Extended Tactics](https://discourse.modsinexile.com/t/battletech-extended-tactics/1859)
- [BTA3062 Wiki - WarTechIIC](https://www.bta3062.com/index.php?title=Wartech_IIC)

### Internal Documents
- [LLM_ARCHITECTURE.md](./LLM_ARCHITECTURE.md)
- [DIPLOMACY_DESIGN.md](./DIPLOMACY_DESIGN.md)
- [RESOURCE_SYSTEM_DESIGN.md](./RESOURCE_SYSTEM_DESIGN.md)
- [WARTECHIIC_RESEARCH.md](./WARTECHIIC_RESEARCH.md)

---

## Appendix A: WarTechIIC Key Settings

Settings that AIEmpires will need to configure:

```json
{
  // Protect timeline-critical systems
  "cantBeAttacked": ["list of capital/key systems"],

  // Control which factions participate before certain dates
  "ignoreFactions": ["Clans before 3049"],

  // Base aggression levels (AIEmpires can override per-faction)
  "aggression": {
    "Davion": 1.0,
    "Kurita": 1.2,
    "Liao": 0.8  // Less aggressive without AI boost
  },

  // Faction relationships (AIEmpires modifies dynamically)
  "hatred": {
    "Liao": { "Davion": 1.5 },
    "Kurita": { "Davion": 1.3 }
  },

  // How close to player flareups spawn (keep high for engagement)
  "distanceFactor": 1.0
}
```

---

*Document Status: v1.0 Complete - Ready for implementation planning*
