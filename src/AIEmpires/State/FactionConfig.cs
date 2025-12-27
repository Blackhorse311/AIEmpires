using System.Collections.Generic;

namespace AIEmpires.State
{
    public class FactionConfig
    {
        public string schemaVersion { get; set; }
        public List<MajorFaction> majorFactions { get; set; } = new List<MajorFaction>();
        public List<string> minorFactions { get; set; } = new List<string>();
        public PlayerFactionThresholds playerFactionThresholds { get; set; }

        public MajorFaction GetFaction(string factionId)
        {
            return majorFactions.Find(f => f.factionId == factionId);
        }

        public bool IsMajorFaction(string factionId)
        {
            return majorFactions.Exists(f => f.factionId == factionId);
        }
    }

    public class MajorFaction
    {
        public string factionId { get; set; }
        public string displayName { get; set; }
        public string capital { get; set; }
        public FactionPersonality personality { get; set; }
        public string systemPrompt { get; set; }
        public string doctrine { get; set; }
        public List<string> priorities { get; set; } = new List<string>();
        public Dictionary<string, int> relationships { get; set; } = new Dictionary<string, int>();
    }

    public class FactionPersonality
    {
        public float aggressiveness { get; set; }
        public float diplomacy { get; set; }
        public float honor { get; set; }
        public float opportunism { get; set; }
        public float defensiveness { get; set; }

        public string GetDominantTrait()
        {
            var max = aggressiveness;
            var trait = "aggressive";

            if (diplomacy > max) { max = diplomacy; trait = "diplomatic"; }
            if (honor > max) { max = honor; trait = "honorable"; }
            if (opportunism > max) { max = opportunism; trait = "opportunistic"; }
            if (defensiveness > max) { max = defensiveness; trait = "defensive"; }

            return trait;
        }
    }

    public class PlayerFactionThresholds
    {
        public int join { get; set; }
        public int influence { get; set; }
        public int trusted { get; set; }
    }
}
