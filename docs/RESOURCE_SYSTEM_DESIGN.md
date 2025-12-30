# AIEmpires Resource & Military System Design

**Version:** 0.1 (Draft)
**Status:** Design Phase
**Target Version:** 0.7.0+

## Overview

This document defines the economic, military, and logistics systems that drive faction behavior in AIEmpires. Resources are the fundamental driver of all faction decisions - diplomacy, warfare, and expansion are all constrained by what a faction can afford and sustain.

### Design Philosophy

1. **Resources drive behavior**: Factions make decisions based on what they can sustain, not just what they want
2. **Logistics matter**: Deep strikes are possible but costly; supply lines can be disrupted
3. **Units are valuable**: Named military units from lore, expensive to build, painful to lose
4. **Fog of war**: Players and AI see only what intelligence reveals
5. **Faction identity**: Each faction has unique economic and morale characteristics

---

## Part 1: Core Resources

### 1.1 Resource Types

Each faction tracks six core resources:

| Resource | Description | Primary Use |
|----------|-------------|-------------|
| **Industry** | Production capacity | Build/reinforce military units |
| **Commerce** | Trade and economic activity | Generates Credits |
| **Morale** | Faction stability and willpower | Affects all other resources |
| **Research** | Technological development | Slowly improves other categories |
| **Intelligence** | Spy networks and information | Reveals enemy activity, protects secrets |
| **Credits** | Treasury/currency | Universal spending resource |

### 1.2 Resource Interactions

```
                    ┌─────────────┐
                    │   MORALE    │
                    │ (Stability) │
                    └──────┬──────┘
                           │ affects all
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ INDUSTRY │     │ COMMERCE │     │ RESEARCH │
    └────┬─────┘     └────┬─────┘     └────┬─────┘
         │                │                │
         │ requires       │ generates      │ requires
         ▼                ▼                ▼
    ┌─────────────────────────────────────────────┐
    │                  CREDITS                     │
    │            (Universal Currency)              │
    └─────────────────────────────────────────────┘
         │
         │ funds
         ▼
    ┌──────────────┐
    │ INTELLIGENCE │
    └──────────────┘
```

### 1.3 Resource Generation (Per Tick - 30 days)

**Commerce → Credits:**
- Base: `Commerce Points × Commerce Multiplier = Credits Generated`
- Modified by: Trade agreements, system industrial value, Morale

**Industry Usage:**
- Building units: `Industry Points + Credits → New Unit`
- Reinforcing units: `Industry Points + Credits → HP Restored`
- Cannot produce without Credits

**Research Usage:**
- Spend Credits + Research Points → Permanent increase to Industry, Commerce, or Morale capacity
- Very slow: Takes multiple ticks to see improvement
- Represents technological/doctrinal advancement

**Morale Effects:**
- High Morale (>75%): +10% to Industry and Commerce output
- Normal Morale (40-75%): No modifier
- Low Morale (20-40%): -15% to Industry and Commerce output
- Critical Morale (<20%): -30% to all output, units may refuse orders

### 1.4 Resource Spending ("Push" Mechanics)

Factions can "burn" resources for short-term gains:

| Spend | To Boost | Effect | Cost |
|-------|----------|--------|------|
| Morale | Industry | 7-day work weeks, forced overtime | -5 Morale → +20% Industry this tick |
| Morale | Commerce | War bonds, patriotic spending | -5 Morale → +15% Commerce this tick |
| Credits | Morale | Propaganda, celebrations | Credits → +Morale (expensive) |
| Industry | Rush Build | Factories work overtime | -Industry capacity next tick |

### 1.5 Faction Starting Resources

Resources should be scraped from Sarna.net for accuracy. Example framework:

| Faction Size | Industry | Commerce | Morale | Research | Starting Credits |
|--------------|----------|----------|--------|----------|------------------|
| Major (Davion, Kurita) | 800-1200 | 600-1000 | 70-80 | 150-250 | 5000-8000 |
| Medium (Rasalhague, FRR) | 200-400 | 150-300 | 60-75 | 50-100 | 1500-3000 |
| Minor (Periphery) | 50-150 | 40-100 | 50-70 | 20-50 | 500-1500 |
| Clan (varies) | 300-600 | 100-200 | 85-95 | 200-400 | 2000-4000 |

