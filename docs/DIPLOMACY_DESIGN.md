# AIEmpires Diplomacy System Design Document

**Version**: 0.3 (Complete)
**Target Release**: v0.6.0
**Author**: Claude + Blackhorse311
**Date**: 2024-12-27
**Last Updated**: 2024-12-29

---

## 1. Executive Summary

The Diplomacy System extends AIEmpires beyond simple warfare to include the full spectrum of inter-faction relations: alliances, treaties, betrayals, and political maneuvering. Each AI-controlled faction will evaluate diplomatic options through their unique personality lens, creating emergent narratives of shifting alliances and backstabbing.

### Design Goals

1. **Lore-Accurate Behavior**: Capellans should backstab, Kuritan honor should matter, Clan politics should be brutal
2. **Emergent Storytelling**: Alliances form, break, and reform based on AI reasoning
3. **Player Agency**: Players can influence their faction's diplomatic choices
4. **Strategic Depth**: Diplomacy as valid alternative to warfare
5. **LLM Strengths**: Leverage AI for nuanced relationship reasoning
6. **Opaque AI Decisions**: Players don't see AI reasoning - diplomacy is mysterious
7. **No Impossible Alliances**: Even blood enemies can ally under extreme circumstances
8. **Dynamic Trust**: Relationships require maintenance and decay over time

### Key Design Decisions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Permanent enemies? | **No** - use extreme negative trust instead | Even Wolf/Falcon could ally vs existential threat; creates better stories |
| AI transparency? | **No** - opaque with post-hoc intel hints | Mystery and surprise make diplomacy engaging |
| Treaty limits? | **Soft cap via Diplomatic Bandwidth** | Personality-driven, not arbitrary rules |
| Trust decay? | **Yes** - relationships require maintenance | Like NATO/Trump: inaction breeds distrust |

---

## 2. Diplomatic Actions

### 2.1 Treaty Types

| Treaty Type | Duration | Effects | Breaking Penalty |
|-------------|----------|---------|------------------|
| **Non-Aggression Pact (NAP)** | 12 months | Cannot attack each other | -30 trust, minor reputation hit |
| **Trade Agreement** | Permanent until cancelled | +10% economy for both | -15 trust |
| **Military Access** | Permanent until cancelled | Can move through territory | -20 trust |
| **Defensive Alliance** | Permanent until cancelled | Must defend if ally attacked | -50 trust, major reputation hit |
| **Offensive Alliance** | 6 months | Coordinate attacks on target | -40 trust if abandon ally |
| **Tributary Status** | Permanent until revolt | Protection for C-bills/resources | N/A (revolt is expected) |
| **Confederation** | Permanent | Act as single faction in wars | -70 trust, faction split possible |

### 2.2 One-Time Diplomatic Actions

| Action | Description | Requirements |
|--------|-------------|--------------|
| **Propose Treaty** | Offer any treaty type | Trust > -50 (varies by type) |
| **Break Treaty** | End existing agreement | Willingness to accept penalties |
| **Demand Tribute** | Force weaker faction to pay | Military power > 2x target |
| **Cede System** | Give up a system peacefully | Desperate or strategic |
| **Request System** | Ask for system transfer | High trust or leverage |
| **Trade Systems** | Exchange territories | Mutual agreement |
| **Declare Rivalry** | Formal enmity declaration | Lowers trust floor, increases aggression |
| **Sue for Peace** | End ongoing war | Losing or exhausted |
| **Offer Mercenary Contract** | Hire faction to fight | C-bills, target specification |
| **Mediate Conflict** | Third party peace broker | Neutral status, diplomatic skill |

### 2.3 Clan-Specific Diplomacy

Clans have unique diplomatic mechanics based on their culture:

| Action | Description | Clan-Only |
|--------|-------------|-----------|
| **Trial of Possession** | Bid forces for a system | Yes |
| **Trial of Refusal** | Challenge political decision | Yes |
| **Absorption** | Merge defeated Clan | Yes |
| **Abjuration** | Exile from Clan society | Yes |
| **Safcon** | Safe passage guarantee | Yes |
| **Hegira** | Honorable retreat offer | Yes |

---

## 3. Trust & Relationship System

### 3.1 Trust Score

Each faction pair maintains a **Trust Score** from -100 to +100:

```
-100 to -75: Blood Feud (will never ally, permanent war likely)
-74 to -50:  Hostile (war likely, no treaties possible)
-49 to -25:  Suspicious (NAPs possible, but fragile)
-24 to 0:    Cool (basic treaties possible)
1 to 25:     Neutral (most treaties possible)
26 to 50:    Warm (alliances possible)
51 to 75:    Friendly (strong alliances, unlikely to break)
76 to 100:   Allied (confederation possible, will sacrifice for ally)
```

### 3.2 Trust Modifiers

**Positive Modifiers:**
- Honored treaty for 12 months: +5
- Joint military victory: +10
- Defended ally when attacked: +15
- Gave favorable system trade: +5 to +15
- Shared enemy defeated: +10
- Historical alliance (lore): +20 starting bonus

**Negative Modifiers:**
- Broke treaty: -30 to -70 (by treaty type)
- Attacked without declaration: -40
- Refused to defend ally: -25
- Demanded tribute: -15
- Betrayed to common enemy: -50
- Historical enmity (lore): -20 starting penalty

### 3.3 Faction Memory

Factions remember:
- Last 10 diplomatic interactions with each faction
- All treaty breaks (permanent memory, decaying impact)
- War outcomes (who won, casualties)
- Betrayals (never fully forgotten)

### 3.4 Trust Decay System

Trust relationships require active maintenance. Without interaction, trust naturally decays toward neutrality (0), but betrayals leave permanent scars.

