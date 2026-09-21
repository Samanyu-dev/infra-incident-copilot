// ponytail: fake data standing in for real deploy/metrics APIs.
// Swap for real Cloudflare API / observability calls when wiring this into
// an actual on-call stack.

export const RECENT_DEPLOYS = [
  { service: "api-gateway", version: "v2.14.0", minutesAgo: 12, note: "rate-limit middleware rewrite" },
  { service: "auth-service", version: "v1.9.3", minutesAgo: 180, note: "JWT rotation change" },
  { service: "billing-worker", version: "v3.2.1", minutesAgo: 45, note: "retry backoff tuning" },
];

export const METRIC_SPIKES = [
  {
    keywords: ["latency", "slow", "timeout", "timing out"],
    metric: "p99 latency",
    detail: "p99 latency on api-gateway jumped from 120ms to 940ms in the last 15 minutes",
  },
  {
    keywords: ["error", "500", "failing", "crash", "down"],
    metric: "5xx error rate",
    detail: "5xx error rate on auth-service rose from 0.2% to 6.8% in the last 20 minutes",
  },
  {
    keywords: ["queue", "backlog", "lag", "stuck"],
    metric: "queue depth",
    detail: "billing-worker queue depth grew from ~50 to 4,200 messages over the last hour",
  },
  {
    keywords: ["memory", "oom", "restart", "restarting"],
    metric: "memory usage",
    detail: "api-gateway pods show memory climbing toward the OOM limit, 2 restarts in the last hour",
  },
];

export function checkRecentDeploys(symptom: string): string {
  const lower = symptom.toLowerCase();
  const hit = RECENT_DEPLOYS.find((d) => lower.includes(d.service.split("-")[0]));
  const candidate = hit ?? RECENT_DEPLOYS[0];
  return `${candidate.service} deployed ${candidate.version} ${candidate.minutesAgo}m ago (${candidate.note})`;
}

export function checkMetrics(symptom: string): string {
  const lower = symptom.toLowerCase();
  const hit = METRIC_SPIKES.find((m) => m.keywords.some((k) => lower.includes(k)));
  return hit ? hit.detail : "no unusual metric spikes found in the last hour";
}