*Note: Actual values to be determined from Sarna scraping.*

---

## Part 2: Military Units

### 2.1 Unit Data Structure

Each military unit is tracked as a "counter" similar to board wargames:

```
Unit {
    id: string                    // Unique identifier
    name: string                  // "10th Lyran Guards RCT"
    faction: string               // Owning faction

    // Combat Statistics
    baseAttack: int               // Base attack strength (1-10)
    baseDefense: int              // Base defense strength (1-10)
    currentAttack: int            // Modified by supply, damage
    currentDefense: int           // Modified by supply, damage

    // Health & Supply
    maxHP: int                    // Maximum hit points (typically 5)
    currentHP: int                // Current hit points
    supplyNeed: int               // Base supply requirement
    currentSupply: int            // Actual supply received this tick

    // Status
    mode: enum                    // DEPLOYED, GARRISON, RESERVE
    location: string              // Current system ID
    status: enum                  // READY, ENGAGED, RETREATING, RECONSTITUTING

    // Metadata
    unitType: string              // REGIMENT, RCT, CLUSTER, GALAXY, etc.
    eliteLevel: int               // 0=Green, 1=Regular, 2=Veteran, 3=Elite
    specialRules: list            // Faction-specific abilities
}
```

### 2.2 Unit Modes

| Mode | Supply Need | Attack Modifier | Defense Modifier | Notes |
|------|-------------|-----------------|------------------|-------|
| **DEPLOYED** | 100% | Normal | Normal | Ready for offensive operations |
| **GARRISON** | 50% | Set to 0 | +2 bonus | Defensive only, dug in |
| **RESERVE** | 25% | N/A | N/A | Not combat-ready, rebuilding |

### 2.3 Supply Effects on Combat

Supply level affects unit effectiveness:

| Supply Level | Attack Modifier | Defense Modifier |
|--------------|-----------------|------------------|
| 150%+ (Surplus) | +2 | +1 |
| 100-149% (Full) | +0 | +0 |
| 75-99% (Adequate) | -1 | +0 |
| 50-74% (Strained) | -2 | -1 |
| 25-49% (Critical) | -3 | -2 |
| <25% (Starving) | -4 | -3, may rout |

### 2.4 Unit Creation & Reinforcement

**Creating a New Unit:**
- Cost: High Industry + High Credits + Time (3-6 ticks)
- Requires: Manpower availability, industrial hub system
- New units start at Regular experience

**Reinforcing a Damaged Unit:**
- Cost: Industry + Credits per HP restored
- Formula: `HP Cost = Base Unit Cost × 0.15 per HP`
- Can be done at any friendly system (slower) or industrial hub (faster)

**Reconstituting a Destroyed Unit:**
- Cost: 75% of new unit cost
- Time: Must wait minimum 2 ticks before rebuild can begin
- Morale penalty to faction when unit is destroyed
- Unit returns at Green experience level

**Manpower Limits:**
- Each faction has a maximum unit count based on population/lore
- Major factions: 40-80 units
- Medium factions: 15-30 units
- Minor factions: 5-15 units
- Clans: 10-25 units (but higher quality)

### 2.5 Named Units from Lore

Units should be named from BattleTech lore where possible:

**Example - Federated Suns:**
- Davion Brigade of Guards (1st-5th Guards)
- Crucis Lancers (1st-10th)
- Syrtis Fusiliers (1st-8th)
- Deneb Light Cavalry
- Robinson Rangers

**Example - Draconis Combine:**
- Sword of Light (1st-5th)
- Genyosha
- Ryuken (I-VI)
- Ghost Regiments
- Pesht Regulars

*Full unit lists to be compiled from Sarna.net*

---

## Part 3: Combat Resolution

