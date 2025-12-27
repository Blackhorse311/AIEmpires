# AIEmpires Project Rules & Standards

> **Purpose**: This document serves as the authoritative reference for all development on AIEmpires.
> When starting a new session, refer Claude to this document to maintain consistency.

## Quick Reference for New Sessions

When resuming work, tell Claude:
```
Read I:/roguetech-spt/AIEmpires/PROJECT_RULES.md and follow these standards for all work.
```

---

## 1. Project Identity

- **Project Name**: AIEmpires (no space, PascalCase)
- **Repository**: https://github.com/Blackhorse311/AIEmpires
- **Description**: LLM-powered faction AI for BattleTech
- **License**: MIT

---

## 2. Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Examples:
  0.1.0       - Initial development
  0.2.0-alpha - New feature, pre-release
  1.0.0       - First stable release
  1.0.1       - Bug fix
  1.1.0       - New feature, backwards compatible
  2.0.0       - Breaking changes
```

### Version Locations
Update version in ALL of these files when releasing:
- `mod.json` - `"Version": "x.x.x"`
- `src/AIEmpires/AIEmpires.csproj` - `<Version>x.x.x</Version>`
- `src/ai_service/config.py` - `VERSION = "x.x.x"`
- `CHANGELOG.md` - Add release notes

### Current Version
**v0.1.0** - Initial development

### When to Increment
- **PATCH** (0.0.X): Bug fixes, documentation, refactoring (no new features)
- **MINOR** (0.X.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes, API changes, major rewrites

---

## 3. Code Standards

### 3.1 General Principles

1. **Readability First**: Code should be self-documenting where possible
2. **Comment the Why**: Comments explain WHY, not WHAT (code shows what)
3. **Expert Quality**: Production-ready, not prototype quality
4. **Modder-Friendly**: Others should learn from our code
5. **No Magic Numbers**: Use named constants
6. **DRY**: Don't Repeat Yourself
7. **KISS**: Keep It Simple, Stupid

### 3.2 C# Standards (BattleTech Mod)

```csharp
// File Header - REQUIRED for all .cs files
// ============================================================================
// AIEmpires - LLM-Powered Faction AI for BattleTech
// Copyright (c) 2024-2025 Blackhorse311
// Licensed under MIT License
// ============================================================================
// File: ClassName.cs
// Purpose: Brief description of what this file/class does
// ============================================================================

using System;
using BattleTech;
using Harmony;

namespace AIEmpires.Category
{
    /// <summary>
    /// Class-level XML documentation explaining the class purpose.
    /// Include usage examples for complex classes.
    /// </summary>
    /// <remarks>
    /// Additional notes about implementation details, dependencies,
    /// or integration points with BattleTech/WarTechIIC.
    /// </remarks>
    public class ClassName
    {
        // ====================================================================
        // CONSTANTS
        // ====================================================================

        /// <summary>Days between AI faction decisions.</summary>
        private const int DECISION_INTERVAL_DAYS = 30;

        // ====================================================================
        // FIELDS
        // ====================================================================

        /// <summary>Brief description of field purpose.</summary>
        private readonly AIServiceClient _aiClient;

        // ====================================================================
        // PROPERTIES
        // ====================================================================

        /// <summary>Whether the AI service is currently available.</summary>
        public bool IsServiceAvailable { get; private set; }

        // ====================================================================
        // CONSTRUCTORS
        // ====================================================================

        /// <summary>
        /// Initializes a new instance with the specified configuration.
        /// </summary>
        /// <param name="config">The mod configuration settings.</param>
        /// <exception cref="ArgumentNullException">Thrown if config is null.</exception>
        public ClassName(ModConfig config)
        {
            // Validate inputs
            if (config == null)
                throw new ArgumentNullException(nameof(config));

            // Initialize with explanation of WHY this order matters
            _aiClient = new AIServiceClient(config.ServiceEndpoint);
        }

        // ====================================================================
        // PUBLIC METHODS
        // ====================================================================

