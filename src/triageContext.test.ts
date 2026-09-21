import { describe, it, expect } from "vitest";
import { buildTriageContext } from "./triageContext";
import type { Incident } from "./types";

// This is the "integration test for the /chat route" from issue #6, scoped to
// the part that's actually testable without live infra: the coordination
// pipeline (similarity search + deploy check + metric check -> prompt
// context). The HTTP route and the real Workers AI call both need the
// account's workers.dev subdomain to exist first (see README), so they're
// verified manually via `wrangler dev` / `wrangler deploy` instead of here.
describe("buildTriageContext", () => {
  it("assembles deploy check, metric check, and no-similar-incident context on a cold start", () => {
    const ctx = buildTriageContext("checkout api is timing out", []);

    expect(ctx.similar).toBeUndefined();
    expect(ctx.metricCheck).toMatch(/p99 latency/);
    expect(ctx.promptContext).toContain("Symptom: checkout api is timing out");
    expect(ctx.promptContext).toContain("No similar past incident found in memory.");
  });

  it("surfaces a matching past incident once memory has one", () => {
    const past: Incident = {
      id: "1",
      symptom: "checkout api is timing out for users",
      deployCheck: "api-gateway deployed v2.14.0 12m ago (rate-limit middleware rewrite)",
      metricCheck: "p99 latency on api-gateway jumped from 120ms to 940ms",
      resolution: "rolled back the rate-limit middleware change",
      timestamp: Date.now(),
    };

    const ctx = buildTriageContext("checkout api timing out again", [past]);

    expect(ctx.similar?.id).toBe("1");
    expect(ctx.promptContext).toContain('Similar past incident: "checkout api is timing out for users"');
    expect(ctx.promptContext).toContain("rolled back the rate-limit middleware change");
  });
});
