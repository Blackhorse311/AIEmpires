"""Faction AI Agent - Makes strategic decisions using Claude."""
import json
import logging
from typing import Optional

import anthropic

from models import DecisionRequest, DecisionResponse
import config

logger = logging.getLogger(__name__)


class FactionAgent:
    """AI agent that makes strategic decisions for a faction."""

    def __init__(self, faction_config: dict):
        self.faction_id = faction_config["factionId"]
        self.display_name = faction_config["displayName"]
        self.system_prompt = faction_config["systemPrompt"]
        self.doctrine = faction_config["doctrine"]
        self.personality = faction_config["personality"]
        self.priorities = faction_config["priorities"]

        self.client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    def make_decision(self, request: DecisionRequest) -> DecisionResponse:
        """Request a strategic decision from Claude."""
        try:
            # Build the context message
            context = self._build_context(request)

            # Call Claude
            message = self.client.messages.create(
                model=config.CLAUDE_MODEL,
                max_tokens=config.MAX_TOKENS,
                temperature=config.TEMPERATURE,
                system=self._build_system_prompt(),
                messages=[{"role": "user", "content": context}],
            )

            # Parse response
            response_text = message.content[0].text
            decision = self._parse_decision(response_text)

            logger.info(
                f"{self.display_name} decided: {decision.action} on {decision.target}"
            )
            return decision

        except Exception as e:
            logger.error(f"Error getting decision for {self.faction_id}: {e}")
            # Return a safe fallback
            return DecisionResponse(
                action="defend",
                priority=5,
                target=None,
                reasoning=f"Fallback decision due to error: {str(e)}",
            )

    def _build_system_prompt(self) -> str:
        """Build the system prompt for this faction."""
        return f"""You are a strategic AI advisor for {self.display_name} in the BattleTech universe, year 3151.

FACTION IDENTITY:
{self.system_prompt}

STRATEGIC DOCTRINE:
{self.doctrine}

PERSONALITY TRAITS:
- Aggressiveness: {self.personality['aggressiveness']:.0%}
- Diplomacy: {self.personality['diplomacy']:.0%}
- Honor: {self.personality['honor']:.0%}
- Opportunism: {self.personality['opportunism']:.0%}
- Defensiveness: {self.personality['defensiveness']:.0%}

STANDING PRIORITIES:
{', '.join(self.priorities)}

You must make strategic decisions that align with your faction's personality and goals.
Always respond with a valid JSON object matching this exact schema:
{{
    "action": "attack|defend|raid|diplomacy|build|none",
    "priority": <1-10>,
    "target": "<system_id or faction_id or null>",
    "reasoning": "<brief explanation in character>"
}}

IMPORTANT:
- Only output the JSON, no other text
- "attack" requires a target system owned by an enemy
- "raid" targets enemy systems for economic damage without conquest
- "diplomacy" targets a faction for negotiation
- "defend" focuses on fortifying borders (no target needed)
- "build" invests in economy and infrastructure (no target needed)
- "none" means maintain current posture
"""

    def _build_context(self, request: DecisionRequest) -> str:
        """Build the context message for the decision request."""
        # Format neighbors
        neighbors_text = ""
        for n in request.neighbors:
            status = "AT WAR" if n.atWar else ""
            rel_text = (
                "ALLIED"
                if n.relationship > 50
                else "FRIENDLY" if n.relationship > 0 else "HOSTILE"
            )
            power_text = (
                "stronger"
                if n.relativePower > 1.2
                else "weaker" if n.relativePower < 0.8 else "comparable"
            )
            neighbors_text += f"- {n.displayName}: {rel_text} ({n.relationship:+d}), {n.sharedBorderSystems} border systems, {power_text} power {status}\n"

        # Format recent events
        events_text = "\n".join(f"- {e}" for e in request.recentEvents[:5]) or "None"

        # Format player info
        player_text = ""
        if request.playerInfo.isMember:
            player_text = f"""
PLAYER MERCENARY STATUS:
The player commander is a member of your faction at {request.playerInfo.membershipLevel} level.
They have {request.playerInfo.influencePoints} influence points.
"""
            if request.playerInfo.suggestion:
                player_text += f"They suggest: {request.playerInfo.suggestion}\n"
                player_text += "(Consider their suggestion, but you are not bound by it)\n"

        return f"""STRATEGIC SITUATION REPORT - Day {request.currentDay}

CURRENT STATUS:
- Controlled Systems: {request.situation.controlledSystems}
- Military Power: {request.situation.militaryPower:.0%}
- Economic Power: {request.situation.economicPower:.0%}
- Active Wars: {', '.join(request.situation.activeWars) or 'None'}

NEIGHBORING FACTIONS:
{neighbors_text}

RECENT EVENTS (last 90 days):
{events_text}
{player_text}

Based on your faction's personality, doctrine, and the current situation, what is your strategic decision for this month?

Respond with JSON only."""

    def _parse_decision(self, response_text: str) -> DecisionResponse:
        """Parse the Claude response into a DecisionResponse."""
        try:
            # Try to extract JSON from the response
            # Handle cases where Claude might add extra text
            text = response_text.strip()

            # Find JSON in the response
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = text[start:end]
                data = json.loads(json_str)

                return DecisionResponse(
                    action=data.get("action", "none"),
                    priority=data.get("priority", 5),
                    target=data.get("target"),
                    reasoning=data.get("reasoning", "No reasoning provided"),
                )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse decision JSON: {e}\nResponse: {response_text}")

        # Fallback
        return DecisionResponse(
            action="defend",
            priority=5,
            target=None,
            reasoning="Could not parse AI response, defaulting to defensive posture",
        )
