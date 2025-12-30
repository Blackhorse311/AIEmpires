# AIEmpires - Complete System Architecture

**Version:** 1.0
**Date:** 2024-12-30
**Status:** Design Complete

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Architecture](#2-component-architecture)
3. [Launcher Application](#3-launcher-application)
4. [AI Service](#4-ai-service)
5. [Game Integration (C# Mod)](#5-game-integration-c-mod)
6. [Data Schemas](#6-data-schemas)
7. [Operational Period Planning](#7-operational-period-planning)
8. [LLM Provider System](#8-llm-provider-system)
9. [Cost Estimation System](#9-cost-estimation-system)
10. [State Persistence](#10-state-persistence)
11. [Distribution & Updates](#11-distribution--updates)
12. [Folder Structures](#12-folder-structures)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLAYER'S COMPUTER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     AIEmpires Launcher (Electron)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Mod Mgmt   │  │ LLM Config  │  │  Era/Game   │  │   Launch    │  │   │
│  │  │  Download   │  │  API Keys   │  │   Setup     │  │   Button    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                    │                                     │         │
│         │ Downloads          │ Configures                         │ Starts  │
│         ▼                    ▼                                     ▼         │
│  ┌─────────────┐    ┌──────────────────┐                 ┌───────────────┐  │
│  │  BATTLETECH │    │   AI Service     │◄───────────────►│   BattleTech  │  │
│  │    /Mods/   │    │   (Python)       │    HTTP/REST    │     Game      │  │
│  │             │    │                  │                 │               │  │
│  │ ┌─────────┐ │    │ ┌──────────────┐ │                 │ ┌───────────┐ │  │
│  │ │AIEmpires│ │    │ │Faction Agents│ │                 │ │AIEmpires  │ │  │
│  │ │  Mod    │◄┼────┼─┤  (15-25)     │ │                 │ │ C# Mod    │ │  │
│  │ └─────────┘ │    │ └──────────────┘ │                 │ └───────────┘ │  │
│  │ ┌─────────┐ │    │ ┌──────────────┐ │                 └───────────────┘  │
│  │ │WarTech  │ │    │ │State Manager │ │                                    │
│  │ │  IIC    │ │    │ └──────────────┘ │                                    │
│  │ └─────────┘ │    │ ┌──────────────┐ │                                    │
│  │ ┌─────────┐ │    │ │LLM Providers │ │                                    │
│  │ │ Other   │ │    │ └──────┬───────┘ │                                    │
│  │ │  Mods   │ │    └────────┼─────────┘                                    │
│  │ └─────────┘ │             │                                              │
│  └─────────────┘             │                                              │
│                              ▼                                              │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │   Claude    │     │   OpenAI    │     │   Ollama    │
   │    API      │     │    API      │     │   (Local)   │
   └─────────────┘     └─────────────┘     └─────────────┘
```

### 1.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MONTHLY DECISION CYCLE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. GAME STATE EXPORT (C# Mod → AI Service)                                 │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Current system ownership                                      │     │
│     │  • Active WarTechIIC flareups                                   │     │
│     │  • Player position and reputation                               │     │
│     │  • Resource levels per faction                                  │     │
│     │  • Diplomatic states (treaties, trust)                          │     │
│     │  • Military unit positions and strength                         │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  2. AI PLANNING (AI Service - Background)                                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  FOR EACH FACTION (isolated calls):                             │     │
│     │    • Build faction-specific world view                          │     │
│     │    • Load faction memory & personality                          │     │
│     │    • Query LLM for 30-day plan                                  │     │
│     │    • Validate & parse decisions                                 │     │
│     │    • Store in pending_decisions queue                           │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  3. DECISION EXECUTION (AI Service → C# Mod → WarTechIIC)                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Pop decisions from queue for current month                   │     │
│     │  • Translate to WIIC stat modifications                         │     │
│     │  • Apply diplomatic changes                                     │     │
│     │  • Trigger events/notifications                                 │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Component Responsibilities

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **Launcher** | Electron + React + TypeScript | Mod management, LLM config, game launching, updates |
| **AI Service** | Python + Flask/FastAPI | LLM communication, faction agents, state management |
| **C# Mod** | C# + Harmony | Game hooks, state export, WIIC control, event handling |
| **State Store** | JSON files | Persistent faction memory, galaxy state, decisions |

### 2.2 Communication Protocols

```
Launcher ──────► AI Service
         HTTP POST /api/config
         • Set LLM provider
         • Set API keys
         • Set faction tier

Game (C#) ─────► AI Service
         HTTP POST /api/state/update
         • Push current game state

         HTTP GET /api/decisions/{month}
         • Get decisions for execution

         HTTP POST /api/events
         • Notify of major events (for reactive factions)

AI Service ────► LLM Providers
         Provider-specific APIs
         • Stateless request/response
         • Each faction = separate call
```

---

## 3. Launcher Application

### 3.1 Technology Stack

```
AIEmpires-Launcher/
├── package.json
├── electron-builder.json
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Entry point
│   │   ├── updater.ts           # Auto-update logic
│   │   ├── mod-manager.ts       # Download/install mods
│   │   ├── game-detector.ts     # Find BattleTech install
│   │   └── ai-service.ts        # Start/stop AI service
│   │
│   ├── renderer/                # React frontend
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Setup.tsx        # First-run setup
│   │   │   ├── ModManager.tsx   # Mod installation
│   │   │   ├── LLMConfig.tsx    # Provider/key config
│   │   │   ├── GameConfig.tsx   # Era, factions, settings
│   │   │   └── Launch.tsx       # Launch game button
│   │   ├── components/
│   │   │   ├── CostEstimator.tsx
│   │   │   ├── ProviderDropdown.tsx
│   │   │   ├── FactionTierSelector.tsx
│   │   │   └── OllamaInstaller.tsx
│   │   └── styles/
│   │
│   └── preload/
│       └── index.ts             # IPC bridge
│
└── resources/
    ├── manifest.json            # Mod versions & sources
    └── icons/
```

### 3.2 Launcher UI Wireframes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                         A I   E M P I R E S                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [Mods]    [AI Config]    [Game Setup]    [Launch]                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  AI CONFIGURATION                                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                        ║  │
│  ║  LLM Provider:  [▼ Claude (Anthropic)                              ]  ║  │
│  ║                                                                        ║  │
│  ║  Model:         [▼ claude-sonnet-4-20250514                        ]  ║  │
│  ║                                                                        ║  │
│  ║  API Key:       [••••••••••••••••••••••••••••••] [Test Connection]    ║  │
│  ║                                                                        ║  │
│  ║  ─────────────────────────────────────────────────────────────────    ║  │
│  ║                                                                        ║  │
│  ║  Faction Tier:  ○ Essential (5 factions)    ~$0.04/game-month         ║  │
│  ║                 ● Major (15 factions)       ~$0.18/game-month         ║  │
│  ║                 ○ Full (25+ factions)       ~$0.35/game-month         ║  │
│  ║                                                                        ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  ESTIMATED COSTS                                                 │  ║  │
│  ║  │                                                                  │  ║  │
│  ║  │  Provider: Claude Sonnet                                        │  ║  │
│  ║  │  Factions: 15 (Major tier)                                      │  ║  │
│  ║  │                                                                  │  ║  │
│  ║  │  Per game-month:    $0.18                                       │  ║  │
│  ║  │  Per 50 months:     $9.00                                       │  ║  │
│  ║  │  Per 100 months:    $18.00                                      │  ║  │
│  ║  │                                                                  │  ║  │
│  ║  │  (Based on ~2000 tokens per faction decision)                   │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                        ║  │
│  ║  ─────────────────────────────────────────────────────────────────    ║  │
│  ║                                                                        ║  │
│  ║  OFFLINE/BACKUP:                                                      ║  │
│  ║  [✓] Use Ollama as fallback when offline                             ║  │
│  ║                                                                        ║  │
│  ║  Ollama Status: ⚠ Not Installed                                       ║  │
│  ║  [Download Ollama]  [Installation Guide]                              ║  │
│  ║                                                                        ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        [  LAUNCH BATTLETECH  ]                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Status: Ready │ Mods: 65 installed │ AI Service: Running                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 First-Run Setup Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FIRST-RUN SETUP WIZARD                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: Locate BattleTech                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  We found BattleTech at:                                                ││
│  │  F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH              ││
│  │                                                                         ││
│  │  [✓] Correct    [ ] Choose Different Location                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Step 2: Download Core Mods                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ████████████████████████████░░░░░░░░░░  65%                           ││
│  │  Downloading: MechEngineer v1.2.3...                                   ││
│  │                                                                         ││
│  │  Downloaded: 42/65 mods                                                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Step 3: Configure AI                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Choose your AI provider (you can change this later):                  ││
│  │                                                                         ││
│  │  ○ Claude (Anthropic) - Best reasoning, recommended                    ││
│  │  ○ GPT-4 (OpenAI) - Fast, good quality                                 ││
│  │  ○ Ollama (Local) - Free, requires local install                       ││
│  │  ○ Skip for now - Configure later                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│                              [Continue →]                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Ollama Installation Guide Screen

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OLLAMA INSTALLATION GUIDE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Ollama allows you to run AI models locally for FREE, with no internet     │
│  required. We recommend installing it as a fallback option.                 │
│                                                                              │
│  STEP 1: Download Ollama                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [  Download Ollama for Windows  ]                                      ││
│  │  (Opens: https://ollama.ai/download)                                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  STEP 2: Install Ollama                                                     │
│  • Run the downloaded installer                                             │
│  • Follow the installation prompts                                          │
│  • Default location is fine                                                 │
│                                                                              │
│  STEP 3: Download a Model                                                   │
│  • Open Command Prompt or PowerShell                                        │
│  • Run: ollama pull llama3.1                                                │
│  • Wait for download (~4GB)                                                 │
│                                                                              │
│  STEP 4: Verify Installation                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [  Check Ollama Status  ]                                              ││
│  │                                                                         ││
│  │  Status: ✓ Ollama detected at http://localhost:11434                   ││
│  │  Models: llama3.1 (8B), mistral (7B)                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  RECOMMENDED MODELS:                                                        │
│  • llama3.1 (8B) - Good balance of speed and quality                       │
│  • llama3.1 (70B) - Best quality, requires 48GB+ RAM                       │
│  • mistral (7B) - Fast, good for testing                                   │
│                                                                              │
│                          [  Done  ]    [  Skip  ]                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. AI Service

### 4.1 Technology Stack

```
ai-service/
├── requirements.txt
├── main.py                      # FastAPI entry point
├── config.py                    # Configuration management
│
├── api/
│   ├── __init__.py
│   ├── routes.py                # API endpoints
│   ├── models.py                # Pydantic request/response models
│   └── middleware.py            # CORS, logging, etc.
│
├── providers/
│   ├── __init__.py
│   ├── base.py                  # Abstract LLM provider
│   ├── anthropic_provider.py   # Claude
│   ├── openai_provider.py      # GPT
│   ├── ollama_provider.py      # Local
│   ├── groq_provider.py        # Groq
│   ├── google_provider.py      # Gemini
│   └── factory.py               # Provider factory
│
├── agents/
│   ├── __init__.py
│   ├── faction_agent.py         # Individual faction AI
│   ├── personality.py           # Faction personalities
│   ├── memory.py                # Faction memory management
│   └── prompts/
│       ├── base_prompt.py
│       ├── military_prompt.py
│       ├── diplomacy_prompt.py
│       └── faction_specific/
│           ├── davion.py
│           ├── liao.py
│           └── ...
│
├── planning/
│   ├── __init__.py
│   ├── operational_period.py    # 30-day planning cycle
│   ├── decision_queue.py        # Pending decisions
│   ├── execution.py             # Decision execution
│   └── reactive.py              # Mid-turn reactions (fast factions)
│
├── state/
│   ├── __init__.py
│   ├── galaxy_state.py          # System ownership, forces
│   ├── diplomatic_state.py      # Treaties, trust
│   ├── faction_memory.py        # Per-faction continuity
│   └── persistence.py           # JSON save/load
│
├── cost/
│   ├── __init__.py
│   ├── estimator.py             # Cost calculation
│   └── pricing.py               # Provider pricing data
│
└── tests/
    └── ...
```

### 4.2 API Endpoints

```python
# main.py - FastAPI Application

from fastapi import FastAPI
from api.routes import router

app = FastAPI(
    title="AIEmpires AI Service",
    version="1.0.0",
    description="LLM-powered faction AI for BattleTech"
)

app.include_router(router, prefix="/api")

# Endpoints:

# Configuration
POST   /api/config/provider          # Set LLM provider
POST   /api/config/api-key           # Set API key (encrypted)
POST   /api/config/faction-tier      # Set faction tier (5/15/25+)
GET    /api/config                   # Get current config

# State Management
POST   /api/state/update             # Push game state from C# mod
GET    /api/state/current            # Get current state
POST   /api/state/save               # Force save to disk
POST   /api/state/load               # Load from disk

# Decisions
GET    /api/decisions/{month}        # Get decisions for month
POST   /api/decisions/execute        # Mark decisions as executed
GET    /api/decisions/pending        # Get pending decision queue

# Planning
POST   /api/planning/trigger         # Trigger planning cycle
GET    /api/planning/status          # Get planning status
POST   /api/planning/event           # Notify of major event (reactive)

# Cost Estimation
GET    /api/cost/estimate            # Get cost estimate
GET    /api/cost/providers           # Get all provider pricing

# Health
GET    /api/health                   # Service health check
GET    /api/provider/test            # Test LLM connection
```

### 4.3 Faction Agent Architecture

```python
# agents/faction_agent.py

from dataclasses import dataclass
from typing import Optional, List, Dict
from providers.base import LLMProvider
from state.faction_memory import FactionMemory

@dataclass
class FactionTraits:
    """Faction personality and behavior modifiers"""
    name: str
    leader_name: str
    leader_title: str

    # Personality scores (0.0 to 1.0)
    honor: float
    aggression: float
    diplomacy: float
    opportunism: float
    defensiveness: float

    # Behavioral flags
    reaction_speed: str          # "very_slow", "slow", "normal", "fast"
    mid_turn_adjustments: bool   # Can react to major events

    # Lore
    personality_description: str
    speaking_style: str
    key_relationships: Dict[str, str]  # faction -> relationship description


class FactionAgent:
    """
    Represents a single AI-controlled faction.
    Each agent maintains isolated state and makes decisions independently.
    """

    def __init__(
        self,
        faction_id: str,
        traits: FactionTraits,
        memory: FactionMemory,
        provider: LLMProvider
    ):
        self.faction_id = faction_id
        self.traits = traits
        self.memory = memory
        self.provider = provider

    def plan_operational_period(
        self,
        visible_state: dict,
        current_month: int
    ) -> dict:
        """
        Generate a 30-day plan for this faction.

        Args:
            visible_state: Game state filtered to what this faction knows
            current_month: The month being planned for

        Returns:
            Dictionary of decisions for the month
        """
        # Build the prompt with faction personality and memory
        prompt = self._build_planning_prompt(visible_state, current_month)

        # Query LLM (isolated call - no cross-faction contamination)
        response = self.provider.generate(
            system_prompt=self._get_system_prompt(),
            user_message=prompt,
            temperature=0.7,
            max_tokens=2000
        )

        # Parse and validate decisions
        decisions = self._parse_decisions(response.content)

        # Update faction memory
        self.memory.record_decisions(decisions, current_month)

        return decisions

    def react_to_event(
        self,
        event: dict,
        visible_state: dict
    ) -> Optional[dict]:
        """
        React to a major event mid-turn (only for fast-reaction factions).
        """
        if not self.traits.mid_turn_adjustments:
            return None  # This faction doesn't react mid-turn

        if not self._is_event_significant(event):
            return None  # Event not significant enough

        # Generate reactive decision
        prompt = self._build_reaction_prompt(event, visible_state)
        response = self.provider.generate(
            system_prompt=self._get_system_prompt(),
            user_message=prompt,
            temperature=0.5,  # Lower temp for reactive decisions
            max_tokens=500
        )

        return self._parse_reaction(response.content)

    def _build_planning_prompt(self, visible_state: dict, month: int) -> str:
        """Build the planning prompt with full context."""
        return f"""
# OPERATIONAL PLANNING - MONTH {month}

You are {self.traits.leader_name}, {self.traits.leader_title} of {self.traits.name}.

## YOUR PERSONALITY
{self.traits.personality_description}

Speaking style: {self.traits.speaking_style}

## YOUR CURRENT SITUATION

### Intelligence Reports
{self._format_intelligence(visible_state)}

### Your Resources
{self._format_resources(visible_state)}

### Your Military Forces
{self._format_military(visible_state)}

### Diplomatic Status
{self._format_diplomacy(visible_state)}

### Recent Events
{self._format_recent_events(visible_state)}

## YOUR MEMORY

### Previous Decisions
{self.memory.format_recent_decisions()}

### Standing Strategic Goals
{self.memory.format_goals()}

### Relationships You've Established
{self.memory.format_relationships()}

### Grudges and Debts
{self.memory.format_grudges()}

## YOUR TASK

Plan the next 30 days for {self.traits.name}. Consider:

1. MILITARY: Should you attack, defend, or raid? Which systems? With what forces?
2. DIPLOMACY: Should you propose treaties, break alliances, or negotiate?
3. ECONOMY: How should you allocate resources?
4. INTELLIGENCE: What should your spies focus on?

Remember your personality:
- Honor: {self.traits.honor:.1f}/1.0 - {"Keep your word" if self.traits.honor > 0.6 else "Promises are tools"}
- Aggression: {self.traits.aggression:.1f}/1.0
- Opportunism: {self.traits.opportunism:.1f}/1.0

Respond with your decisions in the following JSON format:
```json
{{
    "reasoning": "Brief explanation of your strategic thinking",
    "military_orders": [
        {{"action": "attack|defend|raid|garrison|withdraw", "target": "system_id", "forces": ["unit_id"], "priority": 1-10}}
    ],
    "diplomatic_actions": [
        {{"action": "propose_treaty|break_treaty|demand|offer", "target_faction": "faction_id", "details": {{}}}}
    ],
    "resource_allocation": {{
        "military": 0.0-1.0,
        "economy": 0.0-1.0,
        "intelligence": 0.0-1.0
    }},
    "intelligence_priorities": ["faction_id or system_id"],
    "strategic_goals_update": ["Updated goals for next period"]
}}
```
"""

    def _get_system_prompt(self) -> str:
        """Get the system prompt for this faction."""
        return f"""You are roleplaying as {self.traits.leader_name}, the leader of {self.traits.name} in the BattleTech universe.

CRITICAL RULES:
1. You ONLY know what your intelligence reports tell you. Do not assume knowledge of other factions' plans.
2. Stay in character. Your decisions should reflect your personality traits.
3. Be consistent with your previous decisions (see your memory section).
4. Respond ONLY with valid JSON in the specified format.
5. Your decisions will have real consequences in the game - choose wisely.

Your speaking style: {self.traits.speaking_style}

Key personality notes:
{self.traits.personality_description}
"""
```

---

## 5. Game Integration (C# Mod)

### 5.1 Mod Structure

```
Mods/AIEmpires/
├── mod.json
├── AIEmpires.dll
├── config/
│   ├── settings.json
│   └── factions.json
└── src/                         # Source code (for development)
    └── AIEmpires/
        ├── AIEmpires.csproj
        ├── Main.cs              # Mod entry point
        ├── Settings.cs          # Configuration
        │
        ├── Integration/
        │   ├── AIServiceClient.cs    # HTTP client to AI service
        │   ├── StateExporter.cs      # Export game state
        │   └── DecisionExecutor.cs   # Execute AI decisions
        │
        ├── Patches/
        │   ├── SimGamePatches.cs     # Hook into SimGame events
        │   ├── TimeSkipPatches.cs    # Hook into time advancement
        │   └── ContractPatches.cs    # Hook into contracts
        │
        ├── State/
        │   ├── GalaxyStateReader.cs  # Read current game state
        │   ├── FactionStateReader.cs # Read faction data
        │   └── PlayerStateReader.cs  # Read player data
        │
        └── WIIC/
            ├── WIICIntegration.cs    # WarTechIIC hooks
            └── StatModifier.cs       # Apply WIIC stat changes
```

### 5.2 Core C# Classes

```csharp
// Main.cs - Mod Entry Point

using System;
using Harmony;
using Newtonsoft.Json;

namespace AIEmpires
{
    public class Main
    {
        public static Settings Settings;
        public static AIServiceClient AIService;
        internal static HarmonyInstance Harmony;

        public static void Init(string directory, string settingsJSON)
        {
            try
            {
                Settings = JsonConvert.DeserializeObject<Settings>(settingsJSON);
                AIService = new AIServiceClient(Settings.AIServiceUrl);

                Harmony = HarmonyInstance.Create("com.aiempires.mod");
                Harmony.PatchAll(typeof(Main).Assembly);

                Logger.Log("AIEmpires initialized successfully");
            }
            catch (Exception e)
            {
                Logger.LogError("Failed to initialize AIEmpires", e);
            }
        }
    }
}

// Integration/AIServiceClient.cs

using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace AIEmpires.Integration
{
    public class AIServiceClient
    {
        private readonly HttpClient _client;
        private readonly string _baseUrl;

        public AIServiceClient(string baseUrl)
        {
            _baseUrl = baseUrl;
            _client = new HttpClient();
            _client.Timeout = TimeSpan.FromSeconds(30);
        }

        public async Task<bool> PushGameState(GameStateExport state)
        {
            var json = JsonConvert.SerializeObject(state);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync($"{_baseUrl}/api/state/update", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<MonthlyDecisions> GetDecisions(int month)
        {
            var response = await _client.GetAsync($"{_baseUrl}/api/decisions/{month}");
            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<MonthlyDecisions>(json);
        }

        public async Task NotifyEvent(GameEvent evt)
        {
            var json = JsonConvert.SerializeObject(evt);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            await _client.PostAsync($"{_baseUrl}/api/planning/event", content);
        }
    }
}

// Patches/SimGamePatches.cs

using System;
using Harmony;
using BattleTech;

namespace AIEmpires.Patches
{
    [HarmonyPatch(typeof(SimGameState), "OnDayPassed")]
    public static class OnDayPassed_Patch
    {
        public static void Postfix(SimGameState __instance)
        {
            int currentDay = __instance.DaysPassed;

            // Check if we've hit a month boundary
            if (currentDay % 30 == 0)
            {
                int currentMonth = currentDay / 30;

                // Export current state to AI service
                var stateExporter = new StateExporter(__instance);
                var gameState = stateExporter.ExportFullState();

                Task.Run(async () =>
                {
                    await Main.AIService.PushGameState(gameState);

                    // Get decisions for this month (planned last month)
                    var decisions = await Main.AIService.GetDecisions(currentMonth);

                    // Execute decisions on main thread
                    UnityMainThreadDispatcher.Instance.Enqueue(() =>
                    {
                        var executor = new DecisionExecutor(__instance);
                        executor.ExecuteDecisions(decisions);
                    });
                });
            }
        }
    }
}

// WIIC/WIICIntegration.cs

using System;
using BattleTech;

namespace AIEmpires.WIIC
{
    public class WIICIntegration
    {
        private readonly SimGameState _sim;

        public WIICIntegration(SimGameState sim)
        {
            _sim = sim;
        }

        public void ForceAttack(string attackerFaction, string targetSystem)
        {
            string statName = $"WIIC_{attackerFaction}_attacks_{targetSystem}";
            _sim.CompanyStats.Set<bool>(statName, true);
        }

        public void SetAttackStrength(string faction, int strength)
        {
            string statName = $"WIIC_{faction}_attack_strength";
            _sim.CompanyStats.Set<int>(statName, strength);
        }

        public void SetHatred(string attackerFaction, string targetFaction, float multiplier)
        {
            string statName = $"WIIC_{attackerFaction}_hates_{targetFaction}";
            _sim.CompanyStats.Set<float>(statName, multiplier);
        }

        public void SetAggression(string faction, float multiplier)
        {
            string statName = $"WIIC_{faction}_aggression";
            _sim.CompanyStats.Set<float>(statName, multiplier);
        }
    }
}
```

---

## 6. Data Schemas

### 6.1 Game State Export Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "GameStateExport",
    "type": "object",
    "properties": {
        "meta": {
            "type": "object",
            "properties": {
                "export_timestamp": {"type": "string", "format": "date-time"},
                "game_day": {"type": "integer"},
                "game_month": {"type": "integer"},
                "game_year": {"type": "integer"},
                "era": {"type": "string"}
            }
        },
        "player": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string"},
                "current_system": {"type": "string"},
                "reputation": {
                    "type": "object",
                    "additionalProperties": {"type": "integer"}
                },
                "cbills": {"type": "integer"},
                "active_contract": {"type": "string"}
            }
        },
        "systems": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "system_id": {"type": "string"},
                    "name": {"type": "string"},
                    "owner": {"type": "string"},
                    "contested": {"type": "boolean"},
                    "active_flareup": {"type": "boolean"},
                    "industry_value": {"type": "integer"},
                    "defense_level": {"type": "integer"}
                }
            }
        },
        "factions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "faction_id": {"type": "string"},
                    "systems_owned": {"type": "integer"},
                    "military_strength": {"type": "integer"},
                    "economy": {"type": "integer"},
                    "morale": {"type": "number"},
                    "active_wars": {"type": "array", "items": {"type": "string"}},
                    "allies": {"type": "array", "items": {"type": "string"}}
                }
            }
        },
        "active_conflicts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "system_id": {"type": "string"},
                    "attacker": {"type": "string"},
                    "defender": {"type": "string"},
                    "attacker_strength": {"type": "integer"},
                    "defender_strength": {"type": "integer"},
                    "days_active": {"type": "integer"}
                }
            }
        },
        "diplomatic_state": {
            "type": "object",
            "properties": {
                "treaties": {"type": "array"},
                "trust_scores": {"type": "object"},
                "pending_proposals": {"type": "array"}
            }
        }
    }
}
```

### 6.2 Faction Memory Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "FactionMemory",
    "type": "object",
    "properties": {
        "faction_id": {"type": "string"},
        "last_updated": {"type": "string", "format": "date-time"},

        "personality": {
            "type": "object",
            "properties": {
                "honor": {"type": "number", "minimum": 0, "maximum": 1},
                "aggression": {"type": "number", "minimum": 0, "maximum": 1},
                "diplomacy": {"type": "number", "minimum": 0, "maximum": 1},
                "opportunism": {"type": "number", "minimum": 0, "maximum": 1},
                "defensiveness": {"type": "number", "minimum": 0, "maximum": 1}
            }
        },

        "decision_history": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "month": {"type": "integer"},
                    "decisions": {"type": "object"},
                    "outcomes": {"type": "object"},
                    "reasoning": {"type": "string"}
                }
            },
            "maxItems": 12
        },

        "strategic_goals": {
            "type": "array",
            "items": {"type": "string"}
        },

        "relationship_notes": {
            "type": "object",
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "trust": {"type": "integer"},
                    "notes": {"type": "string"},
                    "last_interaction": {"type": "string"}
                }
            }
        },

        "grudges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "target_faction": {"type": "string"},
                    "reason": {"type": "string"},
                    "severity": {"type": "integer"},
                    "month_incurred": {"type": "integer"}
                }
            }
        },

        "pending_plans": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "month": {"type": "integer"},
                    "plan_type": {"type": "string"},
                    "details": {"type": "object"}
                }
            }
        }
    }
}
```

### 6.3 Monthly Decisions Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "MonthlyDecisions",
    "type": "object",
    "properties": {
        "month": {"type": "integer"},
        "planning_timestamp": {"type": "string", "format": "date-time"},

        "faction_decisions": {
            "type": "object",
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "reasoning": {"type": "string"},

                    "military_orders": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "action": {
                                    "type": "string",
                                    "enum": ["attack", "defend", "raid", "garrison", "withdraw", "reinforce"]
                                },
                                "target_system": {"type": "string"},
                                "origin_system": {"type": "string"},
                                "forces": {"type": "array", "items": {"type": "string"}},
                                "strength_commitment": {"type": "integer"},
                                "priority": {"type": "integer", "minimum": 1, "maximum": 10}
                            }
                        }
                    },

                    "diplomatic_actions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "action": {
                                    "type": "string",
                                    "enum": ["propose_nap", "propose_alliance", "propose_trade",
                                             "break_treaty", "declare_war", "sue_for_peace",
                                             "demand_tribute", "offer_tribute"]
                                },
                                "target_faction": {"type": "string"},
                                "treaty_type": {"type": "string"},
                                "terms": {"type": "object"}
                            }
                        }
                    },

                    "resource_allocation": {
                        "type": "object",
                        "properties": {
                            "military_percentage": {"type": "number"},
                            "economy_percentage": {"type": "number"},
                            "intelligence_percentage": {"type": "number"},
                            "research_percentage": {"type": "number"}
                        }
                    },

                    "intelligence_focus": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                }
            }
        }
    }
}
```

---

## 7. Operational Period Planning

### 7.1 Planning Cycle Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPERATIONAL PERIOD PLANNING CYCLE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   MONTH N-1         MONTH N              MONTH N+1           MONTH N+2      │
│   (History)         (Current)            (Planning)          (Future)       │
│       │                 │                    │                   │          │
│       ▼                 ▼                    ▼                   ▼          │
│   ┌───────┐         ┌───────┐           ┌───────┐           ┌───────┐      │
│   │       │         │       │           │       │           │       │      │
│   │Decided│         │Execute│           │ Plan  │           │       │      │
│   │  and  │────────►│ N's   │           │ N+1   │           │(Queue)│      │
│   │Executed         │Decisions           │Decisions          │       │      │
│   │       │         │       │           │       │           │       │      │
│   └───────┘         └───┬───┘           └───┬───┘           └───────┘      │
│                         │                   │                               │
│                         │                   │                               │
│   ┌─────────────────────┼───────────────────┼─────────────────────────┐    │
│   │                     │                   │                          │    │
│   │    PLAYER IS        ▼                   ▼         AI SERVICE       │    │
│   │    PLAYING      Day 1-30          Background      PLANNING         │    │
│   │    HERE         of Month N        Thread          NEXT MONTH       │    │
│   │                                                                    │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                                                                              │
│   WHEN MONTH N ENDS:                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1. Export final state of Month N                                   │   │
│   │  2. Month N+1 decisions (already planned) become "current"          │   │
│   │  3. Start executing Month N+1 decisions                             │   │
│   │  4. Begin planning Month N+2 in background                          │   │
│   │  5. Player continues playing                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Faction Reaction Speed System

```python
# planning/operational_period.py

from enum import Enum
from dataclasses import dataclass
from typing import List, Optional

class ReactionSpeed(Enum):
    VERY_SLOW = "very_slow"    # 45-day effective planning (Periphery)
    SLOW = "slow"              # 35-day effective planning (Capellan)
    NORMAL = "normal"          # 30-day standard planning
    FAST = "fast"              # 25-day effective, can react mid-turn

@dataclass
class FactionReactivity:
    faction_id: str
    reaction_speed: ReactionSpeed
    can_react_mid_turn: bool
    reaction_triggers: List[str]  # Events that trigger mid-turn reaction

# Faction reactivity configurations
FACTION_REACTIVITY = {
    # Great Houses
    "Davion": FactionReactivity(
        faction_id="Davion",
        reaction_speed=ReactionSpeed.NORMAL,
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),
    "Steiner": FactionReactivity(
        faction_id="Steiner",
        reaction_speed=ReactionSpeed.NORMAL,
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),
    "Liao": FactionReactivity(
        faction_id="Liao",
        reaction_speed=ReactionSpeed.SLOW,  # Bureaucratic
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),
    "Marik": FactionReactivity(
        faction_id="Marik",
        reaction_speed=ReactionSpeed.SLOW,  # Internal divisions
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),
    "Kurita": FactionReactivity(
        faction_id="Kurita",
        reaction_speed=ReactionSpeed.NORMAL,
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),

    # Special Factions
    "ComStar": FactionReactivity(
        faction_id="ComStar",
        reaction_speed=ReactionSpeed.FAST,  # HPG network, ROM
        can_react_mid_turn=True,
        reaction_triggers=["capital_attacked", "hpg_destroyed", "major_betrayal"]
    ),

    # Clans
    "Wolf": FactionReactivity(
        faction_id="Wolf",
        reaction_speed=ReactionSpeed.FAST,  # Clan efficiency
        can_react_mid_turn=True,
        reaction_triggers=["trial_called", "ilClan_challenge", "capital_attacked"]
    ),
    "JadeFalcon": FactionReactivity(
        faction_id="JadeFalcon",
        reaction_speed=ReactionSpeed.FAST,
        can_react_mid_turn=True,
        reaction_triggers=["trial_called", "dezgra_detected", "capital_attacked"]
    ),

    # Periphery
    "TaurianConcordat": FactionReactivity(
        faction_id="TaurianConcordat",
        reaction_speed=ReactionSpeed.VERY_SLOW,  # Limited comms
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),
    "MagistracyOfCanopus": FactionReactivity(
        faction_id="MagistracyOfCanopus",
        reaction_speed=ReactionSpeed.VERY_SLOW,
        can_react_mid_turn=False,
        reaction_triggers=[]
    ),
}

class OperationalPeriodManager:
    """Manages the operational period planning cycle."""

    def __init__(self, state_manager, faction_agents):
        self.state_manager = state_manager
        self.faction_agents = faction_agents
        self.decision_queue = {}
        self.current_month = 0

    def advance_to_month(self, month: int):
        """Called when a new month begins."""
        self.current_month = month

        # Execute decisions that were planned last month
        if month in self.decision_queue:
            self._execute_month_decisions(month)

        # Trigger planning for next month (runs in background)
        self._trigger_planning(month + 1)

    def _trigger_planning(self, target_month: int):
        """Start planning for a future month."""
        current_state = self.state_manager.export_state()

        for faction_id, agent in self.faction_agents.items():
            reactivity = FACTION_REACTIVITY.get(faction_id)

            # Filter state to what this faction knows
            visible_state = self._filter_state_for_faction(current_state, faction_id)

            # Get faction's plan
            decisions = agent.plan_operational_period(visible_state, target_month)

            # Queue the decisions
            if target_month not in self.decision_queue:
                self.decision_queue[target_month] = {}
            self.decision_queue[target_month][faction_id] = decisions

    def handle_major_event(self, event: dict):
        """Handle a major event that might trigger mid-turn reactions."""
        event_type = event.get("type")
        affected_factions = event.get("affected_factions", [])

        for faction_id in affected_factions:
            reactivity = FACTION_REACTIVITY.get(faction_id)

            if reactivity and reactivity.can_react_mid_turn:
                if event_type in reactivity.reaction_triggers:
                    # This faction can react to this event
                    agent = self.faction_agents.get(faction_id)
                    if agent:
                        visible_state = self._filter_state_for_faction(
                            self.state_manager.export_state(),
                            faction_id
                        )
                        reaction = agent.react_to_event(event, visible_state)
                        if reaction:
                            self._execute_reaction(faction_id, reaction)
```

---

## 8. LLM Provider System

### 8.1 Provider Pricing Database

```python
# cost/pricing.py

from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class ModelPricing:
    """Pricing for a specific model."""
    model_id: str
    model_name: str
    input_price_per_million: float   # USD per 1M input tokens
    output_price_per_million: float  # USD per 1M output tokens
    context_window: int              # Max tokens
    notes: str = ""

@dataclass
class ProviderInfo:
    """Information about an LLM provider."""
    provider_id: str
    provider_name: str
    api_base_url: str
    requires_api_key: bool
    models: Dict[str, ModelPricing]
    is_local: bool = False

# Provider and model pricing database
# Updated: 2024-12-30
PROVIDERS: Dict[str, ProviderInfo] = {
    "anthropic": ProviderInfo(
        provider_id="anthropic",
        provider_name="Anthropic (Claude)",
        api_base_url="https://api.anthropic.com/v1",
        requires_api_key=True,
        models={
            "claude-sonnet-4-20250514": ModelPricing(
                model_id="claude-sonnet-4-20250514",
                model_name="Claude Sonnet 4",
                input_price_per_million=3.00,
                output_price_per_million=15.00,
                context_window=200000,
                notes="Best balance of quality and cost"
            ),
            "claude-3-5-haiku-20241022": ModelPricing(
                model_id="claude-3-5-haiku-20241022",
                model_name="Claude 3.5 Haiku",
                input_price_per_million=0.80,
                output_price_per_million=4.00,
                context_window=200000,
                notes="Fast and cheap"
            ),
            "claude-3-opus-20240229": ModelPricing(
                model_id="claude-3-opus-20240229",
                model_name="Claude 3 Opus",
                input_price_per_million=15.00,
                output_price_per_million=75.00,
                context_window=200000,
                notes="Highest quality, expensive"
            ),
        }
    ),

    "openai": ProviderInfo(
        provider_id="openai",
        provider_name="OpenAI (GPT)",
        api_base_url="https://api.openai.com/v1",
        requires_api_key=True,
        models={
            "gpt-4o": ModelPricing(
                model_id="gpt-4o",
                model_name="GPT-4o",
                input_price_per_million=2.50,
                output_price_per_million=10.00,
                context_window=128000,
                notes="Fast, multimodal"
            ),
            "gpt-4o-mini": ModelPricing(
                model_id="gpt-4o-mini",
                model_name="GPT-4o Mini",
                input_price_per_million=0.15,
                output_price_per_million=0.60,
                context_window=128000,
                notes="Very cheap, good for testing"
            ),
            "gpt-4-turbo": ModelPricing(
                model_id="gpt-4-turbo",
                model_name="GPT-4 Turbo",
                input_price_per_million=10.00,
                output_price_per_million=30.00,
                context_window=128000,
                notes="Previous generation"
            ),
        }
    ),

    "groq": ProviderInfo(
        provider_id="groq",
        provider_name="Groq",
        api_base_url="https://api.groq.com/openai/v1",
        requires_api_key=True,
        models={
            "llama-3.1-70b-versatile": ModelPricing(
                model_id="llama-3.1-70b-versatile",
                model_name="Llama 3.1 70B",
                input_price_per_million=0.59,
                output_price_per_million=0.79,
                context_window=131072,
                notes="Very fast inference"
            ),
            "llama-3.1-8b-instant": ModelPricing(
                model_id="llama-3.1-8b-instant",
                model_name="Llama 3.1 8B",
                input_price_per_million=0.05,
                output_price_per_million=0.08,
                context_window=131072,
                notes="Extremely cheap"
            ),
            "mixtral-8x7b-32768": ModelPricing(
                model_id="mixtral-8x7b-32768",
                model_name="Mixtral 8x7B",
                input_price_per_million=0.24,
                output_price_per_million=0.24,
                context_window=32768,
                notes="Good quality/price"
            ),
        }
    ),

    "google": ProviderInfo(
        provider_id="google",
        provider_name="Google (Gemini)",
        api_base_url="https://generativelanguage.googleapis.com/v1beta",
        requires_api_key=True,
        models={
            "gemini-1.5-pro": ModelPricing(
                model_id="gemini-1.5-pro",
                model_name="Gemini 1.5 Pro",
                input_price_per_million=1.25,
                output_price_per_million=5.00,
                context_window=2000000,
                notes="Huge context window"
            ),
            "gemini-1.5-flash": ModelPricing(
                model_id="gemini-1.5-flash",
                model_name="Gemini 1.5 Flash",
                input_price_per_million=0.075,
                output_price_per_million=0.30,
                context_window=1000000,
                notes="Fast and cheap"
            ),
        }
    ),

    "ollama": ProviderInfo(
        provider_id="ollama",
        provider_name="Ollama (Local)",
        api_base_url="http://localhost:11434",
        requires_api_key=False,
        is_local=True,
        models={
            "llama3.1": ModelPricing(
                model_id="llama3.1",
                model_name="Llama 3.1 (8B)",
                input_price_per_million=0.0,
                output_price_per_million=0.0,
                context_window=128000,
                notes="Free, runs locally"
            ),
            "llama3.1:70b": ModelPricing(
                model_id="llama3.1:70b",
                model_name="Llama 3.1 (70B)",
                input_price_per_million=0.0,
                output_price_per_million=0.0,
                context_window=128000,
                notes="Free, requires 48GB+ RAM"
            ),
            "mistral": ModelPricing(
                model_id="mistral",
                model_name="Mistral 7B",
                input_price_per_million=0.0,
                output_price_per_million=0.0,
                context_window=32000,
                notes="Free, fast"
            ),
        }
    ),
}

def get_provider(provider_id: str) -> Optional[ProviderInfo]:
    return PROVIDERS.get(provider_id)

def get_model_pricing(provider_id: str, model_id: str) -> Optional[ModelPricing]:
    provider = get_provider(provider_id)
    if provider:
        return provider.models.get(model_id)
    return None

def list_all_providers() -> Dict[str, ProviderInfo]:
    return PROVIDERS
```

### 8.2 Provider Interface

```python
# providers/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class LLMResponse:
    """Response from an LLM provider."""
    content: str
    model: str
    provider: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    raw_response: Optional[Dict[str, Any]] = None

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    def generate(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> LLMResponse:
        """Generate a response from the LLM."""
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """Test if the provider is accessible."""
        pass

    @abstractmethod
    def get_available_models(self) -> list[str]:
        """List available models for this provider."""
        pass

# providers/anthropic_provider.py

import anthropic
import time
from .base import LLMProvider, LLMResponse

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def generate(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> LLMResponse:
        start_time = time.time()

        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )

        latency = (time.time() - start_time) * 1000

        return LLMResponse(
            content=response.content[0].text,
            model=self.model,
            provider="anthropic",
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            latency_ms=latency,
            raw_response=response.model_dump()
        )

    def validate_connection(self) -> bool:
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hi"}]
            )
            return True
        except Exception:
            return False

    def get_available_models(self) -> list[str]:
        return ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"]

# providers/ollama_provider.py

import requests
import time
from .base import LLMProvider, LLMResponse

class OllamaProvider(LLMProvider):
    def __init__(self, model: str = "llama3.1", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    def generate(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> LLMResponse:
        start_time = time.time()

        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": f"{system_prompt}\n\n{user_message}",
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
        )

        latency = (time.time() - start_time) * 1000
        data = response.json()

        return LLMResponse(
            content=data["response"],
            model=self.model,
            provider="ollama",
            input_tokens=data.get("prompt_eval_count", 0),
            output_tokens=data.get("eval_count", 0),
            latency_ms=latency,
            raw_response=data
        )

    def validate_connection(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception:
            return False

    def get_available_models(self) -> list[str]:
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except Exception:
            return []

# providers/factory.py

from typing import Optional
from .base import LLMProvider
from .anthropic_provider import AnthropicProvider
from .openai_provider import OpenAIProvider
from .ollama_provider import OllamaProvider
from .groq_provider import GroqProvider
from .google_provider import GoogleProvider

def create_provider(
    provider_id: str,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> LLMProvider:
    """Factory function to create LLM providers."""

    if provider_id == "anthropic":
        return AnthropicProvider(
            api_key=api_key,
            model=model or "claude-sonnet-4-20250514"
        )
    elif provider_id == "openai":
        return OpenAIProvider(
            api_key=api_key,
            model=model or "gpt-4o"
        )
    elif provider_id == "ollama":
        return OllamaProvider(
            model=model or "llama3.1"
        )
    elif provider_id == "groq":
        return GroqProvider(
            api_key=api_key,
            model=model or "llama-3.1-70b-versatile"
        )
    elif provider_id == "google":
        return GoogleProvider(
            api_key=api_key,
            model=model or "gemini-1.5-pro"
        )
    else:
        raise ValueError(f"Unknown provider: {provider_id}")
```

---

## 9. Cost Estimation System

### 9.1 Cost Estimator

```python
# cost/estimator.py

from dataclasses import dataclass
from typing import Dict
from .pricing import get_model_pricing, PROVIDERS

@dataclass
class CostEstimate:
    """Cost estimate for a game session."""
    provider_id: str
    model_id: str
    faction_count: int

    input_tokens_per_decision: int
    output_tokens_per_decision: int

    cost_per_decision: float
    cost_per_faction_month: float
    cost_per_game_month: float
    cost_per_50_months: float
    cost_per_100_months: float

    is_free: bool
    notes: str

# Faction tier definitions
FACTION_TIERS = {
    "essential": {
        "name": "Essential",
        "count": 5,
        "factions": ["Davion", "Steiner", "Liao", "Marik", "Kurita"],
        "description": "Great Houses only"
    },
    "major": {
        "name": "Major",
        "count": 15,
        "factions": [
            "Davion", "Steiner", "Liao", "Marik", "Kurita",
            "ComStar", "Wolf", "JadeFalcon", "GhostBear", "SmokeJaguar",
            "FreeRasalhague", "TaurianConcordat", "MagistracyOfCanopus",
            "OutworldsAlliance", "Circinus"
        ],
        "description": "Great Houses + Clans + Major Periphery"
    },
    "full": {
        "name": "Full",
        "count": 25,
        "factions": [
            # All from major tier plus:
            "WordOfBlake", "NovaCat", "DiamondShark", "SteelViper",
            "Marian", "Lothian", "Illyrian", "Oberon",
            "Chainelane", "Circinus"
        ],
        "description": "All factions including minor Periphery"
    }
}

# Average token counts based on testing
AVERAGE_INPUT_TOKENS = 1500   # Context, state, personality
AVERAGE_OUTPUT_TOKENS = 500   # Decision JSON

def estimate_cost(
    provider_id: str,
    model_id: str,
    faction_tier: str
) -> CostEstimate:
    """
    Calculate cost estimate for the given configuration.
    """
    pricing = get_model_pricing(provider_id, model_id)
    tier = FACTION_TIERS.get(faction_tier)

    if not pricing or not tier:
        raise ValueError(f"Invalid provider/model/tier combination")

    faction_count = tier["count"]

    # Cost per single decision (one faction, one month)
    input_cost = (AVERAGE_INPUT_TOKENS / 1_000_000) * pricing.input_price_per_million
    output_cost = (AVERAGE_OUTPUT_TOKENS / 1_000_000) * pricing.output_price_per_million
    cost_per_decision = input_cost + output_cost

    # Cost per game month (all factions decide)
    cost_per_game_month = cost_per_decision * faction_count

    return CostEstimate(
        provider_id=provider_id,
        model_id=model_id,
        faction_count=faction_count,
        input_tokens_per_decision=AVERAGE_INPUT_TOKENS,
        output_tokens_per_decision=AVERAGE_OUTPUT_TOKENS,
        cost_per_decision=cost_per_decision,
        cost_per_faction_month=cost_per_decision,
        cost_per_game_month=cost_per_game_month,
        cost_per_50_months=cost_per_game_month * 50,
        cost_per_100_months=cost_per_game_month * 100,
        is_free=pricing.input_price_per_million == 0,
        notes=pricing.notes
    )

def get_all_estimates(faction_tier: str) -> Dict[str, Dict[str, CostEstimate]]:
    """Get cost estimates for all providers and models."""
    estimates = {}

    for provider_id, provider in PROVIDERS.items():
        estimates[provider_id] = {}
        for model_id in provider.models:
            try:
                estimates[provider_id][model_id] = estimate_cost(
                    provider_id, model_id, faction_tier
                )
            except Exception:
                pass

    return estimates
```

### 9.2 Cost Display Component (React)

```typescript
// renderer/components/CostEstimator.tsx

import React, { useState, useEffect } from 'react';

interface CostEstimate {
    provider_id: string;
    model_id: string;
    faction_count: number;
    cost_per_game_month: number;
    cost_per_50_months: number;
    cost_per_100_months: number;
    is_free: boolean;
    notes: string;
}

interface Props {
    providerId: string;
    modelId: string;
    factionTier: string;
}

export const CostEstimator: React.FC<Props> = ({ providerId, modelId, factionTier }) => {
    const [estimate, setEstimate] = useState<CostEstimate | null>(null);

    useEffect(() => {
        // Fetch estimate from AI service
        fetch(`http://localhost:5000/api/cost/estimate?provider=${providerId}&model=${modelId}&tier=${factionTier}`)
            .then(res => res.json())
            .then(data => setEstimate(data))
            .catch(err => console.error(err));
    }, [providerId, modelId, factionTier]);

    if (!estimate) return <div>Calculating...</div>;

    return (
        <div className="cost-estimator">
            <h3>Estimated Costs</h3>

            <div className="cost-row">
                <span className="label">Provider:</span>
                <span className="value">{estimate.provider_id}</span>
            </div>

            <div className="cost-row">
                <span className="label">Model:</span>
                <span className="value">{estimate.model_id}</span>
            </div>

            <div className="cost-row">
                <span className="label">Factions:</span>
                <span className="value">{estimate.faction_count}</span>
            </div>

            <hr />

            {estimate.is_free ? (
                <div className="cost-free">
                    <span className="free-badge">FREE</span>
                    <span>Local model - no API costs</span>
                </div>
            ) : (
                <>
                    <div className="cost-row">
                        <span className="label">Per game-month:</span>
                        <span className="value">${estimate.cost_per_game_month.toFixed(2)}</span>
                    </div>

                    <div className="cost-row">
                        <span className="label">Per 50 months:</span>
                        <span className="value">${estimate.cost_per_50_months.toFixed(2)}</span>
                    </div>

                    <div className="cost-row">
                        <span className="label">Per 100 months:</span>
                        <span className="value">${estimate.cost_per_100_months.toFixed(2)}</span>
                    </div>
                </>
            )}

            <div className="cost-notes">
                <small>{estimate.notes}</small>
                <small>(Based on ~2000 tokens per faction decision)</small>
            </div>
        </div>
    );
};
```

---

## 10. State Persistence

### 10.1 Save File Structure

```
BATTLETECH/Mods/AIEmpires/saves/
├── {save_game_id}/                    # Matches BattleTech save ID
│   ├── meta.json                      # Save metadata
│   ├── galaxy_state.json              # Current galaxy state
│   ├── diplomatic_state.json          # Treaties, trust scores
│   ├── military_state.json            # Unit positions, supply
│   ├── resource_state.json            # Faction economies
│   │
│   ├── faction_memory/                # Per-faction continuity
│   │   ├── davion.json
│   │   ├── liao.json
│   │   ├── wolf.json
│   │   └── ...
│   │
│   ├── decisions/                     # Decision queues
│   │   ├── pending.json               # Decisions waiting to execute
│   │   ├── month_042.json             # Archive of month 42 decisions
│   │   ├── month_043.json
│   │   └── ...
│   │
│   └── logs/                          # History and debugging
│       ├── execution_log.json         # What was executed
│       ├── llm_responses/             # Raw LLM responses (debug)
│       │   ├── month_042_davion.json
│       │   └── ...
│       └── events.json                # Event history
│
└── config.json                        # Global AIEmpires config
```

### 10.2 Persistence Manager

```python
# state/persistence.py

