# AIEmpires Mod Pack - Final Mod List

**Version:** 1.0
**Date:** 2024-12-30
**Status:** Approved

---

## Overview

This document contains the finalized mod list for the AIEmpires mod pack, organized by tier and function. Conflicts have been resolved and duplicates removed.

---

## Conflict Resolutions

| Conflict | Decision | Removed |
|----------|----------|---------|
| Initiative System | **SkillBasedInit** | ExpandedInitiative |
| Salvage System | **CustomSalvage** | SalvageOperations, AdjustedMechSalvage, AdjustedMechAssemblyCC |
| Shop System | **DynamicShops** | CustomShops |
| AI Behavior | **CleverGirl** | BetterAI |
| Ability System | **Abilifier** | AbilityRealizer (included in Abilifier) |
| Repair Systems | **Both** (ArmorRepair + FieldRepairs) | - |

---

## CORE MODS (Required)

### Tier 1: Framework
| Mod | Purpose | License | URL |
|-----|---------|---------|-----|
| ModTek | Mod loading system | LGPL-2.1 | https://github.com/BattletechModders/ModTek |
| IRBTModUtils | Shared utility classes | MIT | https://github.com/BattletechModders/IRBTModUtils |
| CustomComponents | Custom data for components | LGPL-2.1 | https://github.com/BattletechModders/CustomComponents |
| CustomBundle | CAC + CAE + CU binaries | - | https://github.com/BattletechModders/CustomBundle |

### Tier 2: Core Mechanics
| Mod | Purpose | License | URL |
|-----|---------|---------|-----|
| MechEngineer | CBT mechanics (engines, heat sinks) | - | https://github.com/BattletechModders/MechEngineer |
| CustomAmmoCategories | Custom ammo, weapon modes, jamming | - | https://github.com/BattletechModders/CustomAmmoCategories |
| CBTBehaviorsEnhanced | Classic BattleTech behaviors | - | https://github.com/BattletechModders/CBTBehaviorsEnhanced |
| LowVisibility | Advanced sensors, ECM, stealth | MIT | https://github.com/BattletechModders/LowVisibility |
| SkillBasedInit | Initiative based on pilot skills (30 phases) | MIT | https://github.com/BattletechModders/SkillBasedInit |
| TisButAScratch | Interesting injury system | MIT | https://github.com/BattletechModders/TisButAScratch |
| StrategicOperations | Strategic combat operations | MIT | https://github.com/BattletechModders/StrategicOperations |

### Tier 3: Strategic Layer
| Mod | Purpose | License | URL |
|-----|---------|---------|-----|
| WarTechIIC | Dynamic faction warfare, flareups | GPL-3.0 | https://github.com/BlueWinds/WarTechIIC |
| MissionControl | Runtime contract/encounter modifications | - | https://github.com/CWolfs/MissionControl |
| Timeline | Era/date system for campaigns | Unlicense | https://github.com/BattletechModders/Timeline |

### Tier 4: Content & Units
| Mod | Purpose | URL |
|-----|---------|-----|
| LewdableTanks | Vehicle/tank modifications | https://github.com/BattletechModders/LewdableTanks |
| CustomUnitsSpawn | Fuzzy tags for unit spawns | https://github.com/BattletechModders/CustomUnitsSpawn |
| MonsterMashup | Composite units (boss units, dropships) | https://github.com/BattletechModders/MonsterMashup |
| MechResizer | Visual size customization | https://github.com/BattletechModders/MechResizer |
| Community-Asset-Bundle-Maps | Custom maps | https://github.com/BattletechModders/Community-Asset-Bundle-Maps |
| Community-Asset-Bundle-IS-StarLeague | Star League era assets | BattletechModders |
| Community-Asset-Bundle-IS-ClanInvasion | Clan Invasion era assets | BattletechModders |
| Community-Asset-Bundle-IS-CivilWar | Civil War/Jihad era assets | BattletechModders |
| Community-Asset-Bundle-IS-DarkAge | Dark Age era assets | BattletechModders |
| Community-Asset-Bundle-IS-Customs | Custom IS mechs | BattletechModders |
| Community-Asset-Bundle-Clan-Modern | Modern Clan assets | BattletechModders |
| Community-Asset-Bundle-Clan-GoldenCentury | Golden Century Clan assets | BattletechModders |
| Community-Asset-Bundle-CustomUnits | Assets requiring CustomUnits | BattletechModders |

### Tier 5: Salvage & Economy
| Mod | Purpose | URL |
|-----|---------|-----|
| CustomSalvage | Enhanced salvage system | https://github.com/BattletechModders/CustomSalvage |
| DynamicShops | Dynamic shop population | https://github.com/BattletechModders/DynamicShops |
| StoreTagEnabler | Stores use reputation/time tags | https://github.com/BattletechModders/StoreTagEnabler |
| SellMechParts | Sell mech parts in any shop | https://github.com/BattletechModders/SellMechParts |

