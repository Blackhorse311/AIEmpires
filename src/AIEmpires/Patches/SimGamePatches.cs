using System;
using Harmony;
using BattleTech;
using AIEmpires.Services;

namespace AIEmpires.Patches
{
    /// <summary>
    /// Patches for SimGameState to hook into game events
    /// </summary>
    [HarmonyPatch(typeof(SimGameState))]
    public static class SimGamePatches
    {
        private static GalaxySimulator _simulator;
        private static int _lastProcessedDay = -1;

        private static GalaxySimulator GetSimulator()
        {
            if (_simulator == null)
            {
                _simulator = new GalaxySimulator(
                    Main.GalaxyState,
                    Main.Factions,
                    Main.Settings,
                    Main.AIService
                );
            }
            return _simulator;
        }

        /// <summary>
        /// Hook into day advancement
        /// </summary>
        [HarmonyPatch("OnDayPassed")]
        [HarmonyPostfix]
        public static void OnDayPassed_Postfix(SimGameState __instance, int timeLapse)
        {
            try
            {
                if (Main.Settings == null)
                {
                    Main.LogWarning("OnDayPassed called but Settings is null - mod may not be fully initialized");
                    return;
                }

                if (!Main.Settings.enabled) return;

                var currentDay = __instance.DaysPassed;
                Main.LogDebug($"Day passed: {currentDay} (timeLapse: {timeLapse})");
                Main.GalaxyState.UpdateDay(currentDay);

                var daysSinceLastTick = currentDay - Main.GalaxyState.lastProcessedDay;
                Main.LogDebug($"Days since last tick: {daysSinceLastTick}, threshold: {Main.Settings.simulation.daysPerTick}");

                // Check if we should process a tick
                if (Main.GalaxyState.ShouldProcessTick(currentDay, Main.Settings.simulation.daysPerTick))
                {
                    Main.Log($"=== MONTHLY TICK TRIGGERED on day {currentDay} ===");
                    Main.Log($"Processing AI decisions for {Main.Factions.majorFactions.Count} factions...");

                    // We can't easily await in a patch, so we'll use a coroutine approach
                    // For now, log that we would process
                    GetSimulator().ProcessTick();
                }
            }
            catch (Exception e)
            {
                Main.LogError($"Error in OnDayPassed patch: {e}");
            }
        }

        /// <summary>
        /// Hook into game load to initialize state
        /// </summary>
        [HarmonyPatch("Rehydrate")]
        [HarmonyPostfix]
        public static void Rehydrate_Postfix(SimGameState __instance)
        {
            try
            {
                Main.Log("=== GAME SAVE LOADED (Rehydrate) ===");

                if (Main.Settings == null)
                {
                    Main.LogError("Rehydrate called but Settings is null - mod failed to initialize!");
                    return;
                }

                if (!Main.Settings.enabled)
                {
                    Main.Log("AIEmpires is disabled in settings, skipping initialization");
                    return;
                }

                Main.Log($"Current game day: {__instance.DaysPassed}");
                Main.Log($"Star systems in game: {__instance.StarSystems?.Count ?? 0}");
                Main.Log("Initializing galaxy state from star systems...");
                InitializeGalaxyFromGame(__instance);
            }
            catch (Exception e)
            {
                Main.LogError($"Error in Rehydrate patch: {e}");
            }
        }

        /// <summary>
        /// Initialize galaxy state from current game state
        /// </summary>
        private static void InitializeGalaxyFromGame(SimGameState sim)
        {
            // Only initialize if state is empty
            if (Main.GalaxyState.systems.Count > 0)
            {
                Main.Log("Galaxy state already initialized");
                return;
            }

            Main.Log("Building initial galaxy state from game data...");

            var starSystems = sim.StarSystems;
            foreach (var system in starSystems)
            {
                var systemState = new State.SystemState
                {
                    systemId = system.ID,
                    owner = system.OwnerValue.Name,
                    isCapital = IsCapital(system.ID),
                    industrialValue = CalculateIndustrialValue(system)
                };

                // Build adjacency list
                foreach (var neighbor in sim.Starmap.GetAvailableNeighborSystem(system))
                {
                    systemState.adjacentSystems.Add(neighbor.ID);
                }

                Main.GalaxyState.systems[system.ID] = systemState;

                // Track faction ownership
                var factionState = Main.GalaxyState.GetOrCreateFaction(system.OwnerValue.Name);
                if (!factionState.controlledSystems.Contains(system.ID))
                {
                    factionState.controlledSystems.Add(system.ID);
                }
            }

            Main.GalaxyState.currentDay = sim.DaysPassed;
            Main.GalaxyState.lastProcessedDay = sim.DaysPassed;

            Main.Log($"Initialized {Main.GalaxyState.systems.Count} systems and {Main.GalaxyState.factions.Count} factions");
            Main.SaveGalaxyState();
        }

        private static bool IsCapital(string systemId)
        {
            foreach (var faction in Main.Factions.majorFactions)
            {
                if (faction.capital == systemId)
                    return true;
            }
            return false;
        }

        private static float CalculateIndustrialValue(StarSystem system)
        {
            float value = 1.0f;

            // Check system tags for industrial indicators
            if (system.Tags.Contains("planet_industry_rich"))
                value += 0.5f;
            if (system.Tags.Contains("planet_industry_manufacturing"))
                value += 0.3f;
            if (system.Tags.Contains("planet_pop_large"))
                value += 0.2f;

            return value;
        }
    }

    /// <summary>
    /// Patches for contract completion
    /// </summary>
    [HarmonyPatch(typeof(Contract))]
    public static class ContractPatches
    {
        [HarmonyPatch("CompleteContract")]
        [HarmonyPostfix]
        public static void CompleteContract_Postfix(Contract __instance, MissionResult result)
        {
            try
            {
                if (!Main.Settings.enabled) return;

                var employer = __instance.Override.employerTeam.FactionValue.Name;
                var target = __instance.Override.targetTeam.FactionValue.Name;
                var success = result == MissionResult.Victory;

                Main.Log($"Contract completed: {employer} vs {target}, Success: {success}");

                // Notify simulator
                var simulator = new GalaxySimulator(
                    Main.GalaxyState,
                    Main.Factions,
                    Main.Settings,
                    Main.AIService
                );
                simulator.ProcessPlayerAction("contract_complete", employer, target, success);

                // Update player reputation tracking
                if (success)
                {
                    if (Main.GalaxyState.playerState.factionReputation.ContainsKey(employer))
                    {
                        Main.GalaxyState.playerState.factionReputation[employer]++;
                    }
                    else
                    {
                        Main.GalaxyState.playerState.factionReputation[employer] = 1;
                    }
                }
            }
            catch (Exception e)
            {
                Main.LogError($"Error in CompleteContract patch: {e}");
            }
        }
    }

    /// <summary>
    /// Patches for star map display (to show conflicts)
    /// </summary>
    [HarmonyPatch(typeof(StarmapRenderer))]
    public static class StarmapPatches
    {
        [HarmonyPatch("RefreshSystems")]
        [HarmonyPostfix]
        public static void RefreshSystems_Postfix(StarmapRenderer __instance)
        {
            try
            {
                if (!Main.Settings.enabled) return;
                if (!Main.Settings.display.showConflictMarkers) return;

                // Would add visual indicators for active conflicts here
                // This requires Unity UI work which is more complex
            }
            catch (Exception e)
            {
                Main.LogError($"Error in RefreshSystems patch: {e}");
            }
        }
    }
}
