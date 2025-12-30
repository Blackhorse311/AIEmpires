using System;
using HarmonyLib;
using Newtonsoft.Json;

namespace AIEmpires
{
    /// <summary>
    /// AIEmpires mod entry point.
    /// Provides LLM-powered faction AI for BattleTech.
    /// </summary>
    public class Main
    {
        public static Settings Settings { get; private set; }
        public static Harmony Harmony { get; private set; }

        internal static string ModDirectory;

        /// <summary>
        /// ModTek entry point.
        /// </summary>
        public static void Init(string directory, string settingsJSON)
        {
            ModDirectory = directory;

            try
            {
                // Load settings
                Settings = JsonConvert.DeserializeObject<Settings>(settingsJSON);

                // Initialize Harmony patches
                Harmony = new Harmony("com.aiempires.mod");
                Harmony.PatchAll(typeof(Main).Assembly);

                Log("AIEmpires v0.1.0 initialized successfully");
            }
            catch (Exception e)
            {
                LogError("Failed to initialize AIEmpires", e);
            }
        }

        public static void Log(string message)
        {
            // TODO: Implement proper logging
            Console.WriteLine($"[AIEmpires] {message}");
        }

        public static void LogError(string message, Exception e = null)
        {
            Console.WriteLine($"[AIEmpires ERROR] {message}");
            if (e != null)
            {
                Console.WriteLine($"[AIEmpires ERROR] {e}");
            }
        }
    }

    /// <summary>
    /// Mod settings loaded from mod.json.
    /// </summary>
    public class Settings
    {
        public string AIServiceUrl { get; set; } = "http://127.0.0.1:5000";
        public bool EnableDebugLogging { get; set; } = false;
    }
}