import json
import os
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path

class PersistenceManager:
    """Manages saving and loading AIEmpires state."""

    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.current_save_id: Optional[str] = None

    def set_save_id(self, save_id: str):
        """Set the current save game ID."""
        self.current_save_id = save_id
        self._ensure_directories()

    def _get_save_path(self) -> Path:
        return self.base_path / "saves" / self.current_save_id

    def _ensure_directories(self):
        """Create necessary directories."""
        save_path = self._get_save_path()
        (save_path / "faction_memory").mkdir(parents=True, exist_ok=True)
        (save_path / "decisions").mkdir(parents=True, exist_ok=True)
        (save_path / "logs" / "llm_responses").mkdir(parents=True, exist_ok=True)

    # Galaxy State
    def save_galaxy_state(self, state: dict):
        path = self._get_save_path() / "galaxy_state.json"
        self._save_json(path, state)

    def load_galaxy_state(self) -> Optional[dict]:
        path = self._get_save_path() / "galaxy_state.json"
        return self._load_json(path)

    # Diplomatic State
    def save_diplomatic_state(self, state: dict):
        path = self._get_save_path() / "diplomatic_state.json"
        self._save_json(path, state)

    def load_diplomatic_state(self) -> Optional[dict]:
        path = self._get_save_path() / "diplomatic_state.json"
        return self._load_json(path)

    # Faction Memory
    def save_faction_memory(self, faction_id: str, memory: dict):
        path = self._get_save_path() / "faction_memory" / f"{faction_id.lower()}.json"
        self._save_json(path, memory)

    def load_faction_memory(self, faction_id: str) -> Optional[dict]:
        path = self._get_save_path() / "faction_memory" / f"{faction_id.lower()}.json"
        return self._load_json(path)

    def load_all_faction_memories(self) -> Dict[str, dict]:
        memories = {}
        memory_path = self._get_save_path() / "faction_memory"
        if memory_path.exists():
            for file in memory_path.glob("*.json"):
                faction_id = file.stem
                memories[faction_id] = self._load_json(file)
        return memories

    # Decisions
    def save_pending_decisions(self, decisions: dict):
        path = self._get_save_path() / "decisions" / "pending.json"
        self._save_json(path, decisions)

    def load_pending_decisions(self) -> Optional[dict]:
        path = self._get_save_path() / "decisions" / "pending.json"
        return self._load_json(path)

    def archive_month_decisions(self, month: int, decisions: dict):
        path = self._get_save_path() / "decisions" / f"month_{month:03d}.json"
        self._save_json(path, decisions)

    # LLM Response Logging (for debugging)
    def log_llm_response(self, month: int, faction_id: str, response: dict):
        path = self._get_save_path() / "logs" / "llm_responses" / f"month_{month:03d}_{faction_id.lower()}.json"
        self._save_json(path, response)

    # Utility methods
    def _save_json(self, path: Path, data: Any):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)

    def _load_json(self, path: Path) -> Optional[Any]:
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None

    def save_all(
        self,
        galaxy_state: dict,
        diplomatic_state: dict,
        faction_memories: Dict[str, dict],
        pending_decisions: dict
    ):
        """Save all state at once (for consistency)."""
        self.save_galaxy_state(galaxy_state)
        self.save_diplomatic_state(diplomatic_state)
        for faction_id, memory in faction_memories.items():
            self.save_faction_memory(faction_id, memory)
        self.save_pending_decisions(pending_decisions)

        # Update meta
        meta = {
            "last_saved": datetime.now().isoformat(),
            "save_id": self.current_save_id,
            "version": "1.0.0"
        }
        self._save_json(self._get_save_path() / "meta.json", meta)
