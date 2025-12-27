using System;
using System.Collections.Generic;
using System.Linq;

using AIEmpires.State;

namespace AIEmpires.Services
{
    /// <summary>
    /// Handles the simulation of galaxy-wide faction warfare
    /// </summary>
    public class GalaxySimulator
    {
        private readonly GalaxyState _state;
        private readonly FactionConfig _factions;
        private readonly ModSettings _settings;
        private readonly AIServiceClient _aiService;

        public GalaxySimulator(GalaxyState state, FactionConfig factions, ModSettings settings, AIServiceClient aiService)
        {
            _state = state;
            _factions = factions;
            _settings = settings;
            _aiService = aiService;
        }

        /// <summary>
        /// Process a monthly tick - all factions evaluate and make decisions
        /// </summary>
        public void ProcessTick()
        {
            Main.Log($"Processing galaxy tick for day {_state.currentDay}");

            // 1. Resolve any pending actions that are due
            ResolvePendingActions();

            // 2. Update faction economies
            UpdateEconomies();

            // 3. Request decisions from AI for each major faction
            RequestFactionDecisions();

            // 4. Mark tick as processed
            _state.MarkProcessed();

            // 5. Save state
            Main.SaveGalaxyState();

            Main.Log("Galaxy tick complete");
        }

        /// <summary>
        /// Process a significant player action (contract completion, etc)
        /// </summary>
        public void ProcessPlayerAction(string actionType, string employer, string target, bool success)
        {
            Main.Log($"Processing player action: {actionType} for {employer} against {target}");

            // Update player influence
            if (success)
            {
                var faction = _state.GetOrCreateFaction(employer);
                if (_state.playerState.IsMemberOf(employer))
                {
                    _state.playerState.GainInfluence(
                        _settings.player.influencePerContract,
                        _settings.player.maxInfluencePoints
                    );
                }
            }

            // Determine if this should trigger faction responses
            if (_settings.simulation.tickOnPlayerAction &&
                _settings.simulation.significantActionTypes.Contains(actionType))
            {
                // Queue reactive decisions for affected factions
                Main.Log("Player action triggers reactive decision cycle");
                // This would be async but we'll queue it for next frame
            }
        }

        private void ResolvePendingActions()
        {
            var actionsToResolve = _state.pendingActions
                .Where(a => a.status == "pending" && a.executeDay <= _state.currentDay)
                .ToList();

            foreach (var action in actionsToResolve)
            {
                Main.Log($"Resolving action: {action.faction} {action.actionType} on {action.target}");

                switch (action.actionType)
                {
                    case "attack":
                        ResolveAttack(action);
                        break;
                    case "defend":
                        ResolveDefend(action);
                        break;
                    case "raid":
                        ResolveRaid(action);
                        break;
                    case "diplomacy":
                        ResolveDiplomacy(action);
                        break;
                    case "build":
                        ResolveBuild(action);
                        break;
                }

                action.status = "resolved";
            }
        }

