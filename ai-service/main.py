"""
AIEmpires AI Service

FastAPI application providing LLM-powered faction AI for BattleTech.

Author: AIEmpires Team
Version: 1.0.0
License: MIT

This service provides:
- LLM integration for faction AI decision making
- Support for multiple providers (Anthropic, OpenAI, Google, Groq, Ollama)
- Cost estimation and token tracking
- RESTful API for game mod communication
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from utils.logger import logger, LogLevel, logging_middleware

# Import routers (to be implemented)
# from api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    logger.info('Main', 'AIEmpires AI Service starting', {
        'version': '1.0.0',
        'host': '127.0.0.1',
        'port': 5000
    })
    yield
    # Shutdown
    logger.info('Main', 'AIEmpires AI Service shutting down')


app = FastAPI(
    title="AIEmpires AI Service",
    description="LLM-powered faction AI for BattleTech",
    version="1.0.0",
    lifespan=lifespan
)

# Add logging middleware for request/response tracking
app.middleware('http')(logging_middleware)

# CORS middleware for Electron app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to launcher origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - service info."""
    return {
        "service": "AIEmpires AI Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    logger.debug('API', 'Health check requested')
    return {"status": "healthy"}


@app.get("/api/logs/export")
async def export_logs():
    """
    Export logs for bug reports.
    Returns the path to the exported log file.
    """
    export_path = logger.export_logs()
    return {"path": export_path}


@app.get("/api/logs/recent")
async def get_recent_logs(count: int = 100):
    """
    Get recent log entries.

    Args:
        count: Maximum number of entries to return (default: 100)
    """
    return logger.get_recent_logs(count)


@app.post("/api/logs/level")
async def set_log_level(request: Request):
    """
    Set the logging level.

    Body:
        level: Log level name (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    body = await request.json()
    level_name = body.get('level', 'INFO').upper()
    try:
        level = LogLevel[level_name]
        logger.set_level(level)
        return {"level": level_name}
    except KeyError:
        return {"error": f"Invalid log level: {level_name}"}


# TODO: Include API routers
# app.include_router(router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    logger.set_level(LogLevel.DEBUG)  # Enable debug logging in development
    uvicorn.run(app, host="127.0.0.1", port=5000)