```

---

## 11. Distribution & Updates

### 11.1 Manifest Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "AIEmpires Mod Manifest",
    "type": "object",
    "properties": {
        "manifest_version": {"type": "string"},
        "last_updated": {"type": "string", "format": "date-time"},

        "launcher": {
            "type": "object",
            "properties": {
                "current_version": {"type": "string"},
                "download_url": {"type": "string"},
                "changelog_url": {"type": "string"}
            }
        },

        "core_bundle": {
            "type": "object",
            "properties": {
                "version": {"type": "string"},
                "download_url": {"type": "string"},
                "sha256": {"type": "string"},
                "size_mb": {"type": "number"}
            }
        },

        "mods": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "version": {"type": "string"},
                    "source_url": {"type": "string"},
                    "download_url": {"type": "string"},
                    "sha256": {"type": "string"},
                    "tier": {
                        "type": "string",
                        "enum": ["framework", "core", "content", "optional"]
                    },
                    "dependencies": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                }
            }
        }
    }
}
```

### 11.2 Example Manifest

```json
{
    "manifest_version": "1.0.0",
    "last_updated": "2024-12-30T00:00:00Z",

    "launcher": {
        "current_version": "1.0.0",
        "download_url": "https://github.com/YourUsername/AIEmpires/releases/download/v1.0.0/AIEmpires-Launcher-Setup.exe",
        "changelog_url": "https://github.com/YourUsername/AIEmpires/blob/main/CHANGELOG.md"
    },

    "core_bundle": {
        "version": "1.0.0",
        "download_url": "https://github.com/YourUsername/AIEmpires/releases/download/v1.0.0/AIEmpires-Core-Mods.zip",
        "sha256": "abc123...",
        "size_mb": 2500
    },

    "mods": [
        {
            "id": "ModTek",
            "name": "ModTek",
            "version": "4.2.0",
            "source_url": "https://github.com/BattletechModders/ModTek",
            "download_url": "https://github.com/BattletechModders/ModTek/releases/download/v4.2.0/ModTek.zip",
            "sha256": "def456...",
            "tier": "framework",
            "dependencies": []
        },
        {
            "id": "MechEngineer",
            "name": "MechEngineer",
            "version": "2.5.0",
            "source_url": "https://github.com/BattletechModders/MechEngineer",
            "download_url": "https://github.com/BattletechModders/MechEngineer/releases/download/v2.5.0/MechEngineer.zip",
            "sha256": "ghi789...",
            "tier": "core",
            "dependencies": ["ModTek", "CustomComponents"]
        }
    ]
}
```

