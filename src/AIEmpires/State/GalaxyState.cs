using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace AIEmpires.State
{
    public class GalaxyState
    {
        public string schemaVersion { get; set; } = "1.0";
        public int currentDay { get; set; } = 0;
        public int lastProcessedDay { get; set; } = 0;
        public Dictionary<string, FactionState> factions { get; set; } = new Dictionary<string, FactionState>();
        public Dictionary<string, SystemState> systems { get; set; } = new Dictionary<string, SystemState>();
        public List<ActiveConflict> activeConflicts { get; set; } = new List<ActiveConflict>();
        public List<PendingAction> pendingActions { get; set; } = new List<PendingAction>();
        public List<GalaxyEvent> eventLog { get; set; } = new List<GalaxyEvent>();
        public PlayerState playerState { get; set; } = new PlayerState();

        public bool ShouldProcessTick(int currentGameDay, int daysPerTick)
        {
            return currentGameDay - lastProcessedDay >= daysPerTick;
        }

        public void UpdateDay(int gameDay)
        {
            currentDay = gameDay;
        }

        public void MarkProcessed()
        {
            lastProcessedDay = currentDay;
        }

        public void AddEvent(GalaxyEvent evt)
        {
            eventLog.Insert(0, evt);
            // Keep only last N events
            if (eventLog.Count > 100)
            {
                eventLog.RemoveRange(100, eventLog.Count - 100);
            }
        }

        public FactionState GetOrCreateFaction(string factionId)
        {
            if (!factions.ContainsKey(factionId))
            {
                factions[factionId] = new FactionState { factionId = factionId };
            }
            return factions[factionId];
        }
    }

    public class FactionState
    {
        public string factionId { get; set; }
        public List<string> controlledSystems { get; set; } = new List<string>();
        public float militaryPower { get; set; } = 1.0f;
        public float economicPower { get; set; } = 1.0f;
        public float manpower { get; set; } = 1.0f;
        public List<string> activeWars { get; set; } = new List<string>();
        public List<Treaty> treaties { get; set; } = new List<Treaty>();
        public List<string> strategicPriorities { get; set; } = new List<string>();
        public AIDecision lastDecision { get; set; }
        public List<AIDecision> decisionHistory { get; set; } = new List<AIDecision>();

        public int SystemCount => controlledSystems.Count;

        public float OverallPower => (militaryPower + economicPower + manpower) / 3.0f;

        public void AddDecision(AIDecision decision)
        {
            lastDecision = decision;
            decisionHistory.Insert(0, decision);
            if (decisionHistory.Count > 10)
            {
                decisionHistory.RemoveRange(10, decisionHistory.Count - 10);
            }
        }
    }

    public class SystemState
    {
        public string systemId { get; set; }
        public string owner { get; set; }
        public Dictionary<string, float> influence { get; set; } = new Dictionary<string, float>();
        public bool isContested { get; set; } = false;
        public bool isCapital { get; set; } = false;
        public float industrialValue { get; set; } = 1.0f;
        public List<string> adjacentSystems { get; set; } = new List<string>();
    }

    public class ActiveConflict
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        public string attacker { get; set; }
        public string defender { get; set; }
        public string targetSystem { get; set; }
        public float attackerStrength { get; set; }
        public float defenderStrength { get; set; }
        public int startDay { get; set; }
        public int resolutionDay { get; set; }
        public string status { get; set; } = "active"; // active, resolved
        public string outcome { get; set; } // attacker_victory, defender_victory, stalemate
    }

    public class PendingAction
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        public string faction { get; set; }
        public string actionType { get; set; } // attack, defend, raid, diplomacy, build
        public string target { get; set; } // system or faction id
        public float strength { get; set; }
        public int createdDay { get; set; }
        public int executeDay { get; set; }
        public string status { get; set; } = "pending"; // pending, executing, resolved, cancelled
        public string reasoning { get; set; }
    }

    public class Treaty
    {
        public string partnerId { get; set; }
        public string type { get; set; } // non_aggression, alliance, trade
        public int startDay { get; set; }
        public int expirationDay { get; set; }
    }

    public class AIDecision
    {
        public string action { get; set; }
        public int priority { get; set; }
        public string target { get; set; }
        public string reasoning { get; set; }
        public int decidedOnDay { get; set; }
        public string rawResponse { get; set; }
    }

    public class GalaxyEvent
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        public int day { get; set; }
        public string type { get; set; } // system_captured, war_declared, treaty_signed, faction_weakened
        public string primaryFaction { get; set; }
        public string secondaryFaction { get; set; }
        public string systemId { get; set; }
        public string description { get; set; }
        public Dictionary<string, object> metadata { get; set; } = new Dictionary<string, object>();

        public static GalaxyEvent SystemCaptured(int day, string attacker, string defender, string systemId)
        {
            return new GalaxyEvent
            {
                day = day,
                type = "system_captured",
                primaryFaction = attacker,
                secondaryFaction = defender,
                systemId = systemId,
                description = $"{attacker} captured {systemId} from {defender}"
            };
        }

        public static GalaxyEvent WarDeclared(int day, string attacker, string defender)
        {
            return new GalaxyEvent
            {
                day = day,
                type = "war_declared",
                primaryFaction = attacker,
                secondaryFaction = defender,
                description = $"{attacker} declared war on {defender}"
            };
        }

        public static GalaxyEvent AttackRepelled(int day, string attacker, string defender, string systemId)
        {
            return new GalaxyEvent
            {
                day = day,
                type = "attack_repelled",
                primaryFaction = defender,
                secondaryFaction = attacker,
                systemId = systemId,
                description = $"{defender} repelled {attacker}'s attack on {systemId}"
            };
        }
    }

    public class PlayerState
    {
        public string memberFaction { get; set; } = null;
        public string membershipLevel { get; set; } = null; // member, trusted
        public int influencePoints { get; set; } = 0;
        public List<string> suggestions { get; set; } = new List<string>();
        public Dictionary<string, int> factionReputation { get; set; } = new Dictionary<string, int>();
        public List<string> completedContracts { get; set; } = new List<string>();

        public bool IsMemberOf(string factionId)
        {
            return memberFaction == factionId;
        }

        public bool CanMakeSuggestion(int cost)
        {
            return influencePoints >= cost;
        }

        public void SpendInfluence(int amount)
        {
            influencePoints = Math.Max(0, influencePoints - amount);
        }

        public void GainInfluence(int amount, int max)
        {
            influencePoints = Math.Min(max, influencePoints + amount);
        }
    }
}
