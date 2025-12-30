# AIEmpires Logging System

## Overview

All AIEmpires components include a robust logging system for debugging, troubleshooting, and error reporting. Players can enable/disable logging, adjust log levels, and export logs for bug reports.

## Features

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **File & Console Output**: Configurable output destinations
- **Log Rotation**: Automatic cleanup of old log files (keeps last 5)
- **Session Tracking**: Unique session IDs for correlating logs
- **JSON Format**: Structured logs for easy parsing
- **Easy Export**: One-click export for bug reports

---

## Log Levels

| Level | Value | When to Use |
|-------|-------|-------------|
| DEBUG | 0 | Detailed debugging information. Only for development. |
| INFO | 1 | General operational information. Default level. |
| WARN | 2 | Warning conditions that should be reviewed. |
| ERROR | 3 | Error conditions that need attention. |
| FATAL | 4 | Critical errors that may crash the application. |

**Recommendation**: Use INFO for normal operation. Switch to DEBUG only when troubleshooting specific issues, as it generates much more data.

---

## Usage by Component

### Launcher (TypeScript)

Location: `launcher/src/main/logger.ts`

```typescript
import { logger, LogLevel } from './logger'

// Enable/disable logging
logger.enable()
logger.disable()

// Set minimum log level
logger.setLevel(LogLevel.DEBUG)

// Log messages with context
logger.debug('ModManager', 'Checking mod versions', { count: 5 })
logger.info('ModManager', 'Mod download started', { modName: 'CustomAmmo' })
logger.warn('AIService', 'Slow response from API', { duration: 5000 })
logger.error('AIService', 'Connection failed', { provider: 'anthropic' })
logger.fatal('Main', 'Application crash', { error: err })

// Export logs for bug report
const exportPath = await logger.exportLogs()

// Get recent log entries
const entries = logger.getRecentLogs(100)

// Clear all logs
logger.clearLogs()
```

### AI Service (Python)

Location: `ai-service/utils/logger.py`

```python
from utils.logger import logger, LogLevel

# Enable/disable logging
logger.enable()
logger.disable()

# Set minimum log level
logger.set_level(LogLevel.DEBUG)

# Log messages with context
logger.debug('FactionAgent', 'Building world view', {'faction': 'Davion'})
logger.info('AIBrain', 'Processing faction turn', {'faction': 'Davion'})
logger.warning('LLMProvider', 'Rate limited', {'wait_time': 60})
logger.error('HttpClient', 'Connection failed', {'url': url}, exc_info=exception)
logger.critical('Main', 'Service crash', {'error': str(e)}, exc_info=exception)

# Export logs for bug report
log_path = logger.export_logs()

# Get recent log entries
entries = logger.get_recent_logs(100)

# Clear all logs
logger.clear_logs()
```

### Game Mod (C#)

Location: `game-mod/AIEmpires/Utils/Logger.cs`

```csharp
using AIEmpires.Utils;

// Enable/disable logging
Logger.Instance.Enable();
Logger.Instance.Disable();

// Set minimum log level
Logger.Instance.SetLevel(LogLevel.Debug);

// Log messages with context
Logger.Instance.Debug("AIBrain", "Building faction context", new { faction = "Davion" });
Logger.Instance.Info("AIBrain", "Processing faction turn", new { faction = "Davion" });
Logger.Instance.Warn("HttpClient", "Slow response", new { duration = 5000 });
Logger.Instance.Error("HttpClient", "Connection failed", new { url = serviceUrl }, exception);
Logger.Instance.Fatal("Main", "Mod crash", new { error = e.Message }, exception);

// Export logs for bug report
string logPath = Logger.Instance.ExportLogs();

// Get recent log entries
List<LogEntry> entries = Logger.Instance.GetRecentLogs(100);

// Clear all logs
Logger.Instance.ClearLogs();
```

---

## Log File Locations

| Component | Directory |
|-----------|-----------|
| Launcher | `%APPDATA%/aiempires-launcher/logs/` |
| AI Service | `ai-service/logs/` |
| Game Mod | `<ModDirectory>/logs/` |

### File Naming

Log files use the format: `aiempires-YYYY-MM-DDTHH-mm-ss.log`

Example: `aiempires-2024-12-30T15-30-45.log`

### Log Rotation

- Maximum files: 5
- Maximum file size: 10MB per file
- Oldest files are automatically deleted when limits are exceeded

---

## Log Entry Format

All logs are stored as JSON, one entry per line:

```json
{
  "timestamp": "2024-12-30T15:30:45.123Z",
  "level": "INFO",
  "module": "ModManager",
  "message": "Mod download complete",
  "data": {
    "modName": "CustomAmmo",
    "version": "1.2.3",
    "size": 1048576
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| timestamp | string | ISO 8601 timestamp |
| level | string | Log level (DEBUG, INFO, WARN, ERROR, FATAL) |
| module | string | Source module/component name |
| message | string | Human-readable log message |
| data | object | Optional structured data |
| stack | string | Error stack trace (if applicable) |

---

## Bug Report Export

### From Launcher UI

1. Open the AIEmpires Launcher
2. Navigate to **Settings**
3. Scroll to the **Logging** section
4. Click **Export Logs for Bug Report**
5. The export file opens in File Explorer
6. Attach the `.txt` file to your [GitHub Issue](https://github.com/Blackhorse311/AIEmpires/issues)

### Export File Contents

The export file includes:

```
================================================================================
AIEMPIRES LOG EXPORT
================================================================================

Export Date: 2024-12-30T15:30:45.123Z
Session ID: 1735574445-abc1234
App Version: 1.0.0
Platform: win32 x64
Node Version: v18.19.0
Electron Version: 28.0.0

================================================================================
LOG ENTRIES
================================================================================

{"timestamp":"...","level":"INFO","module":"Main","message":"..."}
{"timestamp":"...","level":"INFO","module":"ModManager","message":"..."}
...
```

---

## Troubleshooting

### Enable Debug Logging

For detailed troubleshooting, enable DEBUG level:

**Launcher**: Settings > Logging > Log Level > DEBUG

**AI Service**: Set environment variable or call `logger.set_level(LogLevel.DEBUG)`

**Game Mod**: Set `EnableDebugLogging: true` in mod.json

### Common Issues

| Symptom | Check Logs For |
|---------|----------------|
| Mods not downloading | `ModManager` module errors |
| AI not responding | `AIService` connection errors |
| Game not launching | `Main` module errors |
| LLM errors | `AIService` provider errors |

### Log Too Large

If logs are too large:
1. Clear logs from Settings
2. Reproduce the issue
3. Export immediately after

---

## Best Practices for Developers

### When to Log

```typescript
// DO: Log significant state changes
logger.info('ModManager', 'Download complete', { modName, duration })

// DO: Log errors with context
logger.error('AIService', 'API request failed', { endpoint, status, response })

// DON'T: Log inside tight loops
// for (let i = 0; i < 10000; i++) {
//   logger.debug('Loop', 'Iteration', { i })  // Too noisy!
// }

// DON'T: Log sensitive data
// logger.info('Auth', 'Login', { apiKey: userApiKey })  // Security risk!
```

### Module Naming Convention

Use consistent module names for easy filtering:

- `Main` - Application lifecycle
- `IPC` - Inter-process communication
- `ModManager` - Mod download and installation
- `AIService` - LLM provider communication
- `GameDetector` - Game path detection
- `Logger` - Logging system itself

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [VERSIONING.md](VERSIONING.md) - Version numbering standards
- [GitHub Issues](https://github.com/Blackhorse311/AIEmpires/issues) - Report bugs