### 11.3 Update Manager

```typescript
// main/updater.ts

import { autoUpdater } from 'electron-updater';
import { app, dialog, BrowserWindow } from 'electron';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const MANIFEST_URL = 'https://raw.githubusercontent.com/YourUsername/AIEmpires/main/manifest.json';

interface Manifest {
    manifest_version: string;
    launcher: {
        current_version: string;
        download_url: string;
    };
    core_bundle: {
        version: string;
        download_url: string;
        sha256: string;
    };
    mods: ModEntry[];
}

interface ModEntry {
    id: string;
    name: string;
    version: string;
    download_url: string;
    sha256: string;
    tier: string;
    dependencies: string[];
}

export class UpdateManager {
    private mainWindow: BrowserWindow;
    private manifest: Manifest | null = null;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.setupAutoUpdater();
    }

    private setupAutoUpdater() {
        // Launcher auto-update
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;

        autoUpdater.on('update-available', (info) => {
            this.mainWindow.webContents.send('update-available', info);
        });

        autoUpdater.on('update-downloaded', (info) => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Update Ready',
                message: 'A new version has been downloaded. Restart to apply the update.',
                buttons: ['Restart', 'Later']
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
    }

    async checkForUpdates(): Promise<void> {
        // Check launcher updates
        autoUpdater.checkForUpdates();

        // Check mod updates
        await this.fetchManifest();
        await this.checkModUpdates();
    }

    private async fetchManifest(): Promise<void> {
        const response = await axios.get(MANIFEST_URL);
        this.manifest = response.data;
    }

    private async checkModUpdates(): Promise<void> {
        if (!this.manifest) return;

        const installedMods = this.getInstalledMods();
        const updates: ModEntry[] = [];

        for (const mod of this.manifest.mods) {
            const installed = installedMods[mod.id];
            if (!installed || installed.version !== mod.version) {
                updates.push(mod);
            }
        }

        if (updates.length > 0) {
            this.mainWindow.webContents.send('mod-updates-available', updates);
        }
    }

    async downloadAndInstallMod(mod: ModEntry, battleTechPath: string): Promise<boolean> {
        const modsPath = path.join(battleTechPath, 'Mods');
        const tempPath = path.join(app.getPath('temp'), `${mod.id}.zip`);

        try {
            // Download
            const response = await axios.get(mod.download_url, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, response.data);

            // Verify SHA256
            const hash = crypto.createHash('sha256').update(response.data).digest('hex');
            if (hash !== mod.sha256) {
                throw new Error(`SHA256 mismatch for ${mod.name}`);
            }

            // Extract to Mods folder
            await this.extractZip(tempPath, modsPath);

            // Cleanup
            fs.unlinkSync(tempPath);

            return true;
        } catch (error) {
            console.error(`Failed to install ${mod.name}:`, error);
            return false;
        }
    }

    private getInstalledMods(): Record<string, { version: string }> {
        // Read installed mod versions from local config
        // Implementation depends on how we track installed mods
        return {};
    }

    private async extractZip(zipPath: string, destPath: string): Promise<void> {
        // Use a library like 'extract-zip' or 'adm-zip'
        const extract = require('extract-zip');
        await extract(zipPath, { dir: destPath });
    }
}
```

