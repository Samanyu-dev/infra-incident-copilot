import { checkRecentDeploys, checkMetrics } from "./mockInfra";
import { findSimilarIncident } from "./similarity";
import type { Incident } from "./types";

export interface TriageContext {
  deployCheck: string;
  metricCheck: string;
  similar: Incident | undefined;
  promptContext: string;
}

// The coordination step, pulled out as a pure function so it can be unit
// tested without spinning up the Durable Object runtime or calling Workers AI.
// IncidentAgent.triage() is a thin wrapper: call this, then hand promptContext
// to the LLM, then persist the result to state.
export function buildTriageContext(symptom: string, incidents: Incident[]): TriageContext {
  const similar = findSimilarIncident(symptom, incidents);
  const deployCheck = checkRecentDeploys(symptom);
  const metricCheck = checkMetrics(symptom);

  const promptContext = [
    `Symptom: ${symptom}`,
    `Recent deploy check: ${deployCheck}`,
    `Metric check: ${metricCheck}`,
    similar
      ? `Similar past incident: "${similar.symptom}" was resolved with: ${similar.resolution}`
      : "No similar past incident found in memory.",
  ].join("\n");

  return { deployCheck, metricCheck, similar, promptContext };
}
