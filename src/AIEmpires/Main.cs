using System;
using System.IO;
using System.Reflection;
using Harmony;
using Newtonsoft.Json;
using UnityEngine;
using AIEmpires.State;
using AIEmpires.Services;

namespace AIEmpires
{
    public static class Main
    {
        public static ModSettings Settings { get; private set; }
        public static FactionConfig Factions { get; private set; }
        public static GalaxyState GalaxyState { get; private set; }
        public static AIServiceClient AIService { get; private set; }

        internal static string ModDirectory;
        internal static HarmonyInstance Harmony;
        internal static string LogFilePath;

        public static void Init(string modDirectory, string settingsJson)
        {
            ModDirectory = modDirectory;
            LogFilePath = Path.Combine(modDirectory, "aiempires.log");

            try
            {
                // Clear old log file
                if (File.Exists(LogFilePath))
                {
                    File.Delete(LogFilePath);
                }

                Log("===========================================");
                Log("   AI EMPIRES MOD INITIALIZING");
                Log($"   Version: 0.1.0");
                Log($"   Time: {DateTime.Now}");
                Log("===========================================");
                Log($"Mod directory: {modDirectory}");
                Log($"Settings JSON received: {settingsJson?.Length ?? 0} chars");

                // Load settings from mod.json Settings block
                var modSettings = JsonConvert.DeserializeObject<ModJsonSettings>(settingsJson);

                // Load main settings
                var settingsPath = Path.Combine(modDirectory, modSettings.configPath);
                var settingsContent = File.ReadAllText(settingsPath);
                Settings = JsonConvert.DeserializeObject<ModSettings>(settingsContent);
                Log($"Settings loaded from {settingsPath}");

                // Load faction configurations
                var factionsPath = Path.Combine(modDirectory, modSettings.factionsPath);
                var factionsContent = File.ReadAllText(factionsPath);
                Factions = JsonConvert.DeserializeObject<FactionConfig>(factionsContent);
                Log($"Loaded {Factions.majorFactions.Count} major factions");

                // Load or create galaxy state
                var statePath = Path.Combine(modDirectory, modSettings.statePath);
                if (File.Exists(statePath))
                {
                    var stateContent = File.ReadAllText(statePath);
                    GalaxyState = JsonConvert.DeserializeObject<GalaxyState>(stateContent);
                    Log($"Galaxy state loaded from {statePath}");
                }
                else
                {
                    GalaxyState = new GalaxyState();
                    Log("Created new galaxy state");
                }

                // Initialize AI service client
                AIService = new AIServiceClient(Settings.aiService.endpoint, Settings.aiService.timeout);
                Log($"AI Service client initialized for {Settings.aiService.endpoint}");

                // Apply Harmony patches
                Harmony = HarmonyInstance.Create("com.roguetech.aiempires");
                Harmony.PatchAll(Assembly.GetExecutingAssembly());
                Log("Harmony patches applied");

                Log("AIEmpires initialization complete!");
            }
            catch (Exception e)
            {
                LogError($"Failed to initialize AIEmpires: {e}");
            }
        }

        public static void SaveGalaxyState()
        {
            try
            {
                var statePath = Path.Combine(ModDirectory, "data", "galaxy_state.json");
                var stateJson = JsonConvert.SerializeObject(GalaxyState, Formatting.Indented);
                File.WriteAllText(statePath, stateJson);
                Log("Galaxy state saved");
            }
            catch (Exception e)
            {
                LogError($"Failed to save galaxy state: {e}");
            }
        }

        public static void Log(string message)
        {
            var logMessage = $"[AIEmpires] {message}";
            Debug.Log(logMessage);
            WriteToLogFile("INFO", message);
        }

        public static void LogError(string message)
        {
            var logMessage = $"[AIEmpires] ERROR: {message}";
            Debug.LogError(logMessage);
            WriteToLogFile("ERROR", message);
        }

        public static void LogWarning(string message)
        {
            var logMessage = $"[AIEmpires] WARNING: {message}";
            Debug.LogWarning(logMessage);
            WriteToLogFile("WARN", message);
        }

        public static void LogDebug(string message)
        {
            if (Settings?.debug == true)
            {
                var logMessage = $"[AIEmpires] DEBUG: {message}";
                Debug.Log(logMessage);
                WriteToLogFile("DEBUG", message);
            }
        }

        private static void WriteToLogFile(string level, string message)
        {
            try
            {
                if (!string.IsNullOrEmpty(LogFilePath))
                {
                    var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
                    var logLine = $"{timestamp} [{level}] {message}{Environment.NewLine}";
                    File.AppendAllText(LogFilePath, logLine);
                }
            }
            catch
            {
                // Silently fail if we can't write to log
            }
        }
    }

    // Settings classes
    public class ModJsonSettings
    {
        public string configPath { get; set; }
        public string factionsPath { get; set; }
        public string statePath { get; set; }
    }

    public class ModSettings
    {
        public string schemaVersion { get; set; }
        public bool enabled { get; set; }
        public bool debug { get; set; }
        public AIServiceSettings aiService { get; set; }
        public ClaudeSettings claude { get; set; }
        public SimulationSettings simulation { get; set; }
        public CombatSettings combat { get; set; }
        public EconomySettings economy { get; set; }
        public PlayerSettings player { get; set; }
        public DisplaySettings display { get; set; }
        public PersistenceSettings persistence { get; set; }
    }

    public class AIServiceSettings
    {
        public string endpoint { get; set; }
        public int timeout { get; set; }
        public int retryAttempts { get; set; }
        public int retryDelay { get; set; }
    }

    public class ClaudeSettings
    {
        public string model { get; set; }
        public int maxTokens { get; set; }
        public float temperature { get; set; }
    }

    public class SimulationSettings
    {
        public int daysPerTick { get; set; }
        public bool tickOnPlayerAction { get; set; }
        public string[] significantActionTypes { get; set; }
        public int maxActionsPerTick { get; set; }
        public int actionExecutionDays { get; set; }
    }

    public class CombatSettings
    {
        public float baseAttackStrength { get; set; }
        public float defenderBonus { get; set; }
        public float capitalDefenseBonus { get; set; }
        public bool adjacencyRequirement { get; set; }
        public int maxSystemsPerAttack { get; set; }
    }

    public class EconomySettings
    {
        public float systemIncomeBase { get; set; }
        public float industrialWorldBonus { get; set; }
        public float capitalBonus { get; set; }
        public float warDrain { get; set; }
        public float recoveryRate { get; set; }
    }

    public class PlayerSettings
    {
        public int influencePerContract { get; set; }
        public int influencePerSystemCaptured { get; set; }
        public int maxInfluencePoints { get; set; }
        public int suggestionCost { get; set; }
        public FactionBonuses factionBonuses { get; set; }
    }

    public class FactionBonuses
    {
        public BonusTier member { get; set; }
        public BonusTier trusted { get; set; }
    }

    public class BonusTier
    {
        public float contractPayBonus { get; set; }
        public float salvageBonus { get; set; }
        public bool specialContracts { get; set; }
    }

    public class DisplaySettings
    {
        public bool showConflictMarkers { get; set; }
        public bool showAIPredictions { get; set; }
        public int eventLogMaxEntries { get; set; }
        public bool notifyOnMajorEvents { get; set; }
    }

    public class PersistenceSettings
    {
        public string stateFile { get; set; }
        public int autoSaveInterval { get; set; }
        public int backupCount { get; set; }
    }
}