---

## 12. Folder Structures

### 12.1 Complete Project Structure

```
AIEmpires/
├── README.md
├── LICENSE
├── CHANGELOG.md
├── manifest.json                    # Mod distribution manifest
│
├── launcher/                        # Electron launcher application
│   ├── package.json
│   ├── electron-builder.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main/
│   │   │   ├── index.ts
│   │   │   ├── updater.ts
│   │   │   ├── mod-manager.ts
│   │   │   ├── game-detector.ts
│   │   │   └── ai-service.ts
│   │   ├── renderer/
│   │   │   ├── App.tsx
│   │   │   ├── index.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Setup.tsx
│   │   │   │   ├── ModManager.tsx
│   │   │   │   ├── LLMConfig.tsx
│   │   │   │   ├── GameConfig.tsx
│   │   │   │   └── Launch.tsx
│   │   │   ├── components/
│   │   │   │   ├── CostEstimator.tsx
│   │   │   │   ├── ProviderDropdown.tsx
│   │   │   │   ├── FactionTierSelector.tsx
│   │   │   │   └── OllamaInstaller.tsx
│   │   │   └── styles/
│   │   │       └── main.css
│   │   └── preload/
│   │       └── index.ts
│   └── resources/
│       └── icons/
│
├── ai-service/                      # Python AI service
│   ├── requirements.txt
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── models.py
│   │   └── middleware.py
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── anthropic_provider.py
│   │   ├── openai_provider.py
│   │   ├── ollama_provider.py
│   │   ├── groq_provider.py
│   │   ├── google_provider.py
│   │   └── factory.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── faction_agent.py
│   │   ├── personality.py
│   │   ├── memory.py
│   │   └── prompts/
│   │       ├── base_prompt.py
│   │       └── faction_specific/
│   ├── planning/
│   │   ├── __init__.py
│   │   ├── operational_period.py
│   │   ├── decision_queue.py
│   │   └── reactive.py
│   ├── state/
│   │   ├── __init__.py
│   │   ├── galaxy_state.py
│   │   ├── diplomatic_state.py
│   │   ├── faction_memory.py
│   │   └── persistence.py
│   ├── cost/
│   │   ├── __init__.py
│   │   ├── estimator.py
│   │   └── pricing.py
│   └── tests/
│
├── game-mod/                        # C# BattleTech mod
│   ├── AIEmpires.sln
│   ├── AIEmpires/
│   │   ├── AIEmpires.csproj
│   │   ├── Main.cs
│   │   ├── Settings.cs
│   │   ├── Integration/
│   │   │   ├── AIServiceClient.cs
│   │   │   ├── StateExporter.cs
│   │   │   └── DecisionExecutor.cs
│   │   ├── Patches/
│   │   │   ├── SimGamePatches.cs
│   │   │   └── TimeSkipPatches.cs
│   │   ├── State/
│   │   │   ├── GalaxyStateReader.cs
│   │   │   └── FactionStateReader.cs
│   │   └── WIIC/
│   │       ├── WIICIntegration.cs
│   │       └── StatModifier.cs
│   └── build/
│       └── AIEmpires.dll
│
├── data/                            # Game data and configurations
│   ├── factions/
│   │   ├── personalities.json       # All faction personality definitions
│   │   ├── davion.json
│   │   ├── liao.json
│   │   └── ...
│   ├── eras/
│   │   ├── 3025_succession.json
│   │   ├── 3049_clan_invasion.json
│   │   ├── 3062_civil_war.json
│   │   ├── 3068_jihad.json
│   │   ├── 3081_early_republic.json
│   │   ├── 3101_late_republic.json
│   │   ├── 3131_dark_age.json
│   │   └── 3151_ilclan.json
│   └── systems/
│       └── protected_systems.json   # Timeline-critical systems
│
├── docs/
│   ├── ARCHITECTURE.md              # This document
│   ├── FINAL_MOD_LIST.md
│   ├── DIPLOMACY_DESIGN.md
│   ├── RESOURCE_SYSTEM_DESIGN.md
│   └── ...
│
├── scripts/
│   ├── build-all.bat
│   ├── build-all.sh
│   ├── package-release.bat
│   └── dev-setup.bat
│
└── releases/                        # Built releases
    ├── AIEmpires-Launcher-Setup.exe
    ├── AIEmpires-Core-Mods.zip
    └── checksums.txt
```