**Monthly Trust Decay Formula:**

```csharp
public int CalculateTrustDecay(string faction1, string faction2)
{
    var state = GetRelationshipState(faction1, faction2);
    float baseDecay = 0.5f;  // Natural monthly drift toward neutrality

    // Inactivity accelerates decay
    if (state.MonthsSincePositiveInteraction > 6)
        baseDecay *= 1.5f;
    if (state.MonthsSinceAnyInteraction > 12)
        baseDecay *= 2.0f;

    // Very high trust decays slower (established relationships)
    if (state.CurrentTrust > 50)
        baseDecay *= 0.5f;

    // Decay toward 0, not past it
    if (state.CurrentTrust > 0)
        return -(int)Math.Ceiling(baseDecay);
    else if (state.CurrentTrust < 0)
        return (int)Math.Ceiling(baseDecay);
    else
        return 0;
}
```

**Betrayal Scars:**

When a faction breaks a treaty, the victim's trust floor is permanently lowered:

```csharp
public void ApplyBetrayalScar(string betrayer, string victim, int trustAtBreak)
{
    var state = GetRelationshipState(victim, betrayer);

    // Trust can never fully recover after betrayal
    // Each betrayal lowers the maximum possible trust
    int scarDepth = 20;  // Base scar
    if (state.BetrayalCount > 1)
        scarDepth += (state.BetrayalCount - 1) * 10;  // Repeat offenders

    state.TrustCeiling = Math.Min(state.TrustCeiling, trustAtBreak - scarDepth);
    state.BetrayalCount++;

    // Example: Trust was 40 when Liao betrayed Davion
    // New ceiling: 40 - 20 = 20
    // Davion can never trust Liao above 20 again
    // Second betrayal: ceiling drops to 20 - 30 = -10
}
```

**Real-World Parallel**: Like NATO's reduced trust in the US after Trump's unpredictable foreign policy - allies remember when you waver.

---

## 4. Personality Integration

### 4.1 Personality Traits Affecting Diplomacy

| Trait | High Value Effect | Low Value Effect |
|-------|-------------------|------------------|
| **Honor** | Keeps agreements, won't betray | Will break treaties when profitable |
| **Diplomacy** | Prefers negotiation, seeks treaties | Prefers military solutions |
| **Opportunism** | Exploits weak allies, timely betrayals | Loyal even when costly |
| **Aggressiveness** | Demands tribute, offensive alliances | Defensive pacts, avoids conflict |
| **Defensiveness** | Seeks protective alliances | Self-reliant, fewer treaties |

### 4.2 Betrayal Calculation

The AI evaluates potential betrayal using:

```
BetrayalScore =
  (Opportunism × GainFromBetrayal)
  - (Honor × TrustPenalty)
  - (Diplomacy × ReputationDamage)
  + (Aggressiveness × WarReadiness)
  - (CurrentTrust × LoyaltyFactor)
```

If `BetrayalScore > BetrayalThreshold`, the AI considers betrayal.

### 4.3 Faction Archetypes

**The Honorable (Kurita, Eridani Light Horse)**
- High honor, moderate diplomacy
- Will keep treaties even at cost
- Betrayal is shameful, avoided unless survival at stake

**The Pragmatist (Davion, Steiner)**
- Moderate all traits
- Keeps treaties when beneficial
- Will break if clearly advantageous and cost acceptable

**The Schemer (Liao, ComStar)**
- Low honor, high opportunism
- Treaties are tools, not commitments
- Constantly evaluating betrayal opportunities

**The Merchant (Sea Fox, Canopus)**
- High diplomacy, low aggressiveness
- Prefers trade to war
- Treaties are business deals

**The Warrior (Jade Falcon, Smoke Jaguar)**
- Low diplomacy, high aggressiveness
- Respects strength, not paper
- Trials > treaties

---

## 5. AI Decision Framework

### 5.1 Diplomatic Decision Types

Each monthly tick, factions evaluate:

1. **Maintain Current Treaties** - Are existing agreements still beneficial?
2. **Seek New Treaties** - Who would be a good ally/partner?
3. **Betray Existing Ally** - Is now the time to strike?
4. **Respond to Proposals** - Accept/reject incoming offers
5. **War or Peace** - Continue fighting or negotiate end?

### 5.2 LLM Prompt Structure

```
DIPLOMATIC SITUATION:
- Current treaties: [list]
- Pending proposals: [list]
- Recent events: [list]
- Trust levels with neighbors: [list]

Your faction personality:
- Honor: {value} - {interpretation}
- Diplomacy: {value} - {interpretation}
- Opportunism: {value} - {interpretation}

EVALUATE:
1. Should you propose any new treaties? With whom and why?
2. Should you break any existing treaties? The consequences would be {penalties}.
3. How do you respond to pending proposals?
4. Are there any betrayal opportunities worth considering?

Respond with your diplomatic decisions and reasoning.
```

### 5.3 Decision Validation

The system validates AI decisions:
- Can't propose treaty to faction at war with
- Can't break treaty that doesn't exist
- Can't accept proposal that was never made
- Power requirements met for demands

---

## 6. State Management

### 6.1 New State Classes

