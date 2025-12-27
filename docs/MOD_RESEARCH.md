# SoloTech - Mod Research & Licensing

## Project Overview
SoloTech is an AI-powered single-player BattleTech mod that enables LLM-controlled faction warfare.

## Core Mods (Required)

### 1. ModTek - Mod Loader
- **Source:** https://github.com/BattletechModders/ModTek
- **License:** LGPL-2.1 ✅
- **Purpose:** Mod loading framework, dependency resolution
- **Status:** Required foundation

### 2. WarTechIIC - Persistent Faction Warfare
- **Source:** https://github.com/BlueWinds/WarTechIIC
- **License:** GPL-3.0 ✅
- **Purpose:** Dynamic faction warfare, flareups, extended contracts
- **Key Features:**
  - Faction-controlled attacks and raids
  - Multi-day scripted contracts
  - Campaign system
  - Statistics tracking
- **Status:** Core for our AI faction warfare

### 3. MechEngineer - Mech Customization
- **Source:** https://github.com/BattletechModders/MechEngineer
- **License:** LGPL-2.1 ✅
- **Purpose:** CBT-accurate mech building (engines, heat sinks, etc.)
- **Dependencies:** ModTek, CustomComponents
- **Status:** Required for full mech customization

### 4. CustomComponents - Component System
- **Source:** https://github.com/BattletechModders/CustomComponents
- **License:** LGPL-2.1 ✅
- **Purpose:** Attach custom data to components via JSON
- **Status:** Required by MechEngineer

### 5. Mission Control - Enhanced Missions
- **Source:** https://github.com/CWolfs/MissionControl
- **License:** GPL-3.0 ✅
- **Purpose:** Runtime contract/encounter modifications
- **Key Features:**
  - Custom contract types
  - Dynamic spawns
  - Flashpoint integration
- **Status:** Required for mission variety

### 6. IRBTModUtils - Utility Library
- **Source:** https://github.com/BattletechModders/IRBTModUtils
- **License:** MIT ✅
- **Purpose:** Shared utilities (movement modifiers, AI factors, logging)
- **Status:** Required by many mods

## Combat Enhancement Mods

### 7. CustomAmmoCategories (CAC)
- **Source:** https://github.com/BattletechModders/CustomAmmoCategories
- **License:** Needs verification (likely open source)
- **Purpose:** Advanced weapon systems
- **Key Features:**
  - Custom ammo types
  - Weapon firing modes
  - Jamming mechanics
  - Hit generation systems (Cluster, Streak)
- **Status:** Highly recommended

### 8. LowVisibility - Sensor Warfare
- **Source:** https://github.com/BattletechModders/LowVisibility
- **License:** MIT ✅
- **Purpose:** Advanced detection/ECM systems
- **Key Features:**
  - Visibility states (Visible/Detected/Unknown)
  - ECM, Stealth, Active Probes
  - Environmental visibility effects
- **Dependencies:** IRBTModUtils, CustomActivatableEquipment, CAC
- **Status:** Recommended for tactical depth

### 9. CleverGirl - AI Enhancement
- **Source:** https://github.com/BattletechModders/CleverGirl
- **License:** MIT ✅
- **Purpose:** Improved AI decision-making
- **Key Features:**
  - Better weapon selection
  - Overheat management
  - Performance optimization
- **Dependencies:** IRBTModUtils
- **Status:** Recommended (better enemy AI)

## Additional Mods to Research

### From RogueTech's Dependencies:
- [ ] BiggerDrops - More mechs per mission
- [ ] CustomSalvage - Enhanced salvage system
- [ ] CustomUnits - Vehicles, VTOLs, custom unit types
- [ ] CustomActivatableEquipment - Toggleable equipment
- [ ] PanicSystem - Pilot morale/ejection
- [ ] SkillBasedInit - Initiative based on skills
- [ ] DynamicShops - Better store systems
- [ ] LootMagnet - Enhanced salvage
- [ ] TisButAScratch - Injury system

### Potential New Mods:
- [ ] BetterAI - AI behavior improvements
- [ ] Abilifier - Pilot abilities
- [ ] MechAffinity - Pilot-mech bonding
- [ ] Solaris7 - Arena combat

## Community Asset Bundle (CAB)
- **Source:** Multiple repos under BattletechModders
- **Purpose:** Mech models, textures, assets
- **Note:** Large download, essential for content
- **Status:** Required for full mech variety

## License Summary

| Mod | License | Compatible |
|-----|---------|------------|
| ModTek | LGPL-2.1 | ✅ |
| WarTechIIC | GPL-3.0 | ✅ |
| MechEngineer | LGPL-2.1 | ✅ |
| CustomComponents | LGPL-2.1 | ✅ |
| Mission Control | GPL-3.0 | ✅ |
| IRBTModUtils | MIT | ✅ |
| LowVisibility | MIT | ✅ |
| CleverGirl | MIT | ✅ |
| CustomAmmoCategories | TBD | TBD |

## GPL-3.0 Implications
Since WarTechIIC and Mission Control use GPL-3.0, our combined work that incorporates them must also be GPL-3.0 compatible. This is fine for open-source distribution.

## Next Steps
1. Clone all source repositories
2. Verify remaining licenses
3. Document dependencies between mods
4. Create integration plan
