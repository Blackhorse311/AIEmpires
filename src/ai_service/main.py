"""AI Empires Service - Flask API for faction strategic decisions."""
import json
import logging
import os
from pathlib import Path

from flask import Flask, jsonify, request

import config
from models import (
    DecisionRequest,
    DecisionResponse,
    BatchDecisionRequest,
    BatchDecisionResponse,
)
from agents.faction_agent import FactionAgent

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load faction configurations
FACTIONS_CONFIG = {}
FACTION_AGENTS = {}


def load_factions():
    """Load faction configurations from the config file."""
    global FACTIONS_CONFIG, FACTION_AGENTS

    # Find the config file - look in parent directories
    config_paths = [
        Path(__file__).parent.parent.parent / "config" / "factions.json",
        Path("../../config/factions.json"),
        Path("config/factions.json"),
    ]

    for config_path in config_paths:
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                FACTIONS_CONFIG = {f["factionId"]: f for f in data["majorFactions"]}
                logger.info(f"Loaded {len(FACTIONS_CONFIG)} faction configurations")

                # Create agents for each faction
                for faction_id, faction_config in FACTIONS_CONFIG.items():
                    FACTION_AGENTS[faction_id] = FactionAgent(faction_config)
                    logger.info(f"Created agent for {faction_config['displayName']}")
                return

    logger.warning("Could not find factions.json configuration file")


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify(
        {
            "status": "healthy",
            "factions_loaded": len(FACTIONS_CONFIG),
            "claude_model": config.CLAUDE_MODEL,
        }
    )


@app.route("/factions", methods=["GET"])
def list_factions():
    """List all configured factions."""
    return jsonify(
        {
            "factions": [
                {"id": f["factionId"], "name": f["displayName"]}
                for f in FACTIONS_CONFIG.values()
            ]
        }
    )


@app.route("/decide", methods=["POST"])
def make_decision():
    """Request a decision from a faction agent."""
    try:
        data = request.get_json()
        req = DecisionRequest(**data)

        # Get the appropriate agent
        if req.factionId not in FACTION_AGENTS:
            return (
                jsonify({"error": f"Unknown faction: {req.factionId}"}),
                400,
            )

        agent = FACTION_AGENTS[req.factionId]
        decision = agent.make_decision(req)

        return jsonify(decision.model_dump())

    except Exception as e:
        logger.error(f"Error processing decision request: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/decide/batch", methods=["POST"])
def make_batch_decisions():
    """Request decisions from multiple faction agents."""
    try:
        data = request.get_json()
        batch_req = BatchDecisionRequest(**data)

        decisions = []
        for req in batch_req.requests:
            if req.factionId not in FACTION_AGENTS:
                # Return a default decision for unknown factions
                decisions.append(
                    DecisionResponse(
                        action="none",
                        priority=1,
                        target=None,
                        reasoning=f"Unknown faction: {req.factionId}",
                    )
                )
                continue

            agent = FACTION_AGENTS[req.factionId]
            decision = agent.make_decision(req)
            decisions.append(decision)

        response = BatchDecisionResponse(decisions=decisions)
        return jsonify(response.model_dump())

    except Exception as e:
        logger.error(f"Error processing batch decision request: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/test/<faction_id>", methods=["GET"])
def test_faction(faction_id: str):
    """Test endpoint to see a sample decision from a faction."""
    if faction_id not in FACTION_AGENTS:
        return jsonify({"error": f"Unknown faction: {faction_id}"}), 404

    # Create a sample request
    test_request = DecisionRequest(
        factionId=faction_id,
        currentDay=12500,
        situation={
            "controlledSystems": 100,
            "militaryPower": 0.75,
            "economicPower": 0.80,
            "activeWars": [],
            "currentPriorities": FACTIONS_CONFIG[faction_id]["priorities"],
        },
        neighbors=[
            {
                "factionId": "TestEnemy",
                "displayName": "Test Enemy Faction",
                "relationship": -50,
                "sharedBorderSystems": 10,
                "relativePower": 0.8,
                "atWar": False,
            }
        ],
        recentEvents=["Day 12490: Border skirmish on frontier world"],
        playerInfo={"isMember": False, "influencePoints": 0},
    )

    agent = FACTION_AGENTS[faction_id]
    decision = agent.make_decision(test_request)

    return jsonify(
        {
            "faction": FACTIONS_CONFIG[faction_id]["displayName"],
            "request": test_request.model_dump(),
            "decision": decision.model_dump(),
        }
    )


def main():
    """Main entry point."""
    if not config.ANTHROPIC_API_KEY:
        logger.error("ANTHROPIC_API_KEY environment variable not set!")
        logger.error("Please create a .env file with your API key")
        return

    load_factions()

    logger.info(f"Starting AI Empires Service on {config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)


if __name__ == "__main__":
    main()