```csharp
public class DiplomaticState
{
    public Dictionary<string, Dictionary<string, Treaty>> ActiveTreaties;
    public Dictionary<string, Dictionary<string, int>> TrustScores;
    public Dictionary<string, Dictionary<string, List<DiplomaticEvent>>> History;
    public List<TreatyProposal> PendingProposals;
}

public class Treaty
{
    public string Type;           // "NAP", "Alliance", etc.
    public string Faction1;
    public string Faction2;
    public int StartDay;
    public int? EndDay;           // null = permanent
    public string Status;         // "active", "broken", "expired"
    public Dictionary<string, object> Terms;  // Custom terms
}

public class TreatyProposal
{
    public string ProposingFaction;
    public string TargetFaction;
    public string TreatyType;
    public Dictionary<string, object> Terms;
    public int ProposedDay;
    public int ExpiresDay;        // Auto-reject if not answered
    public string Status;         // "pending", "accepted", "rejected", "expired"
}

public class DiplomaticEvent
{
    public int Day;
    public string Type;           // "treaty_signed", "treaty_broken", "betrayal", etc.
    public string Description;
    public int TrustChange;
}
```

### 6.2 Galaxy State Extension

```csharp
public class GalaxyState
{
    // Existing fields...

    // New diplomacy fields
    public DiplomaticState diplomacy;

    // Helper methods
    public int GetTrust(string faction1, string faction2);
    public void ModifyTrust(string faction1, string faction2, int delta, string reason);
    public List<Treaty> GetTreaties(string factionId);
    public bool HasTreaty(string faction1, string faction2, string treatyType);
    public bool AreAllies(string faction1, string faction2);
    public bool AreAtWar(string faction1, string faction2);
}
```

---

## 7. Resolution Mechanics

### 7.1 Treaty Proposal Flow

```
1. Faction A proposes treaty to Faction B
2. Proposal added to PendingProposals
3. Next tick, Faction B evaluates proposal
4. B accepts or rejects based on:
   - Trust level with A
   - Strategic benefit
   - Personality alignment
   - Current situation
5. If accepted:
   - Treaty created
   - Trust +5 for both factions
   - Event logged
6. If rejected:
   - Trust -5 for proposer (embarrassment)
   - Cooldown before re-proposing
```

### 7.2 Treaty Breaking Flow

```
1. Faction A decides to break treaty with B
2. System calculates penalties:
   - Trust penalty applied
   - Reputation damage (other factions trust A less)
   - If defensive alliance, B's enemies may attack
3. Treaty marked as "broken"
4. Event logged with full context
5. B's AI evaluates response:
   - Declare war?
   - Seek new allies?
   - Accept and move on?
```

### 7.3 War Declaration & Peace

```
War Declaration:
1. Faction A declares war on B
2. Any NAP/Alliance with B is broken (penalties apply)
3. A's allies evaluate: join war or refuse (trust penalty)
4. B's allies evaluate: join defense or refuse
5. War state created tracking:
   - Participants
   - Start date
   - Systems contested
   - Casualties

Peace Negotiation:
1. Losing/exhausted faction sues for peace
2. Winner can demand:
   - System cessions
   - Tribute payments
   - Treaty terms
3. If terms accepted, war ends
4. If rejected, war continues
5. Third party can mediate (neutral faction)
```

---

## 8. Player Integration

### 8.1 Player Influence

Players can influence their faction's diplomacy:

| Influence Level | Capabilities |
|-----------------|--------------|
| **Member** | See diplomatic status, suggest actions |
| **Trusted** | Vote on major decisions, veto minor treaties |
| **Leader** | Direct control of diplomatic decisions |

### 8.2 Player Actions

- **Suggest Treaty**: Propose alliance/NAP to AI faction leader
- **Oppose Treaty**: Argue against pending proposal
- **Request Intervention**: Ask faction to help your personal enemies
- **Deliver Message**: Act as diplomatic envoy between factions
- **Mercenary Diplomacy**: Your contract success/failure affects faction relations

---

## 9. Event System Integration

### 9.1 New Event Types

```csharp
public static class DiplomaticEventTypes
{
    public const string TreatySigned = "treaty_signed";
    public const string TreatyBroken = "treaty_broken";
    public const string TreatyExpired = "treaty_expired";
    public const string ProposalMade = "proposal_made";
    public const string ProposalAccepted = "proposal_accepted";
    public const string ProposalRejected = "proposal_rejected";
    public const string WarDeclared = "war_declared";
    public const string PeaceSigned = "peace_signed";
    public const string BetrayalDetected = "betrayal";
    public const string TributeDemanded = "tribute_demanded";
    public const string TributePaid = "tribute_paid";
    public const string SystemTraded = "system_traded";
    public const string AllianceHonored = "alliance_honored";
    public const string AllianceRefused = "alliance_refused";
}
```

### 9.2 Event Descriptions

Events should be narrative and faction-flavored:

```
// Liao signs treaty
"Chancellor Liao has graciously agreed to a non-aggression pact with the
Federated Suns, describing it as 'a temporary measure while we attend to
more pressing matters.' Diplomatic observers note the Chancellor's fingers
were crossed during the signing ceremony."

// Kurita breaks treaty
"In an unprecedented break with tradition, the Coordinator has terminated
the defensive alliance with the Free Worlds League. Court observers report
the Coordinator spent three days in meditation before making this decision,
suggesting the move was not taken lightly."
```

---

## 10. Diplomatic Bandwidth System

Rather than hard treaty limits, factions are constrained by **Diplomatic Bandwidth** - representing the attention and resources available for maintaining relationships.

### 10.1 Bandwidth Calculation

```csharp
public int CalculateDiplomaticBandwidth(FactionData faction)
{
    // Base bandwidth for any faction
    int baseBandwidth = 3;

    // Diplomacy trait is primary modifier (0.0 to 1.0)
    float diplomacyBonus = faction.Personality.Diplomacy * 4;  // 0 to 4

    // Large factions have more diplomatic corps
    int systemBonus = faction.SystemCount / 20;  // +1 per 20 systems

    return baseBandwidth + (int)diplomacyBonus + systemBonus;
}
```

