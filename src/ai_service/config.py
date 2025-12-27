"""Configuration for the AI Empires service."""
import os
from dotenv import load_dotenv

load_dotenv()

# Claude API settings
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1024"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

# Server settings
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Rate limiting
MAX_REQUESTS_PER_MINUTE = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "20"))