        private void ResolveAttack(PendingAction action)
        {
            var targetSystem = action.target;

            // Find defender
            if (!_state.systems.ContainsKey(targetSystem))
            {
                Main.LogWarning($"Target system {targetSystem} not found");
                return;
            }

            var system = _state.systems[targetSystem];
            var defender = system.owner;

            if (defender == action.faction)
            {
                Main.LogWarning($"{action.faction} tried to attack their own system");
                return;
            }

            // Calculate combat
            var attackerState = _state.GetOrCreateFaction(action.faction);
            var defenderState = _state.GetOrCreateFaction(defender);

            var attackStrength = action.strength * attackerState.militaryPower;
            var defendStrength = _settings.combat.defenderBonus * defenderState.militaryPower;

            if (system.isCapital)
            {
                defendStrength += _settings.combat.capitalDefenseBonus;
            }

            // Random factor
            var random = new Random();
            attackStrength *= (float)(0.8 + random.NextDouble() * 0.4);
            defendStrength *= (float)(0.8 + random.NextDouble() * 0.4);

            if (attackStrength > defendStrength)
            {
                // Attacker wins
                system.owner = action.faction;
                defenderState.controlledSystems.Remove(targetSystem);
                attackerState.controlledSystems.Add(targetSystem);

                // Military losses
                attackerState.militaryPower -= 0.02f;
                defenderState.militaryPower -= 0.05f;

                var evt = GalaxyEvent.SystemCaptured(_state.currentDay, action.faction, defender, targetSystem);
                _state.AddEvent(evt);

                Main.Log($"{action.faction} captured {targetSystem} from {defender}!");
            }
            else
            {
                // Defender holds
                attackerState.militaryPower -= 0.05f;
                defenderState.militaryPower -= 0.02f;

                var evt = GalaxyEvent.AttackRepelled(_state.currentDay, action.faction, defender, targetSystem);
                _state.AddEvent(evt);

                Main.Log($"{defender} repelled {action.faction}'s attack on {targetSystem}");
            }
        }

        private void ResolveDefend(PendingAction action)
        {
            var factionState = _state.GetOrCreateFaction(action.faction);
            factionState.militaryPower = Math.Min(1.0f, factionState.militaryPower + 0.02f);
            Main.Log($"{action.faction} fortified defenses");
        }

        private void ResolveRaid(PendingAction action)
        {
            // Raids damage enemy economy without capturing systems
            if (_state.systems.ContainsKey(action.target))
            {
                var system = _state.systems[action.target];
                var defenderState = _state.GetOrCreateFaction(system.owner);
                defenderState.economicPower -= 0.03f;
                Main.Log($"{action.faction} raided {action.target}, damaging {system.owner}'s economy");
            }
        }

        private void ResolveDiplomacy(PendingAction action)
        {
            Main.Log($"{action.faction} pursued diplomatic action with {action.target}");
            // Could implement treaties, etc.
        }

        private void ResolveBuild(PendingAction action)
        {
            var factionState = _state.GetOrCreateFaction(action.faction);
            factionState.economicPower = Math.Min(1.0f, factionState.economicPower + 0.03f);
            factionState.militaryPower = Math.Min(1.0f, factionState.militaryPower + 0.01f);
            Main.Log($"{action.faction} invested in infrastructure");
        }

        private void UpdateEconomies()
        {
            foreach (var kvp in _state.factions)
            {
                var faction = kvp.Value;

                // Income from systems
                float income = faction.SystemCount * _settings.economy.systemIncomeBase;

                // War drain
                if (faction.activeWars.Count > 0)
                {
                    income -= _settings.economy.warDrain * faction.activeWars.Count;
                }

                // Apply income
                faction.economicPower = Math.Max(0.1f, Math.Min(1.0f, faction.economicPower + income));

                // Manpower recovery
                faction.manpower = Math.Min(1.0f, faction.manpower + _settings.economy.recoveryRate);
            }
        }

        private void RequestFactionDecisions()
        {
            var requests = new List<DecisionRequest>();

            foreach (var majorFaction in _factions.majorFactions)
            {
                var factionState = _state.GetOrCreateFaction(majorFaction.factionId);

                var request = BuildDecisionRequest(majorFaction, factionState);
                requests.Add(request);
            }

            // Request decisions from AI service
            var decisions = _aiService.RequestBatchDecisionsSync(requests);

            if (decisions != null)
            {
                for (int i = 0; i < _factions.majorFactions.Count && i < decisions.Count; i++)
                {
                    var faction = _factions.majorFactions[i];
                    var decision = decisions[i];
                    var factionState = _state.GetOrCreateFaction(faction.factionId);

                    factionState.AddDecision(decision);

                    // Convert decision to pending action
                    if (decision.action != "none" && decision.action != "build")
                    {
                        var pendingAction = new PendingAction
                        {
                            faction = faction.factionId,
                            actionType = decision.action,
                            target = decision.target,
                            strength = _settings.combat.baseAttackStrength * (decision.priority / 10.0f),
                            createdDay = _state.currentDay,
                            executeDay = _state.currentDay + _settings.simulation.actionExecutionDays,
                            reasoning = decision.reasoning
                        };
                        _state.pendingActions.Add(pendingAction);

                        Main.Log($"{faction.displayName} decided to {decision.action} {decision.target}: {decision.reasoning}");
                    }
                }
            }
            else
            {
                Main.LogWarning("Failed to get AI decisions, using fallback logic");
                // Fallback to simple rule-based decisions
                foreach (var majorFaction in _factions.majorFactions)
                {
                    ProcessFallbackDecision(majorFaction);
                }
            }
        }

