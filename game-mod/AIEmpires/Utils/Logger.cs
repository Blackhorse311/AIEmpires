using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Newtonsoft.Json;

namespace AIEmpires.Utils
{
    /// <summary>
    /// AIEmpires Game Mod - Logging System
    ///
    /// Provides a robust, configurable logging system for the AIEmpires BattleTech mod.
    /// Logs can be enabled/disabled, filtered by level, and exported for bug reports.
    ///
    /// <para>Author: AIEmpires Team</para>
    /// <para>Version: 1.0.0</para>
    /// <para>License: MIT</para>
    ///
    /// <para>Features:</para>
    /// <list type="bullet">
    ///   <item>Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)</item>
    ///   <item>File and console output</item>
    ///   <item>Log rotation (keeps last 5 log files)</item>
    ///   <item>Structured JSON logs for parsing</item>
    ///   <item>Easy export for bug reports</item>
    ///   <item>Performance timestamps</item>
    ///   <item>Context tagging (module/function names)</item>
    /// </list>
    ///
    /// <para>Usage:</para>
    /// <code>
    /// using AIEmpires.Utils;
    ///
    /// // Configure logging
    /// Logger.Instance.SetLevel(LogLevel.Debug);
    /// Logger.Instance.Enable();
    ///
    /// // Log messages
    /// Logger.Instance.Info("AIBrain", "Processing faction turn", new { faction = "Davion" });
    /// Logger.Instance.Error("HttpClient", "Connection failed", new { url = serviceUrl }, exception);
    ///
    /// // Export logs for bug report
    /// string logPath = Logger.Instance.ExportLogs();
    /// </code>
    /// </summary>
    public class Logger
    {
        // =============================================================================
        // Singleton Instance
        // =============================================================================

        private static Logger _instance;
        private static readonly object _lock = new object();

        /// <summary>
        /// Gets the singleton Logger instance.
        /// </summary>
        public static Logger Instance
        {
            get
            {
                if (_instance == null)
                {
                    lock (_lock)
                    {
                        if (_instance == null)
                        {
                            _instance = new Logger();
                        }
                    }
                }
                return _instance;
            }
        }

        // =============================================================================
        // Configuration
        // =============================================================================

        private bool _enabled = true;
        private LogLevel _level = LogLevel.Info;
        private bool _consoleOutput = true;
        private bool _fileOutput = true;
        private int _maxFiles = 5;
        private string _logDirectory;
        private string _currentLogFile;
        private readonly string _sessionId;

        // =============================================================================
        // Constructor
        // =============================================================================

        /// <summary>
        /// Private constructor for singleton pattern.
        /// </summary>
        private Logger()
        {
            _sessionId = GenerateSessionId();
            _logDirectory = Path.Combine(Main.ModDirectory ?? ".", "logs");
            EnsureLogDirectory();
            _currentLogFile = CreateLogFile();

            // Log session start
            Info("Logger", "Logging session started", new
            {
                sessionId = _sessionId,
                logFile = _currentLogFile
            });
        }

        /// <summary>
        /// Initializes the logger with the mod directory.
        /// Must be called after Main.ModDirectory is set.
        /// </summary>
        /// <param name="modDirectory">The mod's installation directory</param>
        public static void Initialize(string modDirectory)
        {
            Instance._logDirectory = Path.Combine(modDirectory, "logs");
            Instance.EnsureLogDirectory();
            Instance._currentLogFile = Instance.CreateLogFile();
        }

        // =============================================================================
        // Configuration Methods
        // =============================================================================

        /// <summary>
        /// Enables logging output.
        /// </summary>
        public void Enable()
        {
            _enabled = true;
            Info("Logger", "Logging enabled");
        }

        /// <summary>
        /// Disables all logging output.
        /// </summary>
        public void Disable()
        {
            Info("Logger", "Logging disabled");
            _enabled = false;
        }

        /// <summary>
        /// Checks if logging is currently enabled.
        /// </summary>
        public bool IsEnabled() => _enabled;