### Tier 6: Pilots & Abilities
| Mod | Purpose | URL |
|-----|---------|-----|
| Abilifier | Branching pilot ability choices | https://github.com/BattletechModders/Abilifier |
| Retrainer | Allows pilots to retrain skills | https://github.com/BattletechModders/Retrainer |
| Pilot_Quirks | Pilot quirk system | https://github.com/BattletechModders/Pilot_Quirks |

### Tier 7: AI
| Mod | Purpose | URL |
|-----|---------|-----|
| CleverGirl | Enhanced AI decision-making | https://github.com/BattletechModders/CleverGirl |

### Tier 8: Missions & Contracts
| Mod | Purpose | URL |
|-----|---------|-----|
| ExtendedConversations | More conversation functionality | https://github.com/CWolfs/ExtendedConversations |
| MultiMissions | Each contract = row of missions | https://github.com/BattletechModders/MultiMissions |
| BiggerDrops | Expand drop size (4 to 8+ units) | https://github.com/BattletechModders/BiggerDrops |
| SearchAndRescue | Search and rescue mechanics | https://github.com/BattletechModders/SearchAndRescue |

### Tier 9: QoL & Performance
| Mod | Purpose | URL |
|-----|---------|-----|
| BattletechPerformanceFix | Performance improvements | https://github.com/BattletechModders/BattletechPerformanceFix |
| SpeedMod | Speed improvements | https://github.com/BattletechModders/SpeedMod |
| SkipIntro | Skip intro cutscene | https://github.com/BattletechModders/SkipIntro |
| CommanderPortraitLoader | Custom commander avatars | https://github.com/BattletechModders/CommanderPortraitLoader |
| PilotHealthPopup | Health info after injuries | https://github.com/BattletechModders/PilotHealthPopup |
| LogoReplacement | Replace main screen logo | https://github.com/BattletechModders/LogoReplacement |
| NewSaveFolder | Custom save folder location | https://github.com/BattletechModders/NewSaveFolder |
| CustomFilters | Custom filtering options | https://github.com/BattletechModders/CustomFilters |
| NavigationComputer | Enhanced star map navigation | https://github.com/BattletechModders/NavigationComputer |
| IRTweaks | Various toggleable tweaks | https://github.com/BattletechModders/IRTweaks |
| ConcreteJungle | Urban combat enhancements | https://github.com/BattletechModders/ConcreteJungle |
| LostInSpace | Visual control over star systems | https://github.com/BattletechModders/LostInSpace |
| ContractSort | Sort contracts | https://github.com/BattletechModders/ContractSort |
| BT-SortMechsByTonnage | Sort mechs by tonnage | https://github.com/BattletechModders/BT-SortMechsByTonnage |
| TravelInfoTooltips | Travel info tooltips | https://github.com/BattletechModders/TravelInfoTooltips |

### Tier 10: Repair Systems
| Mod | Purpose | URL |
|-----|---------|-----|
| ArmorRepair | Automatic armor repair orders | https://github.com/BattletechModders/ArmorRepair |
| FieldRepairs | Lore-accurate damage effects | https://github.com/BattletechModders/FieldRepairs |

### Tier 11: Additional Core
| Mod | Purpose | URL |
|-----|---------|-----|
| SizeMatters | Size-based mechanics | https://github.com/BattletechModders/SizeMatters |
| CustomUnitsDecorator | Unit decoration | https://github.com/BattletechModders/CustomUnitsDecorator |
| SoldiersPiratesAssassinsMercs | SPAM system | https://github.com/BattletechModders/SoldiersPiratesAssassinsMercs |
| CodeWords | Code word system | https://github.com/BattletechModders/CodeWords |
| CustomStatisticEffects | Enhanced stat effects | https://github.com/BattletechModders/CustomStatisticEffects |
| PanicSystem | Pilot panic and ejection | https://github.com/BattletechModders/PanicSystem |
| DisorderlyWithdrawal | Withdrawal mechanics | https://github.com/BattletechModders/DisorderlyWithdrawal |
| StatisticEffectDataInjector | Stat effect injection | https://github.com/BattletechModders/StatisticEffectDataInjector |
| Flashpoint-Spawn-Adjustments | Flashpoint spawn tweaks | https://github.com/BattletechModders/Flashpoint-Spawn-Adjustments |
| JK_Rarity | Rarity system | https://github.com/BattletechModders/JK_Rarity |
| JK_Variants | Variant system | https://github.com/BattletechModders/JK_Variants |
| Flashpoint-Stock-Photos | Flashpoint photos | https://github.com/BattletechModders/Flashpoint-Stock-Photos |