**Example Bandwidths:**
- Sea Fox (Diplomacy: 0.9, 15 systems): 3 + 3 + 0 = 6 bandwidth
- Jade Falcon (Diplomacy: 0.15, 60 systems): 3 + 0 + 3 = 6 bandwidth
- Circinus Federation (Diplomacy: 0.2, 8 systems): 3 + 0 + 0 = 3 bandwidth

### 10.2 Treaty Bandwidth Costs

| Treaty Type | Bandwidth Cost | Notes |
|-------------|----------------|-------|
| Non-Aggression Pact | 1 | Low maintenance |
| Trade Agreement | 1 | Bureaucrats handle it |
| Military Access | 2 | Requires coordination |
| Defensive Alliance | 3 | High commitment |
| Offensive Alliance | 3 | Active coordination |
| Tributary (as lord) | 2 | Managing vassal |
| Tributary (as vassal) | 1 | Just pay tribute |
| Confederation | 5 | Near-merger complexity |

### 10.3 Exceeding Bandwidth

Factions *can* exceed their bandwidth, but suffer penalties:

```csharp
public float GetOverextensionPenalty(FactionData faction)
{
    int used = CalculateUsedBandwidth(faction);
    int max = CalculateDiplomaticBandwidth(faction);

    if (used <= max)
        return 0f;

    int overextended = used - max;

    // Each point over bandwidth increases betrayal likelihood
    // and treaty failure chance
    return overextended * 0.1f;  // 10% per point over
}
```

