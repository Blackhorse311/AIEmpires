# AI Empires - RogueTech Mod

LLM-powered strategic AI for faction warfare in RogueTech. Watch empires rise and fall as AI agents control major powers, making decisions based on their unique personalities and strategic doctrines.

## Features

- **15 Major Factions** with distinct AI personalities
- **Monthly Strategic Decisions** powered by Claude
- **Dynamic Faction Warfare** - systems change hands based on AI decisions
- **Player Integration** - join factions and influence (but not direct) strategy
- **Persistent Galaxy State** - your universe evolves over time

## Requirements

- RogueTech (latest version)
- WarTech IIC / Offline Mode enabled
- Python 3.10+ (for AI service)
- Anthropic API key

## Installation

### 1. Install the Mod

Copy the `AIEmpires` folder to your BattleTech mods directory:
```
F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH\Mods\AIEmpires
```

### 2. Set Up the AI Service

1. Navigate to `src/ai_service/`
2. Copy `.env.example` to `.env`
3. Add your Anthropic API key to `.env`
4. Run `run_service.bat` (Windows) or:
   ```bash
   pip install -r requirements.txt
   python main.py
   ```

### 3. Configure RogueTech

Make sure you're running in **Offline Mode** (WarTech IIC), as this mod conflicts with the online PersistentMapClient.

## How It Works

### Strategic Simulation

Every 30 in-game days, the AI service evaluates the galaxy and each major faction makes a strategic decision:

- **Attack** - Attempt to capture an enemy system
- **Defend** - Fortify borders and recover military strength
- **Raid** - Damage enemy economy without capturing territory
- **Build** - Invest in infrastructure and economy
- **Diplomacy** - Attempt negotiations (future feature)

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
| And more... | |

### Player Influence

When you reach sufficient reputation with a faction:

1. **Join** (50+ reputation) - Become a faction member
2. **Influence** (75+ reputation) - Gain influence points from contracts
3. **Trusted** (100+ reputation) - Make strategic suggestions to faction AI

Your suggestions are considered by the AI but not guaranteed to be followed - the AI maintains its personality and priorities.

## Configuration

### settings.json

Key settings you can modify:

```json
{
  "simulation": {
    "daysPerTick": 30,           // Days between AI decisions
    "tickOnPlayerAction": true,  // React to significant player actions
    "maxActionsPerTick": 5       // Max actions per faction per tick
  },
  "player": {
    "influencePerContract": 5,   // Influence gained per contract
    "suggestionCost": 25         // Cost to make a suggestion
  }
}
```

### factions.json

Customize faction personalities and AI prompts. Each faction has:

- **systemPrompt** - The faction's identity and values
- **doctrine** - Strategic principles
- **personality** - Numeric traits (aggressiveness, diplomacy, etc.)
- **priorities** - Standing strategic goals

## API Endpoints

The AI service provides these endpoints:

- `GET /health` - Service health check
- `GET /factions` - List configured factions
- `POST /decide` - Request single faction decision
- `POST /decide/batch` - Request decisions for all factions
- `GET /test/<faction_id>` - Test a faction's decision-making

## Troubleshooting

### Service won't start
- Ensure Python 3.10+ is installed
- Check that `.env` contains a valid API key
- Verify all dependencies are installed

### Mod not loading
- Check ModTek logs for errors
- Ensure mod conflicts with PersistentMapClient are resolved
- Verify game DLL references in the project file

### No AI decisions
- Verify the AI service is running (`http://localhost:5000/health`)
- Check for errors in the game log
- Ensure factions.json is properly formatted

## Development

### Building the C# Mod

1. Open `src/AIEmpires/AIEmpires.csproj` in Visual Studio or Rider
2. Update the `BattleTechGameDir` property to your installation
3. Build the solution
4. Copy `AIEmpires.dll` to the mod folder

### Modifying Faction AI

Edit `config/factions.json` to change faction behavior. The `systemPrompt` field is passed directly to Claude, so you can customize how each faction "thinks."

## Credits

- RogueTech team for the incredible mod framework
- ModTek for the modding infrastructure
- Anthropic for Claude API

## License

This mod is provided as-is for personal use. Not affiliated with Harebrained Schemes, Paradox Interactive, or Anthropic.
