# ============================================================================
# AIEmpires - LLM-Powered Faction AI for BattleTech
# Copyright (c) 2024-2025 Blackhorse311
# Licensed under MIT License
# ============================================================================
# File: config.py
# Purpose: Configuration management for the AI service
# ============================================================================
"""
Configuration for the AIEmpires AI service.

This module loads environment variables and provides configuration constants
for the Flask service and LLM providers.

Environment Variables:
    ANTHROPIC_API_KEY: API key for Anthropic Claude
    OPENAI_API_KEY: API key for OpenAI GPT
    GROQ_API_KEY: API key for Groq
    HOST: Service host (default: 127.0.0.1)
    PORT: Service port (default: 5000)
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# VERSION
# ============================================================================

VERSION = "0.1.0"

# ============================================================================
# LLM PROVIDER SETTINGS
# ============================================================================

# Claude API settings
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

# OpenAI settings (optional)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")

# Groq settings (optional)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")

# Local provider endpoints (optional)
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
LMSTUDIO_ENDPOINT = os.getenv("LMSTUDIO_ENDPOINT", "http://localhost:1234")

# ============================================================================
# LLM GENERATION SETTINGS
# ============================================================================

MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1024"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

# ============================================================================
# SERVER SETTINGS
# ============================================================================

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# ============================================================================
# RATE LIMITING
# ============================================================================

MAX_REQUESTS_PER_MINUTE = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "20"))
