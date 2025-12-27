using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;
using AIEmpires.State;

namespace AIEmpires.Services
{
    public class AIServiceClient
    {
        private readonly string _endpoint;
        private readonly int _timeout;

        public AIServiceClient(string endpoint, int timeout)
        {
            _endpoint = endpoint;
            _timeout = timeout;
        }

        public bool CheckHealthSync()
        {
            try
            {
                using (var request = UnityWebRequest.Get($"{_endpoint}/health"))
                {
                    request.timeout = _timeout / 1000;
                    var operation = request.SendWebRequest();

                    // Wait for completion (blocking)
                    while (!operation.isDone)
                    {
                        System.Threading.Thread.Sleep(10);
                    }

                    return request.responseCode == 200;
                }
            }
            catch (Exception e)
            {
                Main.LogError($"Health check failed: {e.Message}");
                return false;
            }
        }

        public AIDecision RequestDecisionSync(DecisionRequest request)
        {
            try
            {
                var json = JsonConvert.SerializeObject(request);
                var bodyBytes = Encoding.UTF8.GetBytes(json);

                using (var webRequest = new UnityWebRequest($"{_endpoint}/decide", "POST"))
                {
                    webRequest.uploadHandler = new UploadHandlerRaw(bodyBytes);
                    webRequest.downloadHandler = new DownloadHandlerBuffer();
                    webRequest.SetRequestHeader("Content-Type", "application/json");
                    webRequest.timeout = _timeout / 1000;

                    var operation = webRequest.SendWebRequest();

                    // Wait for completion (blocking)
                    while (!operation.isDone)
                    {
                        System.Threading.Thread.Sleep(10);
                    }

                    if (webRequest.responseCode == 200)
                    {
                        var responseJson = webRequest.downloadHandler.text;
                        var result = JsonConvert.DeserializeObject<DecisionResponse>(responseJson);

                        return new AIDecision
                        {
                            action = result.action,
                            priority = result.priority,
                            target = result.target,
                            reasoning = result.reasoning,
                            decidedOnDay = request.currentDay,
                            rawResponse = responseJson
                        };
                    }
                    else
                    {
                        Main.LogError($"AI Service returned {webRequest.responseCode}: {webRequest.error}");
                        return null;
                    }
                }
            }
            catch (Exception e)
            {
                Main.LogError($"AI Service request failed: {e.Message}");
                return null;
            }
        }

        public List<AIDecision> RequestBatchDecisionsSync(List<DecisionRequest> requests)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new { requests });
                var bodyBytes = Encoding.UTF8.GetBytes(json);

                using (var webRequest = new UnityWebRequest($"{_endpoint}/decide/batch", "POST"))
                {
                    webRequest.uploadHandler = new UploadHandlerRaw(bodyBytes);
                    webRequest.downloadHandler = new DownloadHandlerBuffer();
                    webRequest.SetRequestHeader("Content-Type", "application/json");
                    webRequest.timeout = _timeout / 1000;

                    var operation = webRequest.SendWebRequest();

                    // Wait for completion (blocking)
                    while (!operation.isDone)
                    {
                        System.Threading.Thread.Sleep(10);
                    }

                    if (webRequest.responseCode == 200)
                    {
                        var responseJson = webRequest.downloadHandler.text;
                        var result = JsonConvert.DeserializeObject<BatchDecisionResponse>(responseJson);

                        var decisions = new List<AIDecision>();
                        foreach (var dr in result.decisions)
                        {
                            decisions.Add(new AIDecision
                            {
                                action = dr.action,
                                priority = dr.priority,
                                target = dr.target,
                                reasoning = dr.reasoning,
                                decidedOnDay = requests[0].currentDay
                            });
                        }
                        return decisions;
                    }
                    else
                    {
                        Main.LogError($"AI Service batch request returned {webRequest.responseCode}: {webRequest.error}");
                        return null;
                    }
                }
            }
            catch (Exception e)
            {
                Main.LogError($"AI Service batch request failed: {e.Message}");
                return null;
            }
        }
    }

    public class DecisionRequest
    {
        public string factionId { get; set; }
        public int currentDay { get; set; }
        public FactionSituation situation { get; set; }
        public List<NeighborInfo> neighbors { get; set; }
        public List<string> recentEvents { get; set; }
        public PlayerInfo playerInfo { get; set; }
    }

    public class FactionSituation
    {
        public int controlledSystems { get; set; }
        public float militaryPower { get; set; }
        public float economicPower { get; set; }
        public List<string> activeWars { get; set; }
        public List<string> currentPriorities { get; set; }
    }

    public class NeighborInfo
    {
        public string factionId { get; set; }
        public string displayName { get; set; }
        public int relationship { get; set; }
        public int sharedBorderSystems { get; set; }
        public float relativePower { get; set; }
        public bool atWar { get; set; }
    }

    public class PlayerInfo
    {
        public bool isMember { get; set; }
        public string membershipLevel { get; set; }
        public int influencePoints { get; set; }
        public string suggestion { get; set; }
    }

    public class DecisionResponse
    {
        public string action { get; set; }
        public int priority { get; set; }
        public string target { get; set; }
        public string reasoning { get; set; }
    }

    public class BatchDecisionResponse
    {
        public List<DecisionResponse> decisions { get; set; }
    }
}