### 3.1 Battle Frequency

Combat speed depends on total strength committed:

| Total Strength Points | Battles per Tick | Rationale |
|-----------------------|------------------|-----------|
| Small (<15 combined) | 4 battles | Skirmishes, quick maneuvers |
| Medium (15-30) | 2 battles | Significant engagements |
| Large (31-50) | 1 battle | Major operations |
| Massive (>50) | 1 battle | Strategic-level warfare |

*Strength = Sum of all Attack + Defense points of engaged units*

### 3.2 Combat Resolution Formula

For each battle:

```
Attacker Roll = Attacker Strength + d10 + Modifiers
Defender Roll = Defender Strength + d10 + Modifiers

If Attacker Roll > Defender Roll:
    Defender takes 1 HP damage
    Attacker may take 0-1 HP damage (based on margin)
Else:
    Attacker takes 1 HP damage
    Defender may take 0-1 HP damage (based on margin)
```

**Modifiers:**
- Terrain bonuses (fortified worlds, hostile environments)
- Supply level modifiers
- Elite unit bonuses
- Outnumbered penalties

### 3.3 Multi-Unit Combat

When Unit A attacks system with Units B and C:

1. **Outnumber Penalty**: A takes -1 Attack per extra defending unit
2. **Defender Focus Fire**: B and C combine attacks against A
3. **Attacker Target Selection**: A must choose one target per battle
4. **Defender Coordination Bonus**: +1 Defense if multiple units work together

**Example:**
- Unit A (Attack 5, Defense 3) attacks
- Unit B (Attack 3, Defense 4) and Unit C (Attack 2, Defense 3) defend
- A gets -1 Attack (outnumbered) = 4 effective Attack
- B+C get combined Attack of 5 against A
- A chooses to focus on B
- Battle: A(4) vs B(4 defense) while B+C(5 combined) vs A(3 defense)

### 3.4 Disengagement

LLM-controlled factions set a damage threshold for each unit. When reached, unit attempts to disengage:

**Disengagement Roll (d100):**

| Roll | Result |
|------|--------|
| 01-05 | Critical Success: Escape + recover 1 HP (found lost units) |
| 06-30 | Success: Clean withdrawal with current HP |
| 31-50 | Partial Success: Withdraw but take 1 additional HP damage |
| 51-75 | Failure: Cannot disengage, take 1 HP, must try again next battle |
| 76-95 | Bad Failure: Cannot disengage, take 2 HP damage |
| 96-00 | Critical Failure: Unit trapped, fight continues until destroyed or enemy withdraws |

**Retreat Destination:**
- Minor damage (3+ HP): Can retreat to any friendly system
- Heavy damage (1-2 HP): Must retreat to industrial hub for reconstitution
- Destroyed (0 HP): Unit eliminated, reconstitution timer begins

### 3.5 Fight to the Last

Factions can order units to fight without retreat:

**Consequences:**
- Unit fights until destroyed
- May deal significant damage to enemy
- Unit destruction causes major Morale hit to faction (-10 to -20)
- Reconstitution timer is extended (+1 tick)
- Some factions (Clans, Combine) take smaller Morale hit from heroic last stands

### 3.6 Terrain & System Modifiers

| System Type | Effect |
|-------------|--------|
| **Fortified World** | Garrison units get +3 Defense |
| **Industrial Hub** | Faster reinforcement (2x speed) |
| **Chokepoint System** | Max 2 attacking units can engage |
| **Hostile Environment** | Both sides take 1 HP attrition per 2 ticks |
| **Capital World** | Garrison +4 Defense, Morale bonus for defenders |

---

## Part 4: Supply Lines

### 4.1 Supply Network Structure

Each faction has:
- **Resource Hubs**: Major industrial/economic centers (1-5 per faction)
- **Supply Lines**: Paths from hubs to deployed units
- **Supply Capacity**: Maximum resources that can flow through the network

### 4.2 Supply Path Calculation

Supply must trace a path from a Resource Hub to the unit:

