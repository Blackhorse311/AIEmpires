# BEX-T Extension Mod Planning

**Status:** Planning Phase
**Goal:** Create a custom extension mod pack for BattleTech Extended Tactics

---

## Overview

This document tracks the planning and research for creating a custom "extension mod" that sits on top of BattleTech Extended Tactics (BEX-T). The goal is to enhance the baseline BEX-T experience with carefully selected additional mods.

## Current BEX-T Installation

**Base Mods (Working):**
- BT_Extended (core)
- BT_Extended_Timeline
- BT_Extended_CE (Combat Enhancements)
- BT_Extended_3050
- BT_Extended_Clans
- Community Asset Bundle (CAB)
- MissionControl
- Timeline
- BetterAI
- Various quality-of-life mods

**Added for AIEmpires:**
- WarTechIIC (dynamic faction warfare)

**Optional/Broken (BTX_ExpansionPack):**
- Requires CustomUnits, Custom Ammo Categories, etc.
- Currently disabled due to dependency conflicts

---

## Mod Categories to Research

### 1. Quality of Life
Mods that improve the player experience without changing core gameplay:
- [ ] UI improvements
- [ ] Better information display
- [ ] Save game management
- [ ] Performance optimizations

### 2. Combat Enhancements
Mods that add depth to tactical combat:
- [ ] Additional weapon systems
- [ ] New combat mechanics
- [ ] Improved AI behavior
- [ ] Visual effects

### 3. Strategic Layer
Mods that enhance the campaign/career experience:
- [ ] Better contract generation
- [ ] Improved faction interactions
- [ ] Economic enhancements
- [ ] Pilot management

### 4. Content Additions
Mods that add new mechs, equipment, or missions:
- [ ] Additional mech variants
- [ ] New weapon types
- [ ] Custom flashpoints/campaigns
- [ ] Map expansions

### 5. Immersion
Mods that enhance the BattleTech atmosphere:
- [ ] Lore-accurate details
- [ ] Better storytelling
- [ ] Audio/visual improvements
- [ ] Roleplay elements

---

## Research Sources

### Mod Repositories
- [Nexus Mods - BattleTech](https://www.nexusmods.com/battletech)
- [GitHub - BattletechModders](https://github.com/BattletechModders)
- [Mods in Exile Forum](https://discourse.modsinexile.com/)

### Mod Packs for Reference
- **BTA3062** - Large overhaul, uses CustomUnits/CAC
- **RogueTech** - Massive overhaul, very different from vanilla
- **BEX-T** - Our base, balanced overhaul

### Compatibility Considerations
- Must work with BEX-T baseline
- Must work with WarTechIIC
- Should not require CustomUnits/CAC (complex dependencies)
- Should be stable with Timeline mod

---

## Mod Candidates (To Research)

| Mod Name | Category | Status | Notes |
|----------|----------|--------|-------|
| *TBD* | *TBD* | Not researched | *TBD* |

---

## Installation Plan

Once mods are selected:

1. **Test individually** - Each mod tested alone with BEX-T
2. **Test combinations** - Gradual addition to check conflicts
3. **Document load order** - Record correct mod loading sequence
4. **Create installer** - Bundle as easy-to-install package
5. **Version control** - Track mod versions for updates

---

## Integration with AIEmpires

The extension mod should complement the AIEmpires project:
- Mods that add faction depth help AI personalities
- Economic mods feed into resource system
- Contract mods provide more AI-driven opportunities
- Avoid mods that would conflict with WIIC control

---

## Notes

*This document will be updated as mod research progresses.*

---

## Session Log

### 2024-12-30
- Document created
- Identified need for extension mod research
- Phase 1 of AIEmpires (WarTechIIC integration) completed