        /// <summary>
        /// Requests a strategic decision from the AI for the specified faction.
        /// </summary>
        /// <param name="factionId">The faction identifier (e.g., "ClanWolf").</param>
        /// <param name="galaxyState">Current state of the galaxy.</param>
        /// <returns>The AI's strategic decision, or null if service unavailable.</returns>
        /// <remarks>
        /// This method is called by SimGamePatches.OnDayPassed every 30 days.
        /// The decision is then passed to WarTechIIC for execution.
        /// </remarks>
        public FactionDecision RequestDecision(string factionId, GalaxyState galaxyState)
        {
            // Early exit pattern for clarity
            if (!IsServiceAvailable)
            {
                Logger.Log($"[AIEmpires] Service unavailable, skipping {factionId}");
                return null;
            }

            // Main logic with explanatory comments
            // ...
        }

        // ====================================================================
        // PRIVATE METHODS
        // ====================================================================

        // Private methods follow same documentation pattern
    }
}
```

### 3.3 Python Standards (AI Service)

```python
#!/usr/bin/env python3
# ============================================================================
# AIEmpires - LLM-Powered Faction AI for BattleTech
# Copyright (c) 2024-2025 Blackhorse311
# Licensed under MIT License
# ============================================================================
# File: module_name.py
# Purpose: Brief description of what this module does
# ============================================================================
"""
Module docstring with more detailed explanation.

This module handles X, Y, Z. It integrates with the BattleTech mod
via HTTP endpoints and communicates with LLM providers.

Example:
    >>> from module_name import ClassName
    >>> obj = ClassName(config)
    >>> result = obj.do_something()
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any

# Local imports
from .providers.base import LLMProvider, LLMResponse

# ============================================================================
# CONSTANTS
# ============================================================================

# Decision interval in game days (must match C# mod)
DECISION_INTERVAL_DAYS: int = 30

# Maximum retries for LLM API calls
MAX_RETRY_ATTEMPTS: int = 3

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class FactionDecision:
    """
    Represents a strategic decision made by a faction AI.

    Attributes:
        action: The type of action (attack, defend, raid, diplomacy, build, none)
        priority: Urgency level from 1-10
        target: Target system or faction ID, or None for self-targeting actions
        reasoning: The AI's explanation for this decision (for logging/debugging)

    Example:
        >>> decision = FactionDecision(
        ...     action="attack",
        ...     priority=8,
        ...     target="starsystemdef_Tharkad",
        ...     reasoning="Tharkad is weakly defended and strategically vital"
        ... )
    """
    action: str
    priority: int
    target: Optional[str] = None
    reasoning: str = ""

    def __post_init__(self) -> None:
        """Validate decision parameters."""
        valid_actions = {"attack", "defend", "raid", "diplomacy", "build", "none"}
        if self.action not in valid_actions:
            raise ValueError(f"Invalid action '{self.action}'. Must be one of {valid_actions}")

        if not 1 <= self.priority <= 10:
            raise ValueError(f"Priority must be 1-10, got {self.priority}")


# ============================================================================
# CLASSES
# ============================================================================

class FactionAgent:
    """
    AI agent representing a single faction's strategic decision-making.

    Each faction has unique personality traits and strategic doctrine that
    influence its decisions. The agent uses an LLM to generate contextually
    appropriate decisions based on the current galaxy state.

    Attributes:
        faction_id: Unique identifier for this faction
        config: Faction personality and doctrine configuration
        provider: LLM provider for generating decisions

    Example:
        >>> agent = FactionAgent("ClanWolf", wolf_config, anthropic_provider)
        >>> decision = agent.decide(galaxy_state)
        >>> print(f"Wolves chose to {decision.action}")
    """

    def __init__(
        self,
        faction_id: str,
        config: FactionConfig,
        provider: LLMProvider
    ) -> None:
        """
        Initialize a faction agent.

        Args:
            faction_id: Unique identifier (e.g., "ClanWolf", "FederatedSuns")
            config: Faction personality, doctrine, and system prompt
            provider: LLM provider instance for generating decisions

        Raises:
            ValueError: If faction_id is empty or config is invalid
        """
        if not faction_id:
            raise ValueError("faction_id cannot be empty")

        self.faction_id = faction_id
        self.config = config
        self.provider = provider
        self._logger = logging.getLogger(f"AIEmpires.{faction_id}")

    def decide(self, galaxy_state: GalaxyState) -> FactionDecision:
        """
        Generate a strategic decision based on current galaxy state.

        This method constructs a prompt from the galaxy state, sends it
        to the LLM provider, and parses the response into a FactionDecision.

        Args:
            galaxy_state: Current state including systems, factions, wars

        Returns:
            FactionDecision with the AI's chosen action

        Raises:
            LLMError: If the LLM provider fails after retries
            ParseError: If the LLM response cannot be parsed as valid JSON
        """
        # Build the situation report for the LLM
        prompt = self._build_situation_report(galaxy_state)

        # Request decision from LLM
        # Using temperature 0.7 for creative but consistent responses
        response = self.provider.generate(
            system_prompt=self.config.system_prompt,
            user_message=prompt,
            temperature=0.7
        )

        # Parse and validate the decision
        decision = self._parse_decision(response.content)

        self._logger.info(f"{self.faction_id} decided: {decision.action} on {decision.target}")
        return decision

    # ========================================================================
    # PRIVATE METHODS
    # ========================================================================

    def _build_situation_report(self, galaxy_state: GalaxyState) -> str:
        """Build the strategic situation report prompt for the LLM."""
        # Implementation...
        pass

    def _parse_decision(self, response_text: str) -> FactionDecision:
        """Parse LLM response JSON into a FactionDecision."""
        # Implementation...
        pass


# ============================================================================
# FUNCTIONS
# ============================================================================

def create_default_config() -> Dict[str, Any]:
    """
    Create default configuration for the AI service.

    Returns:
        Dictionary with default settings for all configuration options.

    Example:
        >>> config = create_default_config()
        >>> config['llm']['provider'] = 'anthropic'
    """
    return {
        "llm": {
            "provider": "anthropic",
            "model": "claude-sonnet-4-20250514",
            "temperature": 0.7,
            "max_tokens": 1024,
        },
        "service": {
            "host": "127.0.0.1",
            "port": 5000,
        }
    }
```

### 3.4 JSON Standards (Configuration)

```json
{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$comment": "AIEmpires Faction Configuration - v0.1.0",

    "factions": {
        "ClanWolf": {
            "_comment": "Wolf Empire - Aggressive conquest faction",
            "_version": "0.1.0",

            "displayName": "Wolf Empire",
            "era": "3151",

            "personality": {
                "_comment": "Personality traits (0-100 scale)",
                "aggressiveness": 85,
                "diplomacy": 30,
                "honor": 80,
                "opportunism": 60,
                "defensiveness": 40
            },

            "doctrine": {
                "_comment": "Strategic priorities in order",
                "priorities": [
                    "destroy_jade_falcon",
                    "hold_terra",
                    "expand_influence"
                ]
            }
        }
    }
}
```

---

## 4. File Organization

```
AIEmpires/
├── .github/                    # GitHub templates and workflows
│   └── ISSUE_TEMPLATE/
├── config/                     # Runtime configuration (user-editable)
│   ├── factions.json           # Faction personalities
│   └── settings.json           # Mod settings
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System design
│   ├── API.md                  # API reference
│   ├── WARTECHIIC_INTEGRATION.md
│   └── *.md
├── references/                 # Reference materials (not in git)
│   └── sources/                # Cloned mod sources
├── src/
│   ├── AIEmpires/              # C# BattleTech mod
│   │   ├── Main.cs             # Entry point
│   │   ├── Patches/            # Harmony patches
│   │   ├── Services/           # AI service client
│   │   ├── State/              # Game state management
│   │   └── AIEmpires.csproj
│   └── ai_service/             # Python AI service
│       ├── agents/             # Faction AI agents
│       ├── providers/          # LLM provider implementations
│       ├── main.py             # Flask entry point
│       ├── config.py           # Configuration
│       └── requirements.txt
├── tests/                      # Test files
│   ├── csharp/
│   └── python/
├── .gitignore
├── CHANGELOG.md                # Version history
├── LICENSE                     # MIT License
├── mod.json                    # ModTek manifest
├── PROJECT_RULES.md            # THIS FILE
└── README.md                   # Project overview
```

---

## 5. Git Workflow

### Branch Naming
```
main              - Stable releases only
develop           - Integration branch
feature/xxx       - New features (e.g., feature/multi-provider)
bugfix/xxx        - Bug fixes (e.g., bugfix/connection-timeout)
docs/xxx          - Documentation updates
refactor/xxx      - Code refactoring
```

### Commit Messages
```
<type>(<scope>): <subject>

<body>

<footer>

Types:
  feat     - New feature
  fix      - Bug fix
  docs     - Documentation
  style    - Formatting (no code change)
  refactor - Code refactoring
  test     - Adding tests
  chore    - Maintenance

Examples:
  feat(providers): add Groq LLM provider support
  fix(ai-service): handle connection timeout gracefully
  docs(readme): update installation instructions
  refactor(patches): simplify SimGameState hook logic
```

### Tags
```
v0.1.0            - Release versions (semantic)
```

---

## 6. Documentation Requirements

### Every File Must Have:
1. **Header comment** with copyright, license, purpose
2. **Class/function docstrings** explaining what and why

### Every Public API Must Have:
1. **XML docs (C#)** or **docstrings (Python)**
2. **Parameter descriptions**
3. **Return value descriptions**
4. **Example usage** for complex APIs
5. **Exception documentation**

### Integration Points Must Have:
1. **Comments explaining BattleTech/WarTechIIC hooks**
2. **References to game classes being patched**
3. **Notes about timing and execution order**

---

## 7. RogueTech/WarTechIIC Code Policy

When working with existing mod code:

### Option A: Rewrite
Use when:
- Original code is inefficient or buggy
- We need different behavior
- License permits (check first!)

Process:
1. Document original behavior
2. Write new implementation
3. Add comprehensive comments
4. Credit original author

### Option B: Comment and Adapt
Use when:
- Original code works well
- Complex logic that's hard to rewrite safely
- Tight integration with game internals

Process:
1. Copy code to our codebase
2. Add header crediting original author
3. Add section comments explaining each block
4. Add inline comments for non-obvious logic
5. Note any modifications we made

### Comment Template for External Code
```csharp
// ============================================================================
// ADAPTED FROM: WarTechIIC by BlueWinds
// SOURCE: https://github.com/BlueWinds/WarTechIIC
// LICENSE: GPL-3.0
//
// This code handles [description]. We adapted it because [reason].
//
// MODIFICATIONS:
// - [List any changes made]
// - [Keep original behavior unless noted]
// ============================================================================
```

---

## 8. Testing Requirements

### Before Committing:
1. C# mod compiles without warnings
2. Python service starts without errors
3. Basic functionality tested manually
4. No hardcoded paths or credentials

### Before Releasing:
1. All features tested in-game
2. Documentation updated
3. CHANGELOG.md updated
4. Version numbers updated everywhere

---

## 9. Security

### Never Commit:
- API keys (use .env, which is gitignored)
- Personal paths
- Credentials of any kind

### .env.example Pattern:
```bash
# Copy this to .env and fill in your values
ANTHROPIC_API_KEY=your-key-here
```

---

## 10. Quick Checklist for Changes

Before committing any change:

- [ ] Code follows style guide
- [ ] All new code has header comments
- [ ] All public APIs documented
- [ ] No hardcoded values (use constants)
- [ ] No sensitive data
- [ ] Compiles/runs without errors
- [ ] Version bumped if needed
- [ ] CHANGELOG updated if needed

---

## Appendix A: Useful Commands

```bash
# Build C# mod
dotnet build src/AIEmpires/AIEmpires.csproj -c Release

# Run Python service
cd src/ai_service && python main.py

# Run tests
pytest tests/python/
dotnet test tests/csharp/

# Create release tag
git tag -a v0.1.0 -m "Release v0.1.0: Initial development release"
git push origin v0.1.0
```

---

## Appendix B: Contact & Resources

- **Repository**: https://github.com/Blackhorse311/AIEmpires
- **BattleTech Modding Discord**: [Link]
- **ModTek Wiki**: https://github.com/BattletechModders/ModTek/wiki
- **WarTechIIC Docs**: https://github.com/BlueWinds/WarTechIIC

---

*Last Updated: 2024-12-26*
*Document Version: 1.0.0*
