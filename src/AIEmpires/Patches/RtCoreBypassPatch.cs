using System;
using System.Reflection;
using Harmony;

namespace AIEmpires.Patches
{
    /// <summary>
    /// Bypasses the RogueTech Core launcher validation check.
    /// This allows the game to run without using the RogueTech Launcher.
    /// </summary>
    public static class RtCoreBypassPatch
    {
        private static bool _applied = false;

        /// <summary>
        /// Manually apply the patch since RTCore might load before our mod
        /// </summary>
        public static void ApplyPatch(HarmonyInstance harmony)
        {
            if (_applied) return;

            try
            {
                // Try to find the RTCore type
                var rtCoreType = FindRtCoreType();
                if (rtCoreType == null)
                {
                    Main.Log("RTCore type not found - launcher bypass not needed");
                    return;
                }

                // Find the Init method
                var initMethod = rtCoreType.GetMethod("Init",
                    BindingFlags.Public | BindingFlags.Static,
                    null,
                    new Type[] { typeof(string), typeof(string) },
                    null);

                if (initMethod == null)
                {
                    Main.LogWarning("RTCore.Init method not found");
                    return;
                }

                // Apply prefix patch
                var prefix = typeof(RtCoreBypassPatch).GetMethod("Init_Prefix",
                    BindingFlags.Public | BindingFlags.Static);

                harmony.Patch(initMethod, new HarmonyMethod(prefix), null);
                Main.Log("RTCore launcher bypass patch applied successfully");
                _applied = true;
            }
            catch (Exception e)
            {
                Main.LogError($"Failed to apply RTCore bypass patch: {e.Message}");
            }
        }

        private static Type FindRtCoreType()
        {
            // Search through all loaded assemblies for RTCore
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    var type = assembly.GetType("RTCore");
                    if (type != null)
                    {
                        Main.Log($"Found RTCore in assembly: {assembly.GetName().Name}");
                        return type;
                    }
                }
                catch
                {
                    // Ignore assemblies that throw on GetType
                }
            }
            return null;
        }

        /// <summary>
        /// Prefix patch that sets corePass to true before Init runs.
        /// This prevents the launcher validation from throwing an exception.
        /// </summary>
        public static void Init_Prefix()
        {
            try
            {
                var rtCoreType = FindRtCoreType();
                if (rtCoreType == null) return;

                // Set corePass = true
                var corePassField = rtCoreType.GetField("corePass",
                    BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic);
                if (corePassField != null)
                {
                    corePassField.SetValue(null, true);
                    Main.Log("Set RTCore.corePass = true");
                }

                // Set coreFailed = false
                var coreFailedField = rtCoreType.GetField("coreFailed",
                    BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic);
                if (coreFailedField != null)
                {
                    coreFailedField.SetValue(null, false);
                    Main.Log("Set RTCore.coreFailed = false");
                }

                // Set tamperCheckDisabled = true to skip tamper checks
                var tamperDisabledField = rtCoreType.GetField("tamperCheckDisabled",
                    BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic);
                if (tamperDisabledField != null)
                {
                    tamperDisabledField.SetValue(null, true);
                    Main.Log("Set RTCore.tamperCheckDisabled = true");
                }
            }
            catch (Exception e)
            {
                Main.LogError($"Error in RTCore bypass prefix: {e.Message}");
            }
        }
    }
}
