using System;
using HarmonyLib;
using Newtonsoft.Json;
using AIEmpires.Utils;

namespace AIEmpires
{
    /// <summary>
    /// AIEmpires mod entry point.
    /// Provides LLM-powered faction AI for BattleTech.
    ///
    /// <para>Author: AIEmpires Team</para>
    /// <para>Version: 1.0.0</para>
    /// <para>License: MIT</para>
    ///
    /// <para>This mod integrates with the AIEmpires AI service to provide:</para>
    /// <list type="bullet">
    ///   <item>LLM-powered faction decision making</item>
    ///   <item>Dynamic contract generation</item>
    ///   <item>Persistent faction relationships</item>
    ///   <item>Era-appropriate faction behaviors</item>
    /// </list>
    /// </summary>
    public class Main
    {
        /// <summary>Current mod settings loaded from mod.json</summary>
        public static Settings Settings { get; private set; }

        /// <summary>Harmony instance for patching game methods</summary>
        public static Harmony Harmony { get; private set; }

        /// <summary>Path to the mod's installation directory</summary>
        internal static string ModDirectory;

        /// <summary>
        /// ModTek entry point.
        /// Called by ModTek when the mod is loaded.
        /// </summary>
        /// <param name="directory">Path to the mod's directory</param>
        /// <param name="settingsJSON">JSON string of mod settings from mod.json</param>
        public static void Init(string directory, string settingsJSON)
        {
            ModDirectory = directory;

            try
            {
                // Initialize the logger first
                Logger.Initialize(directory);

                // Load settings
                Settings = JsonConvert.DeserializeObject<Settings>(settingsJSON);

                // Configure logging based on settings
                if (Settings.EnableDebugLogging)
                {
                    Logger.Instance.SetLevel(LogLevel.Debug);
                }

                Logger.Instance.Info("Main", "AIEmpires mod loading", new
                {
                    version = "1.0.0",
                    directory = directory,
                    debugLogging = Settings.EnableDebugLogging
                });

                // Initialize Harmony patches
                Harmony = new Harmony("com.aiempires.mod");
                Harmony.PatchAll(typeof(Main).Assembly);

                Logger.Instance.Info("Main", "AIEmpires v1.0.0 initialized successfully", new
                {
                    serviceUrl = Settings.AIServiceUrl
                });
            }
            catch (Exception e)
            {
                Logger.Instance.Fatal("Main", "Failed to initialize AIEmpires", null, e);
            }
        }

        /// <summary>
        /// Legacy log method for backwards compatibility.
        /// Prefer using Logger.Instance.Info() directly.
        /// </summary>
        /// <param name="message">Message to log</param>
        public static void Log(string message)
        {
            Logger.Instance.Info("Legacy", message);
        }

        /// <summary>
        /// Legacy error log method for backwards compatibility.
        /// Prefer using Logger.Instance.Error() directly.
        /// </summary>
        /// <param name="message">Error message</param>
        /// <param name="e">Optional exception</param>
        public static void LogError(string message, Exception e = null)
        {
            Logger.Instance.Error("Legacy", message, null, e);
        }
    }

    /// <summary>
    /// Mod settings loaded from mod.json.
    /// Configure these in the mod.json file's Settings section.
    /// </summary>
    public class Settings
    {
        /// <summary>
        /// URL of the AIEmpires AI service.
        /// Default: http://127.0.0.1:5000
        /// </summary>
        public string AIServiceUrl { get; set; } = "http://127.0.0.1:5000";

        /// <summary>
        /// Enable verbose debug logging.
        /// Warning: This can generate large log files.
        /// </summary>
        public bool EnableDebugLogging { get; set; } = false;

        /// <summary>
        /// Enable logging to file (in addition to console).
        /// Log files are stored in the mod's logs/ directory.
        /// </summary>
        public bool EnableFileLogging { get; set; } = true;
    }
}
