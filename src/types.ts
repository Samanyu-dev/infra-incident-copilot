export interface Incident {
  id: string;
  symptom: string;
  deployCheck: string;
  metricCheck: string;
  resolution: string;
  timestamp: number;
}

export interface AgentState {
  incidents: Incident[];
}

export interface TriageResult {
  reply: string;
  steps: {
    similar: string | null;
    deployCheck: string;
    metricCheck: string;
  };
}
