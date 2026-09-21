import { describe, it, expect } from "vitest";
import { findSimilarIncident } from "./similarity";
import type { Incident } from "./types";

function makeIncident(overrides: Partial<Incident>): Incident {
  return {
    id: "1",
    symptom: "checkout api is timing out",
    deployCheck: "api-gateway deployed v2.14.0",
    metricCheck: "p99 latency spike",
    resolution: "rolled back the rate-limit middleware change",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("findSimilarIncident", () => {
  it("returns undefined when there is no history", () => {
    expect(findSimilarIncident("checkout api is timing out", [])).toBeUndefined();
  });

  it("finds a past incident with substantial word overlap", () => {
    const past = makeIncident({ symptom: "checkout api is timing out for users" });
    const match = findSimilarIncident("checkout api timing out again", [past]);
    expect(match?.id).toBe(past.id);
  });

  it("does not match unrelated symptoms", () => {
    const past = makeIncident({ symptom: "billing queue is backlogged" });
    const match = findSimilarIncident("checkout api is timing out", [past]);
    expect(match).toBeUndefined();
  });

  it("picks the best match when multiple incidents partially overlap", () => {
    const weak = makeIncident({ id: "weak", symptom: "api is slow sometimes" });
    const strong = makeIncident({ id: "strong", symptom: "checkout api is timing out for users" });
    const match = findSimilarIncident("checkout api timing out", [weak, strong]);
    expect(match?.id).toBe("strong");
  });
});