        /// <summary>
        /// Sets the minimum log level to output.
        /// Messages below this level will be ignored.
        /// </summary>
        /// <param name="level">Minimum LogLevel to output</param>
        public void SetLevel(LogLevel level)
        {
            _level = level;
            Info("Logger", $"Log level set to {level}");
        }

        /// <summary>
        /// Gets the current log level.
        /// </summary>
        public LogLevel GetLevel() => _level;

        /// <summary>
        /// Enables or disables console output.
        /// </summary>
        public void SetConsoleOutput(bool enabled) => _consoleOutput = enabled;

        /// <summary>
        /// Enables or disables file output.
        /// </summary>
        public void SetFileOutput(bool enabled) => _fileOutput = enabled;

        // =============================================================================
        // Logging Methods
        // =============================================================================

        /// <summary>
        /// Logs a DEBUG level message.
        /// Use for detailed debugging information during development.
        /// </summary>
        /// <param name="module">Source module/component name</param>
        /// <param name="message">Log message</param>
        /// <param name="data">Optional structured data to include</param>
        public void Debug(string module, string message, object data = null)
        {
            Log(LogLevel.Debug, module, message, data);
        }

        /// <summary>
        /// Logs an INFO level message.
        /// Use for general operational information.
        /// </summary>
        /// <param name="module">Source module/component name</param>
        /// <param name="message">Log message</param>
        /// <param name="data">Optional structured data to include</param>
        public void Info(string module, string message, object data = null)
        {
            Log(LogLevel.Info, module, message, data);
        }

        /// <summary>
        /// Logs a WARN level message.
        /// Use for warning conditions that should be reviewed.
        /// </summary>
        /// <param name="module">Source module/component name</param>
        /// <param name="message">Log message</param>
        /// <param name="data">Optional structured data to include</param>
        public void Warn(string module, string message, object data = null)
        {
            Log(LogLevel.Warn, module, message, data);
        }

        /// <summary>
        /// Logs an ERROR level message.
        /// Use for error conditions that need attention.
        /// </summary>
        /// <param name="module">Source module/component name</param>
        /// <param name="message">Log message</param>
        /// <param name="data">Optional structured data</param>
        /// <param name="exception">Optional exception for stack trace</param>
        public void Error(string module, string message, object data = null, Exception exception = null)
        {
            Log(LogLevel.Error, module, message, data, exception);
        }

        /// <summary>
        /// Logs a FATAL level message.
        /// Use for critical errors that may crash the application.
        /// </summary>
        /// <param name="module">Source module/component name</param>
        /// <param name="message">Log message</param>
        /// <param name="data">Optional structured data</param>
        /// <param name="exception">Optional exception for stack trace</param>
        public void Fatal(string module, string message, object data = null, Exception exception = null)
        {
            Log(LogLevel.Fatal, module, message, data, exception);
        }

        // =============================================================================
        // Export and Utility Methods
        // =============================================================================

        /// <summary>
        /// Exports all logs from the current session to a single file for bug reports.
        /// </summary>
        /// <returns>Path to the exported log file</returns>
        public string ExportLogs()
        {
            string exportPath = Path.Combine(_logDirectory, $"aiempires-logs-export-{_sessionId}.txt");

            var sb = new StringBuilder();
            sb.AppendLine(new string('=', 80));
            sb.AppendLine("AIEMPIRES MOD LOG EXPORT");
            sb.AppendLine(new string('=', 80));
            sb.AppendLine();
            sb.AppendLine($"Export Date: {DateTime.Now:O}");
            sb.AppendLine($"Session ID: {_sessionId}");
            sb.AppendLine($".NET Version: {Environment.Version}");
            sb.AppendLine($"OS: {Environment.OSVersion}");
            sb.AppendLine();
            sb.AppendLine(new string('=', 80));
            sb.AppendLine("LOG ENTRIES");
            sb.AppendLine(new string('=', 80));
            sb.AppendLine();

            if (File.Exists(_currentLogFile))
            {
                sb.Append(File.ReadAllText(_currentLogFile));
            }

            File.WriteAllText(exportPath, sb.ToString());
            Info("Logger", "Logs exported", new { path = exportPath });

            return exportPath;
        }

