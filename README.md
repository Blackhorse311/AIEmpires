# AIEmpires

**LLM-Powered Faction AI for BattleTech**

AIEmpires is a comprehensive mod pack for HBS BattleTech that adds intelligent, personality-driven AI to control the major factions of the Inner Sphere and beyond. Each faction leader is played by an LLM agent that makes strategic decisions about warfare, diplomacy, and resources based on their unique personality and the lore of the BattleTech universe.

## Features

- **Intelligent Faction AI**: Each major faction is controlled by an LLM agent with a distinct personality
- **Dynamic Warfare**: Factions attack, defend, and raid based on strategic decisions, not random chance
- **Diplomacy System**: Treaties, alliances, betrayals - all driven by AI personalities
- **Resource Management**: Factions manage industry, commerce, morale, and military forces
- **8 Playable Eras**: From the Succession Wars (3025) to the ilClan Era (3151+)
- **Multiple LLM Support**: Use Claude, GPT, Gemini, Groq, or run locally with Ollama
- **Operational Period Planning**: ICS-inspired 30-day planning cycles for realistic faction behavior

## Supported Eras

| Era | Years | Description |
|-----|-------|-------------|
| Late Succession War | 3025-3047 | Renaissance Era, LosTech discovery |
| Clan Invasion | 3049-3061 | The Clans arrive |
| Civil War | 3062-3067 | FedCom Civil War |
| Jihad | 3068-3080 | Word of Blake Jihad |
| Early Republic | 3081-3100 | Republic of the Sphere |
| Late Republic | 3101-3130 | Republic decline |
| Dark Age | 3131-3150 | Fortress Republic |
| ilClan | 3151+ | Wolf ilClan, new order |

## Installation

1. Download the AIEmpires Launcher from [Releases](../../releases)
2. Run the launcher and point it to your BattleTech installation
3. Click "Install Mods" to download all required mods
4. Configure your LLM provider (or use Ollama for free local AI)
5. Launch BattleTech and enjoy!

## Requirements

- BattleTech (HBS) with all DLC recommended
- Windows 10/11 (Mac/Linux support planned)
- For cloud AI: API key from Anthropic, OpenAI, Google, or Groq
- For local AI: [Ollama](https://ollama.ai) installed with a model (llama3.1 recommended)

## Project Structure

```
AIEmpires/
├── launcher/          # Electron launcher application
├── ai-service/        # Python AI service
├── game-mod/          # C# BattleTech mod
├── data/              # Faction personalities, era configs
├── docs/              # Design documents
└── scripts/           # Build and utility scripts
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Mod List](docs/FINAL_MOD_LIST.md)
- [Diplomacy System](docs/DIPLOMACY_DESIGN.md)
- [Resource System](docs/RESOURCE_SYSTEM_DESIGN.md)

## Contributing

This project is in active development. Contributions welcome!

## License

[TBD]

## Credits

- Built on top of amazing work by the BattleTech modding community
- Uses [ModTek](https://github.com/BattletechModders/ModTek), [WarTechIIC](https://github.com/BlueWinds/WarTechIIC), and many other community mods
- BattleTech is a registered trademark of Topps Company, Inc.

---

*"The Inner Sphere will burn... or unite. The choice is no longer just yours."*
