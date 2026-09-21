import { describe, it, expect } from "vitest";
import { checkRecentDeploys, checkMetrics } from "./mockInfra";

describe("checkRecentDeploys", () => {
  it("matches a service mentioned by name in the symptom", () => {
    expect(checkRecentDeploys("billing worker keeps retrying")).toContain("billing-worker");
  });

  it("falls back to the first deploy when no service name matches", () => {
    expect(checkRecentDeploys("something vague is wrong")).toContain("api-gateway");
  });
});

describe("checkMetrics", () => {
  it("matches latency-related keywords to the latency spike", () => {
    expect(checkMetrics("checkout API is timing out")).toMatch(/p99 latency/);
  });

  it("matches error-related keywords to the error rate spike", () => {
    expect(checkMetrics("login is failing with 500s")).toMatch(/5xx error rate/);
  });

  it("matches queue-related keywords to the queue depth spike", () => {
    expect(checkMetrics("the billing queue is backlogged")).toMatch(/queue depth/);
  });

  it("returns a no-op message when nothing matches", () => {
    expect(checkMetrics("the coffee machine is broken")).toMatch(/no unusual metric spikes/);
  });
});