        /// <summary>
        /// Gets the path to the current log file.
        /// </summary>
        public string GetLogFilePath() => _currentLogFile;

        /// <summary>
        /// Gets the log directory path.
        /// </summary>
        public string GetLogDirectory() => _logDirectory;

        /// <summary>
        /// Gets the current session ID.
        /// </summary>
        public string GetSessionId() => _sessionId;

        /// <summary>
        /// Reads and returns recent log entries.
        /// </summary>
        /// <param name="count">Maximum number of entries to return</param>
        /// <returns>List of log entries</returns>
        public List<LogEntry> GetRecentLogs(int count = 100)
        {
            var entries = new List<LogEntry>();

            try
            {
                if (!File.Exists(_currentLogFile))
                {
                    return entries;
                }

                var lines = File.ReadAllLines(_currentLogFile);
                int start = Math.Max(0, lines.Length - count);

                for (int i = start; i < lines.Length; i++)
                {
                    if (string.IsNullOrWhiteSpace(lines[i])) continue;

                    try
                    {
                        var entry = JsonConvert.DeserializeObject<LogEntry>(lines[i]);
                        if (entry != null)
                        {
                            entries.Add(entry);
                        }
                    }
                    catch
                    {
                        entries.Add(new LogEntry
                        {
                            Timestamp = DateTime.Now.ToString("O"),
                            Level = "INFO",
                            Module = "Unknown",
                            Message = lines[i]
                        });
                    }
                }
            }
            catch
            {
                // Silently fail if we can't read logs
            }

            return entries;
        }

        /// <summary>
        /// Clears all log files.
        /// </summary>
        public void ClearLogs()
        {
            try
            {
                foreach (var file in Directory.GetFiles(_logDirectory))
                {
                    if (file.EndsWith(".log") || file.EndsWith(".txt"))
                    {
                        File.Delete(file);
                    }
                }
                _currentLogFile = CreateLogFile();
                Info("Logger", "All logs cleared");
            }
            catch (Exception e)
            {
                Console.WriteLine($"[AIEmpires] Failed to clear logs: {e.Message}");
            }
        }

        // =============================================================================
        // Private Methods
        // =============================================================================

        /// <summary>
        /// Core logging method that handles all log levels.
        /// </summary>
        private void Log(LogLevel level, string module, string message, object data = null, Exception exception = null)
        {
            // Check if logging is enabled and level is sufficient
            if (!_enabled || level < _level)
            {
                return;
            }

            // Build log entry
            var entry = new LogEntry
            {
                Timestamp = DateTime.Now.ToString("O"),
                Level = level.ToString().ToUpper(),
                Module = module,
                Message = message
            };

            if (data != null)
            {
                entry.Data = data;
            }

            if (exception != null)
            {
                entry.Stack = exception.ToString();
            }

            // Output to console
            if (_consoleOutput)
            {
                WriteToConsole(level, entry);
            }

            // Output to file
            if (_fileOutput)
            {
                WriteToFile(entry);
            }
        }

        /// <summary>
        /// Writes a log entry to the console with appropriate formatting.
        /// </summary>
        private void WriteToConsole(LogLevel level, LogEntry entry)
        {
            string prefix = $"[{entry.Timestamp}] [{entry.Level}] [{entry.Module}]";
            string message = $"{prefix} {entry.Message}";

            string dataStr = "";
            if (entry.Data != null)
            {
                try
                {
                    dataStr = $" {JsonConvert.SerializeObject(entry.Data)}";
                }
                catch
                {
                    dataStr = $" {entry.Data}";
                }
            }

            // Color-coded output based on level
            ConsoleColor originalColor = Console.ForegroundColor;
            switch (level)
            {
                case LogLevel.Debug:
                    Console.ForegroundColor = ConsoleColor.Gray;
                    break;
                case LogLevel.Info:
                    Console.ForegroundColor = ConsoleColor.White;
                    break;
                case LogLevel.Warn:
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    break;
                case LogLevel.Error:
                case LogLevel.Fatal:
                    Console.ForegroundColor = ConsoleColor.Red;
                    break;
            }

            Console.WriteLine($"[AIEmpires] {message}{dataStr}");

            if (entry.Stack != null)
            {
                Console.WriteLine($"[AIEmpires] Stack: {entry.Stack}");
            }

            Console.ForegroundColor = originalColor;
        }