        private DecisionRequest BuildDecisionRequest(MajorFaction faction, FactionState state)
        {
            // Build neighbor info
            var neighbors = new List<NeighborInfo>();
            foreach (var rel in faction.relationships)
            {
                var neighborFaction = _factions.GetFaction(rel.Key);
                if (neighborFaction != null)
                {
                    var neighborState = _state.GetOrCreateFaction(rel.Key);
                    neighbors.Add(new NeighborInfo
                    {
                        factionId = rel.Key,
                        displayName = neighborFaction.displayName,
                        relationship = rel.Value,
                        sharedBorderSystems = CountSharedBorders(faction.factionId, rel.Key),
                        relativePower = neighborState.OverallPower / Math.Max(0.1f, state.OverallPower),
                        atWar = state.activeWars.Contains(rel.Key)
                    });
                }
            }

            // Get recent events for this faction
            var recentEvents = _state.eventLog
                .Where(e => e.primaryFaction == faction.factionId || e.secondaryFaction == faction.factionId)
                .Take(10)
                .Select(e => e.description)
                .ToList();

            // Player info
            var playerInfo = new PlayerInfo
            {
                isMember = _state.playerState.IsMemberOf(faction.factionId),
                membershipLevel = _state.playerState.membershipLevel,
                influencePoints = _state.playerState.influencePoints,
                suggestion = null // Would be set if player made a suggestion
            };

            return new DecisionRequest
            {
                factionId = faction.factionId,
                currentDay = _state.currentDay,
                situation = new FactionSituation
                {
                    controlledSystems = state.SystemCount,
                    militaryPower = state.militaryPower,
                    economicPower = state.economicPower,
                    activeWars = state.activeWars,
                    currentPriorities = faction.priorities
                },
                neighbors = neighbors,
                recentEvents = recentEvents,
                playerInfo = playerInfo
            };
        }

        private int CountSharedBorders(string faction1, string faction2)
        {
            // Count systems where these factions are adjacent
            int count = 0;
            foreach (var system in _state.systems.Values)
            {
                if (system.owner == faction1)
                {
                    foreach (var adjacent in system.adjacentSystems)
                    {
                        if (_state.systems.ContainsKey(adjacent) && _state.systems[adjacent].owner == faction2)
                        {
                            count++;
                            break;
                        }
                    }
                }
            }
            return count;
        }

        private void ProcessFallbackDecision(MajorFaction faction)
        {
            var state = _state.GetOrCreateFaction(faction.factionId);

            // Simple fallback: aggressive factions attack, defensive factions defend
            if (faction.personality.aggressiveness > 0.6f && state.militaryPower > 0.5f)
            {
                // Find a weak neighbor to attack
                var weakestEnemy = faction.relationships
                    .Where(r => r.Value < -50)
                    .OrderBy(r => _state.GetOrCreateFaction(r.Key).OverallPower)
                    .FirstOrDefault();

                if (weakestEnemy.Key != null)
                {
                    Main.Log($"[Fallback] {faction.displayName} considers attacking {weakestEnemy.Key}");
                }
            }
            else
            {
                Main.Log($"[Fallback] {faction.displayName} focuses on defense and economy");
            }
        }
    }
}