### 12.2 Installed Structure (Player's Machine)

```
BattleTech Installation/
├── BATTLETECH.exe
├── ...
└── Mods/
    ├── ModTek/
    ├── IRBTModUtils/
    ├── CustomComponents/
    ├── MechEngineer/
    ├── CustomAmmoCategories/
    ├── CBTBehaviorsEnhanced/
    ├── WarTechIIC/
    ├── MissionControl/
    ├── ... (65+ other mods)
    │
    └── AIEmpires/                   # Our mod
        ├── mod.json
        ├── AIEmpires.dll
        ├── config/
        │   ├── settings.json
        │   └── factions.json
        └── saves/
            └── {save_id}/
                ├── galaxy_state.json
                ├── diplomatic_state.json
                ├── faction_memory/
                └── decisions/

User's AppData or Installation/
└── AIEmpires-Launcher/
    ├── AIEmpires-Launcher.exe
    ├── resources/
    ├── ai-service/                  # Bundled Python service
    │   ├── main.exe                 # PyInstaller bundle
    │   └── config.json
    └── config/
        ├── launcher-config.json     # User preferences
        └── api-keys.enc             # Encrypted API keys
```

---

## Summary

This architecture document defines:

1. **Launcher**: Electron + React application for mod management, LLM configuration, and game launching
2. **AI Service**: Python FastAPI service handling LLM communication and faction decision-making
3. **Game Mod**: C# Harmony mod integrating with BattleTech and WarTechIIC
4. **Operational Period Planning**: ICS-inspired 30-day planning cycles with faction-specific reaction speeds
5. **Multi-Provider LLM System**: Support for Claude, GPT, Gemini, Groq, and Ollama
6. **Dynamic Cost Estimation**: Real-time cost display based on provider, model, and faction tier
7. **State Persistence**: JSON-based save system maintaining faction memory across sessions
8. **Auto-Update System**: GitHub-based distribution with manifest-driven updates