```
Supply Cost Multiplier = 1.0 (base)

For each jump through FRIENDLY space: ×1.0 (no penalty)
For each jump through NEUTRAL space: ×1.5
For each jump past friendly frontier: ×2.0 (exponential)
```

**Example - Deep Strike:**
```
Hub → Friendly → Friendly → Frontier → Enemy → Enemy → Target
                              ↑
                         Last friendly

Multiplier: 1.0 × 1.0 × 1.0 × 2.0 × 4.0 = 8.0× supply cost
```

**Supply Cost Cap:** Maximum 16× multiplier (4 jumps into enemy space)

### 4.3 Resource Hubs

**Major Factions (3-5 hubs):**
- Federated Suns: New Avalon, Robinson, Kathil, Filtvelt
- Draconis Combine: Luthien, Pesht, Dieron, Benjamin
- Lyran Commonwealth: Tharkad, Coventry, Donegal

**Medium Factions (1-2 hubs):**
- Rasalhague: Rasalhague, Tukayyid (if held)
- Capellan: Sian, St. Ives (if not independent)

**Minor Factions (1 hub):**
- Typically capital world only

**Clans:**
- Occupation Zone capitals serve as hubs
- Clan supply is more self-sufficient (see Clan mechanics)

### 4.4 Supply Interdiction

When enemy forces attack a system in a supply line:

| Interdiction Level | Effect on Supply | Trigger |
|--------------------|------------------|---------|
| **Raided** | -25% throughput | Raid action on system |
| **Contested** | -50% throughput | Enemy unit present, not yet captured |
| **Cut** | -100% (no supply) | Enemy controls system |

