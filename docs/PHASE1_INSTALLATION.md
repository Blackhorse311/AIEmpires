# Phase 1: WarTechIIC Installation for BattleTech Extended Tactics

**Version:** 1.0
**Date:** 2024-12-29
**Status:** Ready for Testing

---

## Overview

This guide covers installing WarTechIIC alongside BattleTech Extended Tactics (BEX-T) to enable dynamic faction warfare while preserving the lore-accurate timeline events.

## Prerequisites

- BattleTech (HBS) installed
- BattleTech Extended Tactics fully installed and working
- ModTek (should already be installed with BEX-T)

### Your Current BEX-T Installation
```
F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH\Mods\
├── BT_Extended/           (Core mod)
├── BT_Extended_Timeline/  (Lore timeline - planet changes)
├── BT_Extended_CE/        (Combat enhancements)
├── MissionControl/        (Extended lances)
├── Timeline/              (Date system)
├── ModTek/                (Mod loader)
└── [Other BEX mods...]
```

---

## Step 1: Download WarTechIIC

1. Go to: https://github.com/BlueWinds/WarTechIIC/releases
2. Download the latest release: `WarTechIIC.zip` (v1.1.0 or newer)
3. Extract the zip file

## Step 2: Install WarTechIIC

1. Copy the extracted `WarTechIIC` folder to your Mods directory:
   ```
   F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH\Mods\WarTechIIC\
   ```

2. Verify the folder structure looks like:
   ```
   Mods/WarTechIIC/
   ├── mod.json
   ├── settings.json
   ├── WarTechIIC.dll
   └── [other files...]
   ```

## Step 3: Apply BEX-Compatible Configuration

**IMPORTANT:** The default WarTechIIC settings are designed for BTA3062/RogueTech. We need to modify them for BEX-T compatibility.

### Option A: Use AIEmpires Configuration (Recommended)

1. Copy our pre-configured settings:
   ```
   From: I:\AIEmpires-dev\AIEmpires\mods\WarTechIIC_BEX\settings.json
   To:   F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH\Mods\WarTechIIC\settings.json
   ```

2. This configuration:
   - Protects 25 critical timeline systems from WIIC attacks
   - Sets appropriate Clan aggression levels for invasion era
   - Balances Inner Sphere faction behavior
   - Configures player hiring restrictions

### Option B: Manual Configuration

If you prefer to configure manually, edit `WarTechIIC/settings.json` and add:

```json
{
    "cantBeAttacked": [
        "starsystemdef_Luthien",
        "starsystemdef_NewAvalon",
        "starsystemdef_Tharkad",
        "starsystemdef_Sian",
        "starsystemdef_Atreus",
        "starsystemdef_Terra",
        "starsystemdef_Tukayyid"
    ],
    "ignoreFactions": [
        "NoFaction",
        "Locals",
        "AuriganPirates"
    ]
}
```

See `mods/WarTechIIC_BEX/settings.json` for the complete configuration.

---

## Step 4: Verify Installation

1. Launch BattleTech
2. Start a new Career or load an existing save
3. Check for signs that WarTechIIC is active:
   - Pink flashing systems on the starmap = Active flareups
   - "Attack" or "Raid" contracts available at flareup systems
   - News events about faction conflicts

### Expected Behavior

| System Type | What Happens |
|-------------|--------------|
| Protected capitals (Luthien, Tharkad, etc.) | NO flareups - Timeline controls these |
| Border systems | Flareups can occur |
| Clan invasion corridors | After 3049, Clans will attack dynamically |
| Player's location | Higher chance of nearby flareups |

---

## Step 5: Testing Checklist

Before proceeding to Phase 2 (AI Service), verify:

- [ ] Game launches without errors
- [ ] Save games load correctly
- [ ] Timeline events still trigger (check news for lore events)
- [ ] Flareups appear on non-protected systems
- [ ] Player can participate in flareup contracts
- [ ] Protected systems (capitals) do NOT have flareups

### How to Test Timeline + WIIC Coexistence

1. Start a game in 3049 (Clan Invasion start)
2. Advance time to early 3050
3. Verify:
   - Clan systems appear per timeline (scripted)
   - WIIC flareups occur on border worlds (dynamic)
   - Capitals remain unattacked by WIIC

---

## Troubleshooting

### Game Won't Start
- Check ModTek log: `Mods/.modtek/ModTek.log`
- Ensure WarTechIIC.dll is not blocked by Windows
- Right-click DLL → Properties → Unblock

### No Flareups Appearing
- Check `dailyAttackChance` and `dailyRaidChance` in settings.json
- Default is 0 (disabled) - our config sets them to 0.03 and 0.05
- Advance time by a few months to allow flareups to generate

### Timeline Events Not Firing
- This indicates a conflict - check the order of mod loading
- BT_Extended_Timeline should load AFTER WarTechIIC
- Check `Mods/.modtek/ModTek.log` for load order

### Conflict Errors on Startup
- If you see "ConflictsWith: Galaxy at War" errors
- Ensure Galaxy at War is NOT installed (it's incompatible)

---

## Configuration Reference

### Key Settings in settings.json

| Setting | Description | Our Value |
|---------|-------------|-----------|
| `dailyAttackChance` | Chance of new attack per day | 0.03 (3%) |
| `dailyRaidChance` | Chance of new raid per day | 0.05 (5%) |
| `cantBeAttacked` | Systems protected from WIIC | 25 capitals |
| `ignoreFactions` | Factions that don't participate | Locals, Pirates |
| `aggression` | Faction attack likelihood multiplier | Clans high, periphery low |
| `hatred` | Target preference between factions | Liao→Davion high |

### AIEmpires Integration Points

For Phase 2, AIEmpires will control WIIC via these company stats:

```csharp
// Force Davion to attack a specific system
sim.CompanyStats.SetValue("WIIC_Davion_attacks_starsystemdef_Capella", true);

// Boost Kurita's attack strength
sim.CompanyStats.SetValue("WIIC_Kurita_attack_strength", 5);

// Make Liao prioritize Davion as target
sim.CompanyStats.SetValue("WIIC_Liao_hates_Davion", 2.5f);
```

---

## Next Steps

Once Phase 1 testing is complete:

1. **Phase 2:** Set up the Python AI Service
2. **Phase 3:** Create the C# mod for game integration
3. **Phase 4+:** Implement diplomacy, resources, and polish

---

## Files Created

```
I:\AIEmpires-dev\AIEmpires\
├── docs/
│   ├── PHASE1_INSTALLATION.md      (this file)
│   └── BEX_INTEGRATION_PLAN.md     (overall plan)
└── mods/
    └── WarTechIIC_BEX/
        ├── mod.json                 (mod metadata)
        └── settings.json            (BEX-compatible config)
```

---

## References

- [WarTechIIC GitHub](https://github.com/BlueWinds/WarTechIIC)
- [BattleTech Extended Tactics Forum](https://discourse.modsinexile.com/t/battletech-extended-tactics/1859)
- [BTA3062 WarTechIIC Wiki](https://www.bta3062.com/index.php?title=Wartech_IIC)

---

*Phase 1 Complete - Ready for testing before Phase 2*