**Effects of Overextension:**
- +10% betrayal score per point (AI more likely to break treaties)
- Treaty proposals more likely rejected (other factions notice strain)
- Trust decay accelerates (can't maintain all relationships)
- Random treaty failures (bureaucratic mistakes)

### 10.4 Preventing Stalemates

- Overextended factions are unstable
- Long-term allies may demand more (mission creep)
- Third parties can destabilize alliances
- Hegemon penalty: factions fear the strongest

### 10.5 Preventing Snowballing

- Large alliances consume massive bandwidth
- Counter-alliances form naturally
- Betrayal becomes more tempting as ally grows strong
- Tributary revolt chance increases over time

### 10.6 Encouraging Dynamism

- Trust decay requires active maintenance
- Random events strain alliances (border incidents, trade disputes)
- Personality drift: new leaders may have different values
- External threats force reevaluation

---

## 11. Implementation Phases

### Phase 1: Foundation (v0.5.0) - COMPLETE
- [x] DiplomaticState class and persistence
- [x] Trust score system
- [x] Basic treaties: NAP, Trade Agreement, Alliance
- [x] Treaty proposal/acceptance flow
- [x] LLM prompt integration for diplomatic decisions

### Phase 2: Depth (v0.5.1) - COMPLETE
- [x] Treaty breaking and consequences
- [x] Betrayal logic and detection
- [x] War declaration and peace negotiation
- [x] System trading
- [x] Reputation system (cross-faction trust impact)

### Phase 3: Polish (v0.5.2) - COMPLETE
- [x] Clan-specific diplomacy (Trials, Safcon, Hegira)
- [x] Player influence integration (PlayerSuggestion system)
- [x] Narrative event generation (NarrativeEvent system)
- [x] Tributary and confederation mechanics
- [x] Third-party mediation (MediationRequest system)

### Phase 4: Advanced (v0.6.0) - DESIGN COMPLETE
- [x] Marriage alliances (Great Houses) - Design in Section 16.1
- [x] Mercenary faction contracts - Design in Section 16.2
- [x] Espionage integration - Design in Section 16.3
- [x] Historical event triggers - Design in Section 16.4
- [x] Multi-faction conferences - Design in Section 16.5

---

## 12. Example Scenarios

### Scenario 1: The Pragmatic Alliance

```
Situation: Wolf Empire is expanding. Davion and Steiner are both threatened.

Turn 1: Steiner proposes defensive alliance to Davion
- Trust: 20 (Warm - historical FedCom)
- Davion evaluates: Common threat, historical ally, acceptable
- Result: Alliance formed

Turn 5: Wolf attacks Steiner
- Alliance triggers: Davion must decide to honor or refuse
- Davion personality: Honor 0.7, so likely honors
- Result: Davion joins war, trust +15

Turn 12: War going poorly
- Steiner proposes peace to Wolf, doesn't consult Davion
- Davion feels betrayed: trust -20
- Alliance strained but not broken
```

### Scenario 2: The Capellan Gambit

```
Situation: Liao is weak, surrounded by enemies

Turn 1: Liao proposes NAP to Davion
- Trust: -80 (Historical enmity)
- Davion suspicious but accepts breathing room
- Result: NAP signed (trust moves to -75)

Turn 3: Liao proposes trade agreement to Canopus
- Trust: 40 (Traditional allies)
- Canopus accepts
- Liao economy improves

Turn 8: Davion distracted by Kurita war
- Liao evaluates betrayal:
  - Opportunism: 0.95 (very high)
  - Honor: 0.3 (low)
  - Gain: Reclaim lost worlds
  - BetrayalScore: HIGH
- Result: Liao breaks NAP, attacks Davion flank

Turn 9: Aftermath
- Davion trust: -75 → -100 (Blood Feud)
- Other factions trust Liao less (-10 each)
- But Liao gained 3 systems while Davion was distracted
```

### Scenario 3: The Mercenary Triangle

```
Situation: Free Worlds League civil strife

Turn 1: Marik hires Wolf's Dragoons against Regulus
- Dragoons accept contract (profit + maintains neutrality)
- Regulus now hostile to Dragoons

Turn 4: Regulus offers Dragoons double fee to switch sides
- Dragoons evaluate:
  - Honor: 0.8 (very high)
  - Breaking contract would destroy reputation
- Result: Dragoons refuse, continue Marik contract

Turn 6: Contract complete, Regulus defeated
- Marik trust in Dragoons: +20
- Dragoons reputation enhanced
- Regulus grudge (will never hire Dragoons)
```

---

## 13. Technical Considerations

### 13.1 Performance

- Diplomatic calculations run monthly (same as combat)
- Trust updates are O(1) dictionary operations
- Treaty evaluation: O(n) where n = active treaties
- Betrayal calculation: O(1) per faction pair

### 13.2 Persistence

```json
{
  "diplomacy": {
    "treaties": [
      {
        "id": "treaty_001",
        "type": "DefensiveAlliance",
        "factions": ["Davion3150", "Steiner3150"],
        "startDay": 150,
        "status": "active"
      }
    ],
    "trust": {
      "Davion3150": {
        "Steiner3150": 45,
        "Liao3150": -85,
        "Kurita3150": -30
      }
    },
    "proposals": [],
    "history": {}
  }
}
```

### 13.3 WIIC Integration

- Alliances could affect WIIC attack targeting
- Defensive pacts trigger WIIC reinforcement spawns
- Treaty breaks could spawn "betrayal" flareups

---

## 14. Design Questions (Resolved)

| # | Question | Decision | Implementation |
|---|----------|----------|----------------|
| 1 | **Permanent Enemies**: Should some faction pairs be unable to ally? | **No** - Use extreme negative trust instead | Initial trust -100 for blood feuds (Wolf/Falcon). Alliances technically possible but require extraordinary circumstances. Creates better emergent stories. |
| 2 | **AI Transparency**: Should players see AI diplomatic reasoning? | **No** - Opaque with post-hoc intel hints | Players see outcomes, not reasoning. Intel Reports provide "analyst speculation" after events. Mystery makes diplomacy engaging. |
| 3 | **Treaty Limits**: How many treaties can a faction maintain? | **Soft cap via Diplomatic Bandwidth** | No hard limit. Bandwidth = 3 + (Diplomacy × 4) + (systems/20). Exceeding causes instability. See Section 10. |
| 4 | **Decay Rate**: How fast should trust decay without interaction? | **0.5/month base, accelerating** | Base decay 0.5/month toward 0. ×1.5 after 6 months inactive, ×2.0 after 12 months. Betrayals leave permanent trust ceilings. See Section 3.4. |
| 5 | **Player Override**: Can players force their faction to break treaties? | **Only at Leader influence level** | Members can suggest, Trusted can veto minor treaties, Leaders have direct control. Aligns with existing influence system. |

---

## 15. Intel Reports System

Since AI reasoning is opaque to players, we provide post-hoc "analyst speculation" through Intel Reports. These add narrative flavor and hints without revealing actual AI decision logic.

### 15.1 Intel Report Generation

Intel Reports are generated after significant diplomatic events:

```csharp
public class IntelReport
{
    public int Day;
    public string EventType;
    public string AnalystSpeculation;  // What analysts "think" happened
    public string Confidence;           // "High", "Medium", "Low"
    public bool IsAccurate;             // Hidden - was speculation correct?
}

public string GenerateIntelSpeculation(DiplomaticEvent evt, FactionData actor)
{
    // LLM generates plausible-sounding analysis
    // May or may not reflect actual AI reasoning
    var templates = new List<string>
    {
        "Analysts believe {faction}'s decision was driven by {speculation}.",
        "Intelligence suggests {faction} acted due to {speculation}.",
        "Sources within {faction} hint that {speculation}.",
        "The timing suggests {faction} was responding to {speculation}."
    };

    // Speculation based on observable factors, not AI internals
    var factors = new List<string>();
    if (evt.InvolvesTerritory) factors.Add("territorial concerns");
    if (evt.InvolvesEconomy) factors.Add("economic pressure");
    if (evt.InvolvesThirdParty) factors.Add($"developments with {thirdParty}");
    if (actor.RecentLosses) factors.Add("recent military setbacks");

    return FormatSpeculation(templates, factors, evt.Confidence);
}
```

### 15.2 Example Intel Reports

**After Liao Breaks NAP with Davion:**
```
INTEL REPORT - PRIORITY: HIGH
Date: Day 245
Event: Capellan Confederation terminates Non-Aggression Pact

ANALYST ASSESSMENT (Confidence: Medium)
"The Chancellor's decision appears opportunistic. Analysts note that
Davion's ongoing conflict with the Combine has stretched their
defensive forces thin along the Capellan border. The timing suggests
Chancellor Liao was waiting for precisely this moment. Whether this
represents a calculated long-term strategy or impulsive opportunism
remains unclear."

NOTE: This assessment represents analyst speculation based on
available intelligence and may not reflect actual Capellan intentions.
```

**After Surprising Alliance:**
```
INTEL REPORT - PRIORITY: MEDIUM
Date: Day 312
Event: Ghost Bear Dominion signs Defensive Alliance with Wolf Empire

ANALYST ASSESSMENT (Confidence: Low)
"This alliance caught most observers off guard given the Dominion's
previous opposition to ilClan. Sources suggest growing concern about
Jade Falcon expansion may have forced a pragmatic reassessment.
Alternative theories include pressure from Rasalhague elements within
the Dominion government. The true motivation remains opaque."
```

### 15.3 Confidence Levels

| Level | Meaning | When Used |
|-------|---------|-----------|
| **High** | Speculation likely accurate | Predictable actions matching personality |
| **Medium** | Reasonable guess | Actions with multiple plausible explanations |
| **Low** | Mostly speculation | Surprising or out-of-character actions |

### 15.4 Report Frequency

- **Major Events**: Always generate report (alliance formed/broken, war declared)
- **Minor Events**: 50% chance of report (trade agreement, NAP)
- **Routine**: No report (treaty renewal, tribute payment)

Players can review recent Intel Reports in a dedicated UI panel, creating a "news feed" of galactic politics filtered through imperfect intelligence.

---

## 16. Phase 4: Advanced Diplomacy (v0.6.0)

This section details the advanced diplomatic features that build upon the foundation of Phases 1-3.

### 16.1 Marriage Alliances (Great Houses)

Marriage alliances are a powerful diplomatic tool unique to the Great Houses and some Periphery states. They create deeper bonds than standard treaties but come with succession complications.

#### 16.1.1 Marriage Alliance Properties

| Property | Description |
|----------|-------------|
| **Eligible Factions** | Great Houses, major Periphery states (Canopus, Taurian, etc.) |
| **Trust Requirement** | +50 minimum |
| **Bandwidth Cost** | 4 (higher than confederation) |
| **Duration** | Permanent until spouse death or annulment |
| **Breaking Penalty** | -80 trust, major reputation hit |

#### 16.1.2 Marriage Types

| Type | Effect | Historical Example |
|------|--------|-------------------|
| **Dynasty Merger** | Creates potential for unified rule | Hanse Davion + Melissa Steiner = FedCom |
| **Alliance Marriage** | Strong defensive alliance with heir ties | Liao-Marik marriages |
| **Political Marriage** | NAP + trade with succession influence | Various minor house marriages |

#### 16.1.3 Succession Events

Marriages create succession complications:

```csharp
public class MarriageAlliance
{
    public string id { get; set; }
    public string faction1 { get; set; }
    public string faction2 { get; set; }
    public string spouse1Name { get; set; }
    public string spouse2Name { get; set; }
    public int marriageDay { get; set; }
    public List<Heir> heirs { get; set; } = new List<Heir>();
    public bool hasSuccessionCrisis { get; set; } = false;
    public string dominantFaction { get; set; } // Which house "won" the marriage
}

public class Heir
{
    public string name { get; set; }
    public string primaryLoyalty { get; set; } // faction1 or faction2
    public float faction1Claim { get; set; } // 0.0 to 1.0
    public float faction2Claim { get; set; }
    public int birthDay { get; set; }
    public bool isRuling { get; set; } = false;
}
```

#### 16.1.4 Marriage Proposal Flow

1. AI considers marriage when:
   - Trust > 50 with target
   - Both factions are Great Houses or major Periphery
   - Strategic benefit (shared enemy, border security)
   - No existing marriage alliance with target

2. Marriage creates:
   - Automatic defensive alliance
   - Trade agreement
   - Military access
   - Heir generation (random event after 1-5 years)

3. Succession events can trigger:
   - Unified rule (rare, requires specific conditions)
   - Disputed succession (civil war possible)
   - Heir choosing one faction over another

#### 16.1.5 Marriage Breaking

Unlike treaties, marriages are extremely hard to break:
- **Annulment**: Requires very low trust (-50), massive reputation hit
- **Spouse Death**: Natural dissolution, moderate mourning bonus then free
- **Betrayal Marriage**: If one spouse faction attacks other, divorce automatic with max penalties

---

### 16.2 Mercenary Faction Contracts

Mercenary factions operate differently from states - they sell military service rather than pursuing territorial expansion.

#### 16.2.1 Mercenary Contract Properties

```csharp
public class MercenaryContract
{
    public string id { get; set; }
    public string mercenaryFaction { get; set; }
    public string employer { get; set; }
    public string contractType { get; set; } // MercenaryContractTypes
    public string targetFaction { get; set; } // For offensive contracts
    public string targetRegion { get; set; } // For garrison contracts
    public int startDay { get; set; }
    public int endDay { get; set; }
    public int paymentPerMonth { get; set; }
    public int completionBonus { get; set; }
    public float salvageRights { get; set; } // 0.0 to 1.0
    public bool exclusivity { get; set; } // Can't take other contracts vs employer
    public string status { get; set; } // active, completed, breached
}
```

#### 16.2.2 Contract Types

| Type | Duration | Description | Payment Modifier |
|------|----------|-------------|------------------|
| **Objective Raid** | 1-3 months | Strike specific target | 1.5x |
| **Garrison Duty** | 6-12 months | Defend specific systems | 0.8x |
| **Planetary Assault** | 3-6 months | Take and hold systems | 2.0x |
| **Cadre Training** | 3-6 months | Train employer's forces | 0.7x |
| **Pirate Hunting** | 3-12 months | Clear pirate activity | 1.0x |
| **Recon-in-Force** | 1-2 months | Intelligence gathering | 1.2x |
| **Extraction** | Variable | Rescue/retrieve mission | 1.8x |

#### 16.2.3 Contract Negotiation

Mercenaries evaluate contracts based on:

```
ContractScore =
  (PaymentValue × MercenaryOpportunism)
  - (RiskLevel × MercenaryDefensiveness)
  + (EmployerReputation × MercenaryHonor)
  - (ConflictWithValues × MercenaryHonor)
```

**Risk Factors:**
- Target faction military strength
- Distance from merc HQ
- Contract length
- Exclusivity clauses

**Value Factors:**
- Base payment
- Salvage rights
- Future contract likelihood
- Reputation boost

#### 16.2.4 Contract Completion/Breach

**Successful Completion:**
- Trust +10 between merc and employer
- Reputation +3 for mercenary
- Completion bonus paid
- Priority for future contracts

**Contract Breach (by employer):**
- Trust -30 with mercenary
- Reputation -10 for employer
- Mercenaries spread the word (other mercs trust employer less)

**Contract Breach (by mercenary):**
- Trust -50 with employer
- Reputation -15 for mercenary
- MRB rating drops
- Future contracts harder to get

#### 16.2.5 Mercenary Reputation System

```csharp
public class MercenaryRating
{
    public string factionId { get; set; }
    public int mrbRating { get; set; } // 1-5 stars, affects contract availability
    public int dragoonRating { get; set; } // A-F, combat effectiveness
    public int reliability { get; set; } // 0-100, contract completion rate
    public List<string> specializations { get; set; } // raid, garrison, recon, etc.
    public Dictionary<string, int> factionStanding { get; set; } // Trust with employers
}
```

---

### 16.3 Espionage Integration

Espionage provides a covert alternative to diplomacy, allowing factions to gather intelligence and conduct operations without formal diplomatic relations.

#### 16.3.1 Intelligence Operations

| Operation | Cost | Risk | Effect |
|-----------|------|------|--------|
| **Surveillance** | Low | Low | Reveal faction's current wars/treaties |
| **Economic Intel** | Medium | Low | Reveal resource levels and trade flows |
| **Military Intel** | Medium | Medium | Reveal force dispositions and strengths |
| **Political Intel** | High | Medium | Reveal AI decision factors and pending proposals |
| **Sabotage** | High | High | Damage production, slow military |
| **Assassination** | Very High | Very High | Leadership change, succession crisis |
| **False Flag** | Very High | High | Damage relations between two other factions |

#### 16.3.2 Intelligence Agency Traits

Each faction's espionage capability is defined by:

```csharp
public class IntelligenceAgency
{
    public string factionId { get; set; }
    public string agencyName { get; set; } // ROM, Maskirovka, MIIO, ISF, LIC, Safe
    public float offensiveCapability { get; set; } // 0.0 to 1.0
    public float defensiveCapability { get; set; } // Counter-intelligence
    public float ethicalConstraints { get; set; } // Limits on dirty ops
    public List<string> specializations { get; set; }
}
```

**Faction Intelligence Agencies:**

| Faction | Agency | Offensive | Defensive | Ethics | Specialization |
|---------|--------|-----------|-----------|--------|----------------|
| Capellan | Maskirovka | 0.9 | 0.7 | 0.2 | Assassination, False Flag |
| Davion | MIIO/AFFS Intel | 0.7 | 0.8 | 0.6 | Military Intel, Surveillance |
| Kurita | ISF | 0.8 | 0.75 | 0.4 | Political Intel, Assassination |
| Steiner | LIC | 0.65 | 0.85 | 0.5 | Economic Intel, Counter-Intel |
| Marik | SAFE | 0.6 | 0.6 | 0.5 | Surveillance, Political Intel |
| ComStar | ROM | 0.85 | 0.9 | 0.3 | All operations |
| Wolf Empire | Watch | 0.7 | 0.8 | 0.6 | Military Intel |

#### 16.3.3 Detection and Consequences

When an operation is detected:

```
DetectionChance =
  (OperationRisk × TargetDefensiveCapability)
  - (AgentSkill × OperatingFactionOffensiveCapability)
  + RandomFactor
```

**Consequences of Detection:**
- Minor Operation: Trust -15, diplomatic incident
- Major Operation: Trust -30, possible war justification
- Assassination Attempt: Trust -50, near-certain war

#### 16.3.4 Intel Reports from Espionage

Successful espionage generates special Intel Reports:

```
INTELLIGENCE REPORT - CLASSIFICATION: SECRET
Source: Maskirovka Asset JADE-7
Date: Day 456
Subject: Davion Military Readiness

ASSESSMENT (Confidence: High)
"Asset reports significant AFFS redeployment along Capellan March.
Three RCTs observed moving to forward positions. Economic analysis
suggests Davion can sustain offensive operations for 8-12 months.
Recommend defensive posture along Victoria Corridor."

NOTE: This intelligence was obtained through covert means.
Reliability assessed as HIGH based on source track record.
```

---

### 16.4 Historical Event Triggers

Historical events can be triggered based on date, faction state, or player actions, creating lore-accurate narrative moments.

#### 16.4.1 Event Structure

```csharp
public class HistoricalEvent
{
    public string id { get; set; }
    public string name { get; set; }
    public string description { get; set; }
    public EventTrigger trigger { get; set; }
    public List<EventEffect> effects { get; set; }
    public bool isRepeatable { get; set; } = false;
    public string era { get; set; } // Which era this applies to
}

public class EventTrigger
{
    public string type { get; set; } // date, condition, random
    public int? triggerDay { get; set; }
    public string conditionExpression { get; set; }
    public float randomChance { get; set; }
}

public class EventEffect
{
    public string type { get; set; }
    public Dictionary<string, object> parameters { get; set; }
}
```

#### 16.4.2 Era-Specific Historical Events

**3025 Era (Succession Wars):**
| Event | Trigger | Effect |
|-------|---------|--------|
| Helm Memory Core | Day ~300 | Tech boost to discovering faction, trust shift |
| Fourth Succession War | Condition: FedSuns strong | Major war event |
| Andurien Secession | Condition: FWL internal strife | Duchy independence |

**3050 Era (Clan Invasion):**
| Event | Trigger | Effect |
|-------|---------|--------|
| Battle of Tukayyid | Day ~365 | 15-year truce with Clans |
| Refusal War | Day ~200 | Wolf/Falcon internal conflict |
| Combine-FedCom Alliance | Early | Temporary alliance vs Clans |

**3062 Era (Civil War):**
| Event | Trigger | Effect |
|-------|---------|--------|
| Operation Bulldog | Day ~90 | Multi-faction assault on Smoke Jaguar |
| Huntress Assault | Day ~180 | Smoke Jaguar destruction |
| Tukayyid Truce Ends | Day 1825 | Clans free to advance |

**3131 Era (Dark Age):**
| Event | Trigger | Effect |
|-------|---------|--------|
| Gray Monday | Day 1 | HPG network destroyed |
| Fortress Republic | Day ~30 | Republic isolation |
| Capellan Crusade | Ongoing | Capellan expansion war |

#### 16.4.3 Conditional Events

Events can trigger based on game state:

```csharp
// Example: Succession Crisis triggers when ruler changes
new HistoricalEvent
{
    id = "succession_crisis",
    name = "Succession Crisis",
    trigger = new EventTrigger
    {
        type = "condition",
        conditionExpression = "faction.leaderChanged && faction.hasMultipleHeirs"
    },
    effects = new List<EventEffect>
    {
        new EventEffect { type = "civil_war_chance", parameters = { { "chance", 0.3 } } },
        new EventEffect { type = "trust_decay_all", parameters = { { "amount", -10 } } }
    }
}
```

---

### 16.5 Multi-Faction Conferences

Major diplomatic gatherings where multiple factions negotiate simultaneously.

#### 16.5.1 Conference Types

| Type | Participants | Purpose | Example |
|------|--------------|---------|---------|
| **Peace Conference** | Warring factions + mediator | End multi-faction war | Whitting Conference |
| **Alliance Summit** | Allied factions | Coordinate strategy | Star League Council |
| **Trade Summit** | Trading partners | Economic agreements | Mercantile conferences |
| **Crisis Summit** | Affected factions | Address shared threat | Anti-Clan coalition |

#### 16.5.2 Conference Structure

```csharp
public class DiplomaticConference
{
    public string id { get; set; }
    public string conferenceType { get; set; }
    public string host { get; set; }
    public string location { get; set; }
    public int startDay { get; set; }
    public int endDay { get; set; }
    public List<string> participants { get; set; }
    public List<ConferenceAgendaItem> agenda { get; set; }
    public List<ConferenceResolution> resolutions { get; set; }
    public string status { get; set; } // proposed, in_progress, concluded, failed
}

public class ConferenceAgendaItem
{
    public string topic { get; set; }
    public string proposer { get; set; }
    public Dictionary<string, string> factionPositions { get; set; } // faction -> support/oppose/neutral
    public bool resolved { get; set; } = false;
    public string resolution { get; set; }
}

public class ConferenceResolution
{
    public string text { get; set; }
    public List<string> signatories { get; set; }
    public List<Treaty> treatiesCreated { get; set; }
    public int agreementDay { get; set; }
}
```

#### 16.5.3 Conference Mechanics

**Calling a Conference:**
1. Host faction proposes conference
2. Invitations sent to relevant factions
3. Factions decide to attend based on:
   - Trust with host
   - Stake in conference topics
   - Current diplomatic bandwidth

**During Conference:**
1. Each agenda item discussed
2. Factions state positions
3. Negotiations happen (AI evaluates proposals)
4. Resolutions drafted and signed

**Conference Outcomes:**
- **Success**: Multiple treaties signed, trust boost for all
- **Partial Success**: Some agreements, some failed
- **Failure**: No agreements, trust penalties for obstructionists
- **Walkout**: Faction leaves early, major reputation hit

#### 16.5.4 AI Conference Behavior

```
ConferenceDecision =
  (AgendaBenefit × Opportunism)
  + (HostTrust × Diplomacy)
  - (ConferenceCost × Defensiveness)
  + (SharedThreatLevel × 2.0)
```

Factions evaluate each agenda item:
- Support if benefits them or hurts enemy
- Oppose if hurts them or benefits enemy
- Neutral if balanced or irrelevant

#### 16.5.5 Example: Star League Reformation Conference

```
CONFERENCE: Star League Reformation Summit
Host: Wolf Empire
Location: Terra
Date: Day 2847
Participants: Wolf Empire, Jade Falcon, Ghost Bear, Davion, Steiner, Kurita

AGENDA:
1. Recognition of ilClan status
   - Wolf: Support, Falcon: Oppose, Others: Neutral/Oppose
   - Resolution: FAILED

2. Mutual defense against external threats
   - All factions: Cautious Support
   - Resolution: PASSED (defensive pact created)

3. Trade normalization
   - Most factions: Support
   - Resolution: PASSED (trade agreements created)

OUTCOME: Partial Success
- Defensive Pact formed (5 factions)
- Trade Agreements (4 bilateral)
- ilClan recognition failed
- Ghost Bear walked out on item 1
```

---

## 17. References

- BattleTech lore: Sarna.net faction relationships
- Game theory: Prisoner's dilemma, repeated games
- Existing 4X games: Civilization, Stellaris diplomacy systems
- AIEmpires existing personality system
- Real-world diplomacy: NATO alliance dynamics, trust erosion patterns

---

## Appendix A: Initial Trust Matrix (3151 Era)

Key relationships to pre-configure:

| Faction A | Faction B | Initial Trust | Reason |
|-----------|-----------|---------------|--------|
| Wolf Empire | Jade Falcon | -100 | Blood feud |
| Davion | Liao | -85 | Historical enmity |
| Davion | Steiner | 35 | FedCom legacy |
| Kurita | Davion | -50 | Historical rivals |
| Steiner | Tamar Pact | -50 | Breakaway state |
| Canopus | Liao | 40 | Trinity Alliance |
| Ghost Bear | Wolf Empire | -30 | Refused ilClan |
| Sea Fox | Everyone | 20 | Merchants |

---

*Document Status: v0.3 Complete - Phases 1-3 implemented in DiplomaticState.cs. Phase 4 fully designed and ready for implementation.*