---

## 13. Development Standards

### 13.1 Code Quality Requirements

All code in the AIEmpires project must adhere to professional coding standards:

#### Documentation
- **File Headers**: Every source file must include a JSDoc/docstring header with:
  - `@fileoverview` - Brief description of file purpose
  - `@author` - AIEmpires Team
  - `@version` - Current semantic version
  - `@license` - MIT

- **Function Documentation**: All public functions/methods must include:
  - Description of purpose
  - `@param` for each parameter
  - `@returns` for return value
  - `@example` where helpful
  - `@remarks` for implementation notes

- **Inline Comments**: Complex logic should have explanatory comments

#### Semantic Versioning

AIEmpires follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Component | When to Increment |
|-----------|-------------------|
| MAJOR | Breaking changes (save incompatibility, API changes) |
| MINOR | New features (new factions, providers, UI features) |
| PATCH | Bug fixes, documentation, minor tweaks |

Version scripts in launcher:
```bash
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.0 → 1.1.0
npm run version:major  # 1.0.0 → 2.0.0
```

### 13.2 Build Configuration

#### Launcher Executable Build

The launcher uses electron-builder for creating distributable executables:

**Windows Targets:**
- **NSIS Installer**: Full installation with Start Menu shortcuts
- **Portable**: Single executable, no installation required

