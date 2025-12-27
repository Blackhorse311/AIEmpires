"""Pydantic models for request/response validation."""
from typing import Optional
from pydantic import BaseModel


class FactionSituation(BaseModel):
    controlledSystems: int
    militaryPower: float
    economicPower: float
    activeWars: list[str]
    currentPriorities: list[str]


class NeighborInfo(BaseModel):
    factionId: str
    displayName: str
    relationship: int  # -100 to 100
    sharedBorderSystems: int
    relativePower: float  # 1.0 = equal, >1 = stronger, <1 = weaker
    atWar: bool


class PlayerInfo(BaseModel):
    isMember: bool
    membershipLevel: Optional[str] = None
    influencePoints: int = 0
    suggestion: Optional[str] = None


class DecisionRequest(BaseModel):
    factionId: str
    currentDay: int
    situation: FactionSituation
    neighbors: list[NeighborInfo]
    recentEvents: list[str]
    playerInfo: PlayerInfo


class DecisionResponse(BaseModel):
    action: str  # attack, defend, raid, diplomacy, build, none
    priority: int  # 1-10
    target: Optional[str] = None  # system_id or faction_id
    reasoning: str


class BatchDecisionRequest(BaseModel):
    requests: list[DecisionRequest]


class BatchDecisionResponse(BaseModel):
    decisions: list[DecisionResponse]