### Tier 12: Development Tools
| Mod | Purpose | URL |
|-----|---------|-----|
| BTDebug | Debug mod for development | https://github.com/CWolfs/BTDebug |
| ConverseTek | Conversation editor tool | https://github.com/CWolfs/ConverseTek |

---

## OPTIONAL MODS (Player Choice)

These mods can be toggled on/off by the player:

| Mod | Purpose | URL |
|-----|---------|-----|
| FlashpointEnabler | Enable flashpoints | https://github.com/BattletechModders/FlashpointEnabler |
| IttyBittyLivingSpace | Living space mechanics | https://github.com/BattletechModders/IttyBittyLivingSpace |
| CustomPilotDecorator | Pilot decoration | https://github.com/BattletechModders/CustomPilotDecorator |
| SelectPilots | Pilot selection | https://github.com/BattletechModders/SelectPilots |
| MechMaintenanceByCost | Maintenance by cost | https://github.com/BattletechModders/MechMaintenanceByCost |
| CustomSlots | Custom equipment slots | https://github.com/BattletechModders/CustomSlots |
| ColorfulCombatants | Colored units | https://github.com/BattletechModders/ColorfulCombatants |
| QuickCam | Quick camera controls | https://github.com/BattletechModders/QuickCam |
| SalvageOperations | Alternative salvage (conflicts with CustomSalvage) | https://github.com/BattletechModders/SalvageOperations |
| SkipTravelCutscenes | Skip travel cutscenes | https://github.com/BattletechModders/SkipTravelCutscenes |
| HideCareerModeDays | Hide career mode days | https://github.com/BattletechModders/HideCareerModeDays |
| Attack-Improvement-Mod | Combat UI improvements | https://github.com/BattletechModders/Attack-Improvement-Mod |
| RandomCampaignStart | Random campaign start | https://github.com/BattletechModders/RandomCampaignStart |

---

## SUPPORTING MODS (Dependencies)

These may be needed to make other mods work:

| Mod | Purpose | Needed By | URL |
|-----|---------|-----------|-----|
| cFixes | Community bug fixes | General stability | https://github.com/BattletechModders/cFixes |
| ShotCountEnabler | Multi-shot ballistic weapons | CustomAmmoCategories | https://github.com/BattletechModders/ShotCountEnabler |
| MercDeployments | Mercenary deployment mechanics | WarTechIIC integration | https://github.com/BattletechModders/MercDeployments |

### Not Needed
| Mod | Reason |
|-----|--------|
| AbilityRealizer | Included in Abilifier |
| BetterAI | Replaced by CleverGirl |
| ExpandedInitiative | Replaced by SkillBasedInit |
| CustomShops | Replaced by DynamicShops |
| AdjustedMechSalvage | Conflicts with CustomSalvage |
| UnityDoorstop | Bundled with ModTek |
| BattleTechModLoader | Obsolete, use ModTek |

---

## Dependency Chain

```
ModTek (base)
├── IRBTModUtils
│   ├── CleverGirl
│   ├── TisButAScratch
│   ├── SkillBasedInit
│   ├── IRTweaks
│   ├── Abilifier
│   └── FieldRepairs
├── CustomComponents
│   ├── MechEngineer
│   │   └── FieldRepairs
│   ├── CustomAmmoCategories
│   │   ├── LowVisibility
│   │   └── IRTweaks
│   ├── SkillBasedInit
│   └── ArmorRepair
├── CustomBundle (CAC + CAE + CU)
│   ├── SkillBasedInit
│   ├── MonsterMashup
│   └── BiggerDrops (optional)
├── MissionControl
│   └── BiggerDrops
└── Timeline
    └── [Era System]
```

---

## Era Support

| Era | Years | Key Content |
|-----|-------|-------------|
| Late Succession War - Renaissance | 3025-3047 | LosTech discovery, Helm Memory Core |
| Clan Invasion | 3049-3061 | Clan arrival, Tukayyid |
| Civil War | 3062-3067 | FedCom Civil War |
| Word of Blake Jihad | 3068-3080 | Jihad, HPG destruction |
| Early Republic | 3081-3100 | Republic of the Sphere |
| Late Republic | 3101-3130 | Republic decline |
| Dark Age | 3131-3150 | Fortress Republic, Clan resurgence |
| ilClan | 3151+ | Wolf ilClan, new order |

---

## Total Mod Count

- **Core Mods:** 65+
- **Optional Mods:** 14
- **Supporting Mods:** 3

---

*Document Status: Approved - Ready for implementation*
