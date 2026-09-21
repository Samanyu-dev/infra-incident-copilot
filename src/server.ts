import { Agent, routeAgentRequest } from "agents";
import { checkRecentDeploys, checkMetrics } from "./mockInfra";
import { findSimilarIncident } from "./similarity";
import type { AgentState, TriageResult } from "./types";

const SYSTEM_PROMPT = [
  "You are an infrastructure on-call copilot. Given a reported symptom and diagnostic",
  "context gathered from recent deploys and metrics, give a short triage: likely cause,",
  "confidence, and one concrete next step. Be concise, 4-6 sentences max.",
].join(" ");

export class IncidentAgent extends Agent<Env, AgentState> {
  initialState: AgentState = { incidents: [] };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname.endsWith("/chat")) {
      const { message } = await request.json<{ message: string }>();
      const result = await this.triage(message);
      return Response.json(result);
    }

    if (request.method === "GET" && url.pathname.endsWith("/history")) {
      return Response.json({ incidents: this.state.incidents });
    }

    return new Response("Not found", { status: 404 });
  }

  // This is the workflow/coordination step: a fixed sequence of checks that
  // narrows down the incident before handing context to the LLM. Runs well
  // under 30s, so it lives directly on the Agent instead of a separate
  // Workflow instance (see Cloudflare's own Agent-vs-Workflow guidance).
  private async triage(symptom: string): Promise<TriageResult> {
    const similar = findSimilarIncident(symptom, this.state.incidents);
    const deployCheck = checkRecentDeploys(symptom);
    const metricCheck = checkMetrics(symptom);

    const contextLines = [
      `Symptom: ${symptom}`,
      `Recent deploy check: ${deployCheck}`,
      `Metric check: ${metricCheck}`,
      similar
        ? `Similar past incident: "${similar.symptom}" was resolved with: ${similar.resolution}`
        : "No similar past incident found in memory.",
    ].join("\n");

    const aiResponse = (await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: contextLines },
      ],
    })) as { response?: string };

    const reply = aiResponse.response ?? "Could not generate a triage response.";

    // Memory/state: append the resolved incident so future symptoms can be
    // matched against it. Persists across requests via the Agent's SQLite state.
    this.setState({
      incidents: [
        ...this.state.incidents,
        {
          id: crypto.randomUUID(),
          symptom,
          deployCheck,
          metricCheck,
          resolution: reply,
          timestamp: Date.now(),
        },
      ],
    });

    return {
      reply,
      steps: { similar: similar?.symptom ?? null, deployCheck, metricCheck },
    };
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const routed = await routeAgentRequest(request, env);
    if (routed) return routed;
    return env.ASSETS.fetch(request);
  },
};