**Faction Response Options:**
- Divert forces to clear the supply line
- Accept reduced supply to forward units
- Retreat forward units to shorten supply line
- Wait for raiders to leave (they're burning supply too)

### 4.5 Supply Planning

AI factions consider supply when making decisions:

```
Proposed Attack Viability =
    Available Supply / (Unit Supply Need × Distance Multiplier)

If Viability < 1.0: Attack not sustainable
If Viability < 1.5: Attack risky, may need to limit commitment
If Viability > 2.0: Attack well-supplied
```

---

## Part 5: Intelligence System

### 5.1 Intelligence Capacity

Each faction has an Intelligence rating representing spy network strength:

**Intelligence Actions:**
- **Scout**: Reveal enemy unit positions in a system
- **Assess**: Reveal enemy unit strength/HP
- **Infiltrate**: Reveal enemy resource levels
- **Intercept**: Reveal enemy orders/plans (expensive)
- **Counter-Intel**: Protect own information from enemy spies

### 5.2 Intelligence Costs

| Action | Intel Cost | Success Rate | Duration |
|--------|------------|--------------|----------|
| Scout System | 5 | 80% | 1 tick |
| Assess Unit | 10 | 70% | 1 tick |
| Infiltrate Faction | 25 | 50% | 3 ticks |
| Intercept Orders | 50 | 30% | 1 tick |
| Counter-Intel | 15/tick | Passive | Ongoing |

### 5.3 Faction Intelligence Bonuses

Some factions have superior intelligence services:

| Faction | Agency | Bonus |
|---------|--------|-------|
| Draconis Combine | ISF | +20% success rate |
| Federated Suns | MIIO | +15% success rate, cheaper Assess |
| Lyran Commonwealth | LIC | +10% success rate |
| Capellan Confederation | Maskirovka | +25% counter-intel, +20% infiltrate |
| ComStar | ROM | +30% all actions, see HPG section |
| Clans | Watch | Different system (see Clan mechanics) |

### 5.4 Fog of War

**What Players See:**

| Faction Relationship | Visible Information |
|---------------------|---------------------|
| Own Faction | Full: all resources, units, orders |
| Allied Faction | Partial: unit positions, approximate strength |
| Neutral Faction | Minimal: system ownership, public reputation |
| Enemy Faction | Only what Intelligence reveals |

---

## Part 6: Morale System

### 6.1 Faction Morale Profiles (UpFront-Inspired)

Each faction has a morale archetype:

| Profile | Break Threshold | Rally Speed | Example Factions |
|---------|-----------------|-------------|------------------|
| **Professional** | 30% Morale | Fast (5/tick) | Federated Suns, Lyran, Star League |
| **Fanatical** | 15% Morale | Very Slow (1/tick) | Draconis Combine, Clans, Word of Blake |
| **Resilient** | 25% Morale | Medium (3/tick) | Free Worlds League, Capellan |
| **Flexible** | 40% Morale | Very Fast (8/tick) | Mercenaries, Periphery States |
| **Commissar** | 35% Morale | Special* | ComStar (ROM), Capellan (Maskirovka) |

*Commissar Special: When Morale drops below 25%, a "purge" event can instantly restore 30 Morale but destroys one unit.

### 6.2 Morale Triggers

**Morale Increases:**
| Event | Morale Change | Notes |
|-------|---------------|-------|
| Win battle | +1 to +3 | Based on margin |
| Capture enemy system | +3 to +5 | Capital = +10 |
| Sign favorable treaty | +2 to +5 | |
| Long peace (peaceful factions) | +1/tick | Davion, FWL |
| Destroy enemy unit | +5 | |
| Successful defense of capital | +8 | |

**Morale Decreases:**
| Event | Morale Change | Notes |
|-------|---------------|-------|
| Lose battle | -1 to -3 | Based on margin |
| Lose system | -3 to -5 | Capital = -15 |
| Unit destroyed | -5 to -10 | Elite units = worse |
| Prolonged war | -1/tick | After 6 ticks of war |
| Peace too long (aggressive factions) | -1/tick | Clans, Combine |
| Break treaty (honorable factions) | -5 to -15 | |
| Economic hardship (Credits < 0) | -2/tick | |

### 6.3 Morale Death Spiral Prevention

To prevent unrecoverable collapse:

1. **Morale Floor**: Each faction has minimum Morale based on identity
   - Clans: Floor at 40 (warrior pride)
   - Combine: Floor at 30 (bushido)
   - Mercenaries: Floor at 20 (survival instinct)

2. **Allied Intervention**: Allies can send Credits to boost Morale

3. **Rally Events**: At critical Morale, special events can trigger
   - New charismatic leader
   - Enemy atrocity galvanizes resistance
   - Discovery of lost Star League cache

4. **Capitulation Option**: Before total collapse, faction can become vassal

---

## Part 7: ComStar & HPG System

### 7.1 HPG Network

ComStar controls the Hyperpulse Generator network, enabling interstellar communication.

**HPG Services:**
- Military orders transmitted quickly
- Diplomatic communications
- Intelligence sharing
- Economic transactions

### 7.2 HPG Payment Structure

Factions pay ComStar based on usage:

```
Monthly HPG Cost = (Systems Owned × 5) + (Active Orders × 2) + (Intel Actions × 3)
```

### 7.3 HPG Access Levels

| Level | Status | Effect |
|-------|--------|--------|
| **Full Access** | Paid in full | Normal operations |
| **Level 1 Restriction** | Minor arrears | Orders delayed 0.5 ticks, -10% Intel success |
| **Level 2 Restriction** | Major arrears | Orders delayed 1 tick, -25% Intel, no diplomatic comms |
| **Level 3 Blackout** | Hostile/unpaid | No orders (units act on last instructions), no Intel, no diplomacy |

### 7.4 ComStar Neutrality

ComStar maintains a **Neutrality Score** (0-100):

**Neutrality Decreases When:**
- Cutting off a faction without payment justification (-10)
- Favoring one faction in intelligence (-5)
- ROM assassinations revealed (-15)
- Supporting one side in a war (-20)

**Consequences of Low Neutrality:**
- Factions may refuse to pay (form alternate networks)
- Military action against ComStar facilities
- Coalition forming against ComStar
- Loss of "neutral ground" status for negotiations

### 7.5 ComStar as a Faction

When controlled by LLM:
- Seeks to maintain neutrality while advancing hidden agenda
- ROM conducts covert operations
- Accumulates massive Credit reserves
- May manipulate conflicts to weaken Inner Sphere
- Word of Blake schism possible event trigger

---

## Part 8: Clan-Specific Mechanics

### 8.1 Clan Differences

| Aspect | Inner Sphere | Clans |
|--------|--------------|-------|
| Unit Creation | Industry + Credits | Very expensive, slow |
| Unit Quality | Varies | Generally Elite |
| Supply Efficiency | Standard | Self-sufficient (-25% supply need) |
| Mercenaries | Can hire | Cannot hire (except Wolf-in-Exile) |
| Morale | Varies by faction | High but slow to recover |
| Combat Style | Flexible | Honor-bound (Trials) |

### 8.2 Clan Combat: Trials

Clans prefer Trials to conventional warfare:

**Trial of Possession:**
- Challenge for specific objective (system, unit, resource)
- Both sides bid forces (lower bid goes first)
- Honor demands efficient use of forces
- Winning with overbid = shame
- See Phase 3 Diplomacy for Trial mechanics

### 8.3 Isorla (Spoils of War)

When Clans defeat enemy units:
- Capture percentage of enemy equipment
- Bondsmen reduce enemy unit permanently (-1 max HP)
- Captured resources partially restore Clan units
- Formula: `Isorla Value = Enemy Unit Value × 0.1 × Battle Margin`

### 8.4 Touman Limits

Clans have fixed military establishment:
- Cannot easily create new units
- Must rebuild destroyed units from same "slot"
- Quality over quantity enforced

---

## Part 9: Mercenary System

### 9.1 Mercenary Unit Structure

Mercenary units are a shared pool available for hire:

```
MercenaryUnit extends Unit {
    mrbRating: string          // "A*" to "F"
    reliability: int           // 0-100, affects contract completion
    currentEmployer: string    // Faction ID or null
    contractEnd: int           // Day contract expires
    homeBase: string           // Where they retreat to
    specializations: list      // "Assault", "Recon", "Garrison", etc.
    notoriety: int             // Affects who will hire them
}
```

### 9.2 MRB Ratings

Based on Mercenary Review and Bonding Commission:

| Rating | Skill Level | Reliability | Typical Pay |
|--------|-------------|-------------|-------------|
| A* | Elite | 95%+ | 3× base |
| A | Veteran | 90%+ | 2× base |
| B | Veteran | 80%+ | 1.5× base |
| C | Regular | 70%+ | 1× base |
| D | Regular | 60%+ | 0.8× base |
| F | Green | 50%+ | 0.5× base |

### 9.3 Contract Structure

```
Contract {
    employer: string
    mercenary: string
    objective: enum            // ATTACK, DEFEND, RAID, GARRISON, RECON
    target: string             // System ID
    duration: int              // Ticks
    payment: {
        upfront: int           // Credits on signing
        completion: int        // Credits on success
        salvage: float         // Percentage of battlefield salvage
    }
    failurePenalty: string     // Reputation hit, partial payment, etc.
}
```

### 9.4 Mercenary AI Behavior

LLM-controlled mercenaries consider:
- Contract terms vs risk
- Employer reputation (will they pay?)
- Target difficulty
- Current unit strength
- Won't fight former employers for X ticks
- Famous units have special loyalty rules

### 9.5 Famous Mercenary Units

| Unit | Rating | Special Rules |
|------|--------|---------------|
| Wolf's Dragoons | A* | Won't fight Clans, massive force |
| Kell Hounds | A* | Strong Steiner ties |
| Eridani Light Horse | A* | Star League loyalists |
| Northwind Highlanders | A | Strong cultural identity |
| Gray Death Legion | A | Helm Memory Core holders |
| 12th Vegan Rangers | B | Multiple battalions |

### 9.6 Player Mercenary Company

The player's company interacts with this system:

**What Players See:**
- Contract offers based on MRB rating
- Employer faction's visible military situation
- Payment terms and objectives
- Reputation consequences

**What Players Don't See:**
- Employer's full resource situation (unless allied/high intel)
- Strategic reasoning behind contracts
- Other factions' mercenary contracts

**Contract Types by Rating:**

| Rating | Available Contracts |
|--------|-------------------|
| F-D | Anti-piracy, garrison duty, planetary security |
| C-B | Minor offensive operations, important garrisons |
| B-A | Major offensives, strategic raids |
| A-A* | War-turning operations, faction leadership contracts |

---

## Part 10: Era Configurations

### 10.1 Supported Eras

Following RogueTech's model:

| Era | Year | Key Features |
|-----|------|--------------|
| **Succession Wars** | 3025 | LosTech scarcity, Great Houses dominant |
| **Clan Invasion** | 3049 | Clans arrive, technological renaissance |
| **Civil War** | 3062 | FedCom splits, Word of Blake rising |
| **Dark Age** | 3151 | Republic fallen, ilClan era |

### 10.2 Era-Specific Changes

Each era modifies:
- Faction existence (some don't exist in certain eras)
- Starting resources
- Available units
- Technology levels (affects unit stats)
- Diplomatic relationships
- Active conflicts

---

## Part 11: Player Interaction

### 11.1 Information Visibility

**Playing as Mercenary Company:**
- See contract offers from multiple factions
- See employer's military situation (limited by intel)
- Cannot influence faction strategy (usually)
- Participate in battles directly

**Playing as Faction Unit:**
- Receive orders from faction command
- See more of own faction's situation
- Cannot choose targets (ordered)
- May gain influence at high reputation

### 11.2 Player Influence Thresholds

| Reputation Level | Influence |
|------------------|-----------|
| Unknown | None - receive orders only |
| Recognized | Can request preferred deployment |
| Trusted | Informed of strategic situation |
| Legendary | Can suggest targets, may be consulted |

### 11.3 Contract/Order Presentation

**Mercenary Contract:**
```
INCOMING CONTRACT OFFER
Employer: Federated Suns (MIIO)
Objective: Planetary Assault - Capra III
Opposition: Estimated 2 battalions, regular quality
Duration: 90 days
Payment: 2.5M C-Bills + 40% salvage
Risk Assessment: Moderate
Accept / Decline / Negotiate
```

**Faction Order:**
```
OPERATIONAL ORDERS - CLASSIFIED
From: Draconis Combine High Command
Unit: 5th Galedon Regulars
Assignment: Garrison reinforcement - Breed
Duration: Until relieved
Priority: HIGH - Intelligence indicates Davion probe likely
Report to: Tai-sho Hideki Mitsuhara
```

---

## Part 12: Implementation Phases

### Phase 1: Core Resources (v0.7.0) - COMPLETE
- [x] Resource data structures (Industry, Commerce, Morale, Research, Credits, Intelligence)
      → `ResourceState.cs` - Full implementation with morale profiles, generation, spending
- [x] Basic generation and spending mechanics
      → `ResourceState.ProcessTick()` - Commerce→Credits, morale recovery, morale modifiers
      → `ResourceState.SpendCredits()`, `BurnMoraleForIndustry()`, etc.
- [x] Faction starting values (from Sarna.net scraping)
      → `faction_resources.json` - 21 factions with full resource data
      → `ResourceLoader.cs` - Loads and initializes factions by era
- [x] Resource UI/display for player
      → `faction_agent.py` - Resources formatted in AI context (lines 536-551)
- [x] AI consideration of resources in decisions
      → `faction_agent.py` - AI instructed to consider credits, morale, supply (lines 762-771)
      → GalaxySimulator integrates resource processing into tick flow

### Phase 2: Military Units (v0.7.1) - COMPLETE
- [x] Unit data structure
      → `MilitaryUnit.cs` - Attack/Defense/HP/Supply/Elite system
- [x] Named units database (from Sarna.net)
      → `faction_resources.json` - Brigades, regiments, galaxies, clusters
- [x] Combat resolution system
      → `MilitaryUnit.TakeDamage()`, `AttemptDisengage()`, `BattleResult`
- [x] Garrison/Deployed/Reserve modes
      → `UnitMode` enum with supply cost modifiers
- [x] Unit creation and reinforcement
      → `MilitaryState.AddUnit()`, `Reconstitute()`, `MilitaryUnit.Reinforce()`
- [x] HP and damage tracking
      → `currentHP`/`maxHP`, damage penalties to Attack/Defense

### Phase 3: Supply Lines (v0.8.0) - COMPLETE
- [x] Resource hub designation
      → `SupplyNetwork.resourceHubs`, `AddHub()`, `RemoveHub()`
- [x] Supply path calculation
      → `SupplyPath` class, `CalculateSupplyMultiplier()`
- [x] Deep strike cost multipliers
      → Exponential (2^n per jump), capped at 16×
- [x] Interdiction mechanics
      → `InterdictionLevel` enum (Raided/Contested/Cut)
- [x] Supply integration with AI
      → `faction_agent.py` lines 568-582

### Phase 4: Intelligence (v0.8.1) - COMPLETE
- [x] Spy network mechanics
      → `IntelligenceState.cs` - Points, missions, agency bonuses
- [x] Information revelation
      → Scout, Assess, Infiltrate, Intercept mission types
- [x] Counter-intelligence
      → `counterIntelActive`, detection bonuses
- [x] Fog of war implementation
      → `VisibilityLevel`, time-limited intel expiration
- [x] Faction intelligence bonuses
      → ISF, MIIO, ROM, Maskirovka bonuses in `IntelConstants`

### Phase 5: Special Mechanics (v0.9.0) - COMPLETE
- [x] ComStar/HPG system
      → `HPGNetwork.cs`, `ComStarState.cs`
- [x] Clan-specific rules
      → `ClanMechanics.cs` - Trials, Touman, Isorla, Honor
- [x] Mercenary system
      → `MercenarySystem.cs`, `faction_agent.py` merc context
- [x] Faction-specific morale profiles
      → `moraleProfile`: Professional, Fanatical, Resilient, etc.
- [x] Era configurations
      → `EraConfig.cs`, 7 era JSON files

### Phase 6: Integration & Polish (v1.0.0) - COMPLETE
- [x] Full diplomacy-resource integration
- [ ] Player contract/order system
- [ ] Balance testing
- [ ] Performance optimization
- [ ] Documentation

---

## Appendix A: Sarna.net Data Sources

Pages to scrape for faction data:

**Military Forces:**
- https://www.sarna.net/wiki/Armed_Forces_of_the_Federated_Suns
- https://www.sarna.net/wiki/Draconis_Combine_Mustered_Soldiery
- https://www.sarna.net/wiki/Lyran_Commonwealth_Armed_Forces
- (Similar pages for each faction)

**Economic Data:**
- Faction main pages contain economic information
- Industrial world lists
- Population estimates

**Mercenary Units:**
- https://www.sarna.net/wiki/Mercenary_Review_and_Bonding_Commission
- Individual mercenary unit pages

---

## Appendix B: Formula Reference

### Combat
```
Battle Roll = Base Stat + d10 + Supply Modifier + Terrain + Elite Bonus - Outnumber Penalty
Winner = Higher Roll
Damage = 1 HP (2 HP on critical success)
```

### Supply Cost
```
Multiplier = 2^(jumps past friendly space)
Capped at 16× (4 jumps)
Actual Supply = Allocated Supply / Multiplier
```

### Unit Cost
```
New Unit = (Base Cost × Size Modifier × Elite Modifier) Industry + (Same) Credits
Reinforce = 15% of New Unit cost per HP
Reconstitute = 75% of New Unit cost + 2 tick delay
```

### Morale
```
Effective Output = Base Output × Morale Modifier
Morale Modifier:
  >75%: 1.10
  40-75%: 1.00
  20-40%: 0.85
  <20%: 0.70
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2024-12-27 | Claude | Initial draft |
