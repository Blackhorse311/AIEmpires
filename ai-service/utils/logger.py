"""
AIEmpires AI Service - Logging System

Provides a robust, configurable logging system for the AIEmpires AI service.
Logs can be enabled/disabled, filtered by level, and exported for bug reports.

Author: AIEmpires Team
Version: 1.0.0
License: MIT

Features:
---------
- Multiple log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- File and console output
- Log rotation (keeps last 5 log files)
- Structured JSON logs for parsing
- Easy export for bug reports
- Performance timestamps
- Context tagging (module/function names)
- FastAPI request logging middleware

Usage:
------
```python
from utils.logger import logger, LogLevel

# Configure logging
logger.set_level(LogLevel.DEBUG)
logger.enable()

# Log messages
logger.info('ModManager', 'Starting mod download', {'mod_name': 'CustomAmmo'})
logger.error('AIService', 'Connection failed', {'provider': 'anthropic', 'error': str(e)})

# Export logs for bug report
log_path = logger.export_logs()
```
"""

import os
import sys
import json
import logging
from datetime import datetime
from enum import IntEnum
from pathlib import Path
from typing import Optional, Any, Dict, List
from logging.handlers import RotatingFileHandler
import uuid


# =============================================================================
# Types and Enums
# =============================================================================

class LogLevel(IntEnum):
    """
    Log severity levels in ascending order of importance.
    Higher values indicate more critical issues.
    """
    DEBUG = 0      # Detailed debugging information
    INFO = 1       # General operational information
    WARNING = 2    # Warning conditions that should be reviewed
    ERROR = 3      # Error conditions that need attention
    CRITICAL = 4   # Critical errors that may crash the application


# Map our LogLevel to Python's logging levels
LOG_LEVEL_MAP = {
    LogLevel.DEBUG: logging.DEBUG,
    LogLevel.INFO: logging.INFO,
    LogLevel.WARNING: logging.WARNING,
    LogLevel.ERROR: logging.ERROR,
    LogLevel.CRITICAL: logging.CRITICAL
}


# =============================================================================
# Logger Class
# =============================================================================