**Build Commands:**
```bash
npm run package:win   # Windows builds
npm run package:mac   # macOS builds (requires macOS)
npm run package:linux # Linux builds
```

**Output Structure:**
```
launcher/release/1.0.0/
├── AIEmpires Launcher-1.0.0-x64.exe        # NSIS installer
├── AIEmpires Launcher-1.0.0-Portable.exe   # Portable version
└── latest.yml                               # Auto-update metadata
```

### 13.3 UI/UX Design Standards

#### Theme: Military-Industrial BattleTech

The launcher UI follows a consistent BattleTech-inspired theme:

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0e14` | Deep space black background |
| `--bg-secondary` | `#141a24` | Steel gray panels |
| `--bg-card` | `#1a232e` | Gunmetal card backgrounds |
| `--accent` | `#ff6b00` | Primary orange (action/warning) |
| `--accent-secondary` | `#00a8ff` | Tech blue for contrast |

**Typography:**
- Sans-serif: Segoe UI, Roboto
- Monospace: Consolas, Monaco (for tactical/HUD elements)
- Text transforms: uppercase for labels, increased letter-spacing

**Visual Elements:**
- Tech corner accents on cards
- Glowing orange effects on active elements
- Animated progress bars with stripe effects
- Status indicator dots with pulse animations

### 13.4 Related Documentation

| Document | Description |
|----------|-------------|
| [VERSIONING.md](VERSIONING.md) | Detailed versioning guide |
| [FINAL_MOD_LIST.md](FINAL_MOD_LIST.md) | Complete mod list with dependencies |
| [CHANGELOG.md](../CHANGELOG.md) | Version history and release notes |
| [LOGGING.md](LOGGING.md) | Logging standards and configuration |

---

## 14. Logging System

### 14.1 Overview

All components include a robust logging system for debugging and error reporting. Players can enable/disable logging, adjust log levels, and export logs for bug reports.

### 14.2 Log Levels

| Level | Value | Description |
|-------|-------|-------------|
| DEBUG | 0 | Detailed debugging information (development only) |
| INFO | 1 | General operational information (default) |
| WARN | 2 | Warning conditions that should be reviewed |
| ERROR | 3 | Error conditions that need attention |
| FATAL | 4 | Critical errors that may crash the application |

### 14.3 Component Loggers

#### Launcher (TypeScript)
```typescript
import { logger, LogLevel } from './logger'

// Configure
logger.setLevel(LogLevel.DEBUG)
logger.enable()

// Log messages
logger.info('ModManager', 'Starting mod download', { modName: 'CustomAmmo' })
logger.error('AIService', 'Connection failed', { provider: 'anthropic' })

// Export for bug report
const logPath = await logger.exportLogs()
```

#### AI Service (Python)
```python
from utils.logger import logger, LogLevel

# Configure
logger.set_level(LogLevel.DEBUG)
logger.enable()

# Log messages
logger.info('AIBrain', 'Processing faction turn', {'faction': 'Davion'})
logger.error('HttpClient', 'Connection failed', {'url': service_url}, exc_info=e)

# Export for bug report
log_path = logger.export_logs()
```

#### Game Mod (C#)
```csharp
using AIEmpires.Utils;

// Configure
Logger.Instance.SetLevel(LogLevel.Debug);
Logger.Instance.Enable();

// Log messages
Logger.Instance.Info("AIBrain", "Processing faction turn", new { faction = "Davion" });
Logger.Instance.Error("HttpClient", "Connection failed", new { url = serviceUrl }, exception);

// Export for bug report
string logPath = Logger.Instance.ExportLogs();
```

### 14.4 Log Format

All logs are stored as JSON for easy parsing:

```json
{
  "timestamp": "2024-12-30T15:30:45.123Z",
  "level": "INFO",
  "module": "ModManager",
  "message": "Mod download complete",
  "data": {
    "modName": "CustomAmmo",
    "version": "1.2.3"
  }
}
```

### 14.5 Log Files

| Component | Location |
|-----------|----------|
| Launcher | `%APPDATA%/aiempires-launcher/logs/` |
| AI Service | `ai-service/logs/` |
| Game Mod | `<ModDirectory>/logs/` |

Features:
- Automatic log rotation (keeps last 5 files)
- Maximum file size: 10MB per file
- Session-based filenames: `aiempires-YYYY-MM-DDTHH-mm-ss.log`

### 14.6 Bug Report Export

Players can export logs for bug reports from the Settings page:

1. Navigate to Settings > Logging
2. Click "Export Logs for Bug Report"
3. The export file opens in File Explorer
4. Attach the `.txt` file to a GitHub Issue

Export includes:
- System information (OS, versions, etc.)
- Session ID for correlation
- All log entries from the current session

---

## Summary

This architecture document defines:

1. **Launcher**: Electron + React application for mod management, LLM configuration, and game launching
2. **AI Service**: Python FastAPI service handling LLM communication and faction decision-making
3. **Game Mod**: C# Harmony mod integrating with BattleTech and WarTechIIC
4. **Operational Period Planning**: ICS-inspired 30-day planning cycles with faction-specific reaction speeds
5. **Multi-Provider LLM System**: Support for Claude, GPT, Gemini, Groq, and Ollama
6. **Dynamic Cost Estimation**: Real-time cost display based on provider, model, and faction tier
7. **State Persistence**: JSON-based save system maintaining faction memory across sessions
8. **Auto-Update System**: GitHub-based distribution with manifest-driven updates
9. **Development Standards**: Professional code quality, semantic versioning, and UI/UX guidelines
10. **Logging System**: Robust logging across all components with export for bug reports

---

*Document Status: Complete - Ready for implementation*
*Last Updated: December 2024*