        /// <summary>
        /// Writes a log entry to the current log file as JSON.
        /// </summary>
        private void WriteToFile(LogEntry entry)
        {
            try
            {
                string line = JsonConvert.SerializeObject(entry) + Environment.NewLine;
                File.AppendAllText(_currentLogFile, line);
            }
            catch (Exception e)
            {
                Console.WriteLine($"[AIEmpires] Failed to write log to file: {e.Message}");
            }
        }

        /// <summary>
        /// Ensures the log directory exists.
        /// </summary>
        private void EnsureLogDirectory()
        {
            if (!Directory.Exists(_logDirectory))
            {
                Directory.CreateDirectory(_logDirectory);
            }

            RotateLogFiles();
        }

        /// <summary>
        /// Creates a new log file for this session.
        /// </summary>
        private string CreateLogFile()
        {
            string timestamp = DateTime.Now.ToString("yyyy-MM-ddTHH-mm-ss");
            return Path.Combine(_logDirectory, $"aiempires-{timestamp}.log");
        }

        /// <summary>
        /// Generates a unique session ID.
        /// </summary>
        private string GenerateSessionId()
        {
            return $"{DateTimeOffset.Now.ToUnixTimeSeconds()}-{Guid.NewGuid().ToString("N").Substring(0, 7)}";
        }

        /// <summary>
        /// Removes old log files, keeping only the most recent ones.
        /// </summary>
        private void RotateLogFiles()
        {
            try
            {
                var files = new DirectoryInfo(_logDirectory)
                    .GetFiles("aiempires-*.log")
                    .OrderByDescending(f => f.LastWriteTime)
                    .ToArray();

                // Remove files beyond the limit
                for (int i = _maxFiles; i < files.Length; i++)
                {
                    files[i].Delete();
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"[AIEmpires] Failed to rotate log files: {e.Message}");
            }
        }
    }

    // =============================================================================
    // Supporting Types
    // =============================================================================

    /// <summary>
    /// Log severity levels in ascending order of importance.
    /// Higher values indicate more critical issues.
    /// </summary>
    public enum LogLevel
    {
        /// <summary>Detailed debugging information</summary>
        Debug = 0,
        /// <summary>General operational information</summary>
        Info = 1,
        /// <summary>Warning conditions that should be reviewed</summary>
        Warn = 2,
        /// <summary>Error conditions that need attention</summary>
        Error = 3,
        /// <summary>Critical errors that may crash the application</summary>
        Fatal = 4
    }

    /// <summary>
    /// Structure of a single log entry.
    /// </summary>
    public class LogEntry
    {
        /// <summary>ISO 8601 timestamp</summary>
        [JsonProperty("timestamp")]
        public string Timestamp { get; set; }

        /// <summary>Log level name</summary>
        [JsonProperty("level")]
        public string Level { get; set; }

        /// <summary>Source module/component</summary>
        [JsonProperty("module")]
        public string Module { get; set; }

        /// <summary>Log message</summary>
        [JsonProperty("message")]
        public string Message { get; set; }

        /// <summary>Optional structured data</summary>
        [JsonProperty("data", NullValueHandling = NullValueHandling.Ignore)]
        public object Data { get; set; }

        /// <summary>Error stack trace if applicable</summary>
        [JsonProperty("stack", NullValueHandling = NullValueHandling.Ignore)]
        public string Stack { get; set; }
    }
}
