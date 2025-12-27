# AIEmpires - BattleTech Mod

LLM-powered strategic AI for faction warfare in BattleTech. Watch empires rise and fall as AI agents control major powers, making decisions based on their unique personalities and strategic doctrines.

## Features

- **15 Major Factions** with distinct AI personalities
- **Monthly Strategic Decisions** powered by multiple LLM providers
- **Dynamic Faction Warfare** - systems change hands based on AI decisions
- **Player Integration** - join factions and influence (but not direct) strategy
- **Persistent Galaxy State** - your universe evolves over time
- **Multi-Provider LLM Support** - Claude, GPT-4, Ollama, Groq, LM Studio

## LLM Provider Support

| Provider | Type | Models | Cost |
|----------|------|--------|------|
| Anthropic | Cloud | Claude 3.5 Sonnet, Opus, Haiku | Pay per token |
| OpenAI | Cloud | GPT-4, GPT-4 Turbo, GPT-3.5 | Pay per token |
| Groq | Cloud | Llama 3, Mixtral | Free tier available |
| Ollama | Local | Any GGUF model | Free (your hardware) |
| LM Studio | Local | Any GGUF model | Free (your hardware) |

## Requirements

- BattleTech (with ModTek)
- WarTechIIC mod (for persistent map)
- Python 3.10+ (for AI service)
- At least one LLM provider configured (API key or local server)

## Installation

### 1. Install the Mod

Copy the AIEmpires folder to your BattleTech mods directory:

    BATTLETECH/Mods/AIEmpires

### 2. Set Up the AI Service

1. Navigate to src/ai_service/
2. Copy .env.example to .env
3. Configure your preferred LLM provider in .env
4. Run the service:
   
       pip install -r requirements.txt
       python main.py

### 3. Install WarTechIIC

This mod integrates with WarTechIIC for persistent faction warfare.

## How It Works

### Strategic Simulation

Every 30 in-game days, the AI service evaluates the galaxy and each major faction makes a strategic decision:

- **Attack** - Attempt to capture an enemy system
- **Defend** - Fortify borders and recover military strength
- **Raid** - Damage enemy economy without capturing territory
- **Build** - Invest in infrastructure and economy
- **Diplomacy** - Attempt negotiations with other factions

### Faction Personalities

Each faction has unique traits that influence their decisions:

| Faction | Personality |
|---------|-------------|
| Wolf Empire | Aggressive, honorable conquest |
| Clan Jade Falcon | Militant, traditional, revenge-focused |
| Federated Suns | Defensive, diplomatic |
| Lyran Commonwealth | Economic focus, mercenary hiring |
| Draconis Combine | Patient, honor-bound |
| Capellan Confederation | Opportunistic, cunning |
| Free Worlds League | Fractured, balancing act |
| Rasalhague Dominion | Defensive, Clan-hybrid |
| Magistracy of Canopus | Diplomatic, survivalist |
| Taurian Concordat | Paranoid, fortress defense |
| Clan Hell's Horses | Combined arms, aggressive |
| Scorpion Empire | Expansionist, religious |
| Clan Sea Fox | Merchant, opportunistic |
| Galatean League | Mercenary focused |
| ComStar | Information control, neutral |

## Project Structure

    AIEmpires/
    ├── config/                 # Configuration files
    ├── docs/                   # Documentation
    ├── references/sources/     # Cloned mod sources for reference
    ├── src/
    │   ├── AIEmpires/          # C# BattleTech mod
    │   └── ai_service/         # Python AI service
    │       └── providers/      # Multi-provider LLM system
    ├── mod.json
    └── README.md

## Credits

- ModTek - Mod loading framework
- WarTechIIC - Persistent faction warfare
- Open source BattleTech modding community

## License

MIT License - Not affiliated with Harebrained Schemes, Paradox Interactive, Catalyst Game Labs, or any LLM provider.