class AIEmpiresLogger:
    """
    Centralized logging system for the AIEmpires AI service.

    Provides consistent, configurable logging across all modules with
    support for multiple output destinations and log levels.

    Example:
    --------
    ```python
    # Get the singleton instance
    from utils.logger import logger, LogLevel

    # Configure
    logger.set_level(LogLevel.DEBUG)
    logger.enable()

    # Use throughout the application
    logger.info('MyModule', 'Operation completed', {'duration': 150})
    ```
    """

    _instance = None

    def __new__(cls):
        """Singleton pattern - only one logger instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize the logger with default configuration."""
        if self._initialized:
            return

        # Generate unique session ID for this run
        self.session_id = self._generate_session_id()

        # Default configuration
        self._enabled = True
        self._level = LogLevel.INFO
        self._console_output = True
        self._file_output = True
        self._max_files = 5
        self._max_file_size_mb = 10

        # Set up log directory
        self.log_dir = self._get_log_directory()
        self._ensure_log_directory()

        # Create log file for this session
        self.current_log_file = self._create_log_file()

        # Set up Python logging
        self._setup_python_logging()

        # Mark as initialized
        self._initialized = True

        # Log session start
        self.info('Logger', 'Logging session started', {
            'session_id': self.session_id,
            'log_file': str(self.current_log_file),
            'python_version': sys.version
        })

    # -------------------------------------------------------------------------
    # Configuration Methods
    # -------------------------------------------------------------------------

    def enable(self) -> None:
        """Enables logging output."""
        self._enabled = True
        self.info('Logger', 'Logging enabled')

    def disable(self) -> None:
        """Disables all logging output."""
        self.info('Logger', 'Logging disabled')
        self._enabled = False

    def is_enabled(self) -> bool:
        """Checks if logging is currently enabled."""
        return self._enabled

    def set_level(self, level: LogLevel) -> None:
        """
        Sets the minimum log level to output.
        Messages below this level will be ignored.

        Args:
            level: Minimum LogLevel to output
        """
        self._level = level
        # Update Python logger level
        python_level = LOG_LEVEL_MAP.get(level, logging.INFO)
        self._logger.setLevel(python_level)
        for handler in self._logger.handlers:
            handler.setLevel(python_level)
        self.info('Logger', f'Log level set to {level.name}')

    def get_level(self) -> LogLevel:
        """Gets the current log level."""
        return self._level

    def set_console_output(self, enabled: bool) -> None:
        """Enables or disables console output."""
        self._console_output = enabled

    def set_file_output(self, enabled: bool) -> None:
        """Enables or disables file output."""
        self._file_output = enabled

    def get_config(self) -> Dict[str, Any]:
        """Gets the current configuration."""
        return {
            'enabled': self._enabled,
            'level': self._level.name,
            'console_output': self._console_output,
            'file_output': self._file_output,
            'max_files': self._max_files,
            'max_file_size_mb': self._max_file_size_mb,
            'log_dir': str(self.log_dir),
            'current_log_file': str(self.current_log_file)
        }

    def load_config(self, config: Dict[str, Any]) -> None:
        """Updates configuration from saved settings."""
        if 'enabled' in config:
            self._enabled = config['enabled']
        if 'level' in config:
            level_name = config['level']
            if isinstance(level_name, str):
                self._level = LogLevel[level_name]
            else:
                self._level = LogLevel(level_name)
        if 'console_output' in config:
            self._console_output = config['console_output']
        if 'file_output' in config:
            self._file_output = config['file_output']

    # -------------------------------------------------------------------------
    # Logging Methods
    # -------------------------------------------------------------------------

    def debug(self, module: str, message: str, data: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs a DEBUG level message.
        Use for detailed debugging information during development.

        Args:
            module: Source module/component name
            message: Log message
            data: Optional structured data to include
        """
        self._log(LogLevel.DEBUG, module, message, data)

    def info(self, module: str, message: str, data: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs an INFO level message.
        Use for general operational information.

        Args:
            module: Source module/component name
            message: Log message
            data: Optional structured data to include
        """
        self._log(LogLevel.INFO, module, message, data)

    def warning(self, module: str, message: str, data: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs a WARNING level message.
        Use for warning conditions that should be reviewed.

        Args:
            module: Source module/component name
            message: Log message
            data: Optional structured data to include
        """
        self._log(LogLevel.WARNING, module, message, data)

    def error(self, module: str, message: str, data: Optional[Dict[str, Any]] = None,
              exc_info: Optional[Exception] = None) -> None:
        """
        Logs an ERROR level message.
        Use for error conditions that need attention.

        Args:
            module: Source module/component name
            message: Log message
            data: Optional structured data or Error object
            exc_info: Optional exception for stack trace
        """
        if exc_info and data:
            data['exception'] = str(exc_info)
            data['exception_type'] = type(exc_info).__name__
        elif exc_info:
            data = {
                'exception': str(exc_info),
                'exception_type': type(exc_info).__name__
            }
        self._log(LogLevel.ERROR, module, message, data, exc_info)

    def critical(self, module: str, message: str, data: Optional[Dict[str, Any]] = None,
                 exc_info: Optional[Exception] = None) -> None:
        """
        Logs a CRITICAL level message.
        Use for critical errors that may crash the application.

        Args:
            module: Source module/component name
            message: Log message
            data: Optional structured data or Error object
            exc_info: Optional exception for stack trace
        """
        if exc_info and data:
            data['exception'] = str(exc_info)
            data['exception_type'] = type(exc_info).__name__
        elif exc_info:
            data = {
                'exception': str(exc_info),
                'exception_type': type(exc_info).__name__
            }
        self._log(LogLevel.CRITICAL, module, message, data, exc_info)

    # -------------------------------------------------------------------------
    # Export and Utility Methods
    # -------------------------------------------------------------------------

    def export_logs(self) -> str:
        """
        Exports all logs from the current session to a single file for bug reports.

        Returns:
            Path to the exported log file
        """
        export_path = self.log_dir / f'aiempires-logs-export-{self.session_id}.txt'

        # Build export content
        lines = [
            '=' * 80,
            'AIEMPIRES AI SERVICE LOG EXPORT',
            '=' * 80,
            '',
            f'Export Date: {datetime.now().isoformat()}',
            f'Session ID: {self.session_id}',
            f'Python Version: {sys.version}',
            '',
            '=' * 80,
            'LOG ENTRIES',
            '=' * 80,
            ''
        ]

        # Read current log file
        if self.current_log_file.exists():
            with open(self.current_log_file, 'r', encoding='utf-8') as f:
                lines.append(f.read())

        # Write export file
        with open(export_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        self.info('Logger', 'Logs exported', {'path': str(export_path)})
        return str(export_path)

    def get_log_file_path(self) -> str:
        """Gets the path to the current log file."""
        return str(self.current_log_file)

    def get_log_directory(self) -> str:
        """Gets the log directory path."""
        return str(self.log_dir)

    def get_session_id(self) -> str:
        """Gets the current session ID."""
        return self.session_id

    def get_recent_logs(self, count: int = 100) -> List[Dict[str, Any]]:
        """
        Reads and returns recent log entries.

        Args:
            count: Maximum number of entries to return

        Returns:
            List of log entry dictionaries
        """
        try:
            if not self.current_log_file.exists():
                return []

            with open(self.current_log_file, 'r', encoding='utf-8') as f:
                lines = f.read().strip().split('\n')

            recent_lines = lines[-count:] if len(lines) > count else lines

            entries = []
            for line in recent_lines:
                if line.strip():
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        entries.append({
                            'timestamp': datetime.now().isoformat(),
                            'level': 'INFO',
                            'module': 'Unknown',
                            'message': line
                        })
            return entries
        except Exception:
            return []

    def clear_logs(self) -> None:
        """Clears all log files."""
        try:
            for file in self.log_dir.iterdir():
                if file.suffix in ['.log', '.txt']:
                    file.unlink()
            self.current_log_file = self._create_log_file()
            self._setup_python_logging()
            self.info('Logger', 'All logs cleared')
        except Exception as e:
            print(f'Failed to clear logs: {e}')

    # -------------------------------------------------------------------------
    # Private Methods
    # -------------------------------------------------------------------------

    def _log(self, level: LogLevel, module: str, message: str,
             data: Optional[Dict[str, Any]] = None,
             exc_info: Optional[Exception] = None) -> None:
        """Core logging method that handles all log levels."""
        # Check if logging is enabled and level is sufficient
        if not self._enabled or level < self._level:
            return

        # Build log entry
        entry = {
            'timestamp': datetime.now().isoformat(),
            'level': level.name,
            'module': module,
            'message': message
        }

        if data:
            entry['data'] = data

        # Console output
        if self._console_output:
            self._write_to_console(level, entry)

        # File output (JSON format)
        if self._file_output:
            self._write_to_file(entry)

    def _write_to_console(self, level: LogLevel, entry: Dict[str, Any]) -> None:
        """Writes a log entry to the console with appropriate formatting."""
        prefix = f"[{entry['timestamp']}] [{entry['level']}] [{entry['module']}]"
        message = f"{prefix} {entry['message']}"

        data_str = ''
        if 'data' in entry:
            try:
                data_str = f" {json.dumps(entry['data'])}"
            except (TypeError, ValueError):
                data_str = f" {entry['data']}"

        # Use appropriate log function
        python_level = LOG_LEVEL_MAP.get(level, logging.INFO)
        self._logger.log(python_level, message + data_str)

    def _write_to_file(self, entry: Dict[str, Any]) -> None:
        """Writes a log entry to the current log file as JSON."""
        try:
            with open(self.current_log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            print(f'Failed to write log to file: {e}')

    def _get_log_directory(self) -> Path:
        """Gets the log directory path."""
        # Use a 'logs' subdirectory in the ai-service directory
        base_dir = Path(__file__).parent.parent
        return base_dir / 'logs'

    def _ensure_log_directory(self) -> None:
        """Ensures the log directory exists."""
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._rotate_log_files()

    def _create_log_file(self) -> Path:
        """Creates a new log file for this session."""
        timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
        return self.log_dir / f'aiempires-{timestamp}.log'

    def _generate_session_id(self) -> str:
        """Generates a unique session ID."""
        return f"{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:7]}"

    def _rotate_log_files(self) -> None:
        """Removes old log files, keeping only the most recent ones."""
        try:
            log_files = sorted(
                [f for f in self.log_dir.iterdir()
                 if f.name.startswith('aiempires-') and f.suffix == '.log'],
                key=lambda f: f.stat().st_mtime,
                reverse=True
            )

            # Remove files beyond the limit
            for log_file in log_files[self._max_files:]:
                log_file.unlink()
        except Exception as e:
            print(f'Failed to rotate log files: {e}')

    def _setup_python_logging(self) -> None:
        """Sets up Python's logging module."""
        self._logger = logging.getLogger('aiempires')
        self._logger.setLevel(LOG_LEVEL_MAP.get(self._level, logging.INFO))

        # Remove existing handlers
        self._logger.handlers.clear()

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(LOG_LEVEL_MAP.get(self._level, logging.INFO))
        console_format = logging.Formatter(
            '%(message)s',
            datefmt='%Y-%m-%dT%H:%M:%S'
        )
        console_handler.setFormatter(console_format)
        self._logger.addHandler(console_handler)


# =============================================================================
# FastAPI Middleware for Request Logging
# =============================================================================

async def logging_middleware(request, call_next):
    """
    FastAPI middleware for logging all requests.

    Usage:
    ------
    ```python
    from utils.logger import logging_middleware

    app = FastAPI()
    app.middleware('http')(logging_middleware)
    ```
    """
    start_time = datetime.now()

    # Log request
    logger.debug('HTTP', f'{request.method} {request.url.path}', {
        'method': request.method,
        'path': str(request.url.path),
        'query': str(request.query_params)
    })

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = (datetime.now() - start_time).total_seconds() * 1000

    # Log response
    log_level = LogLevel.INFO if response.status_code < 400 else LogLevel.WARNING
    if response.status_code >= 500:
        log_level = LogLevel.ERROR

    logger._log(log_level, 'HTTP', f'{request.method} {request.url.path} - {response.status_code}', {
        'method': request.method,
        'path': str(request.url.path),
        'status_code': response.status_code,
        'duration_ms': round(duration, 2)
    })

    return response


# =============================================================================
# Singleton Export
# =============================================================================

# Singleton logger instance for use throughout the application
logger = AIEmpiresLogger()

__all__ = ['logger', 'LogLevel', 'AIEmpiresLogger', 'logging_middleware']
