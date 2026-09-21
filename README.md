# Infra Incident Copilot

A small on-call triage assistant, built for Cloudflare's optional AI-app assignment. Describe a
symptom in chat, and it runs a diagnostic sequence (recent deploys, metric spikes, similar past
incidents) before handing that context to an LLM for a triage suggestion.

Built for a Software Engineer application to Cloudflare's infrastructure platform team, so the
scenario is deliberately close to what that team actually does: turning an operational, on-call
problem into a small software system instead of a runbook someone reads by hand.

## How it maps to the assignment requirements

| Requirement | What's used | Where |
|---|---|---|
| LLM | Workers AI, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | `src/server.ts`, `triage()` |
| Workflow / coordination | A sequenced Agent method: similarity search → deploy check → metric check → LLM synthesis → record. Runs on the Agent (Durable Object), not a separate Workflow instance | `src/server.ts`, `triage()` |
| User input via chat | Static HTML/JS page, posts to the agent's HTTP endpoint | `public/index.html` |
| Memory / state | Resolved incidents persist in the Agent's SQLite-backed state and are matched against future symptoms | `src/similarity.ts`, `IncidentAgent.state` |

**Why coordination lives on the Agent instead of a Cloudflare Workflow:** the diagnostic sequence
here runs in well under 30 seconds. Cloudflare's own Agents SDK guidance is Agent-only for
quick, synchronous multi-step logic, and Agent + Workflow for tasks that are long-running or need
retries/human approval across a longer timespan. Reaching for a full Workflow instance for a
sub-second sequence of function calls would be the wrong tool for the job — the "coordination"
requirement is satisfied by the Agent doing the coordinating, which is one of the three options
the assignment explicitly names (Workflows, Workers, or Durable Objects).

## Architecture

```
Browser (public/index.html)
   │  POST /agents/incident-agent/{session}/chat  { message }
   ▼
Worker (src/server.ts) ── routeAgentRequest ──▶ IncidentAgent (Durable Object)
                                                     │
                              ┌──────────────────────┼───────────────────────┐
                              ▼                      ▼                       ▼
                     findSimilarIncident      checkRecentDeploys       checkMetrics
                     (src/similarity.ts)      (src/mockInfra.ts)      (src/mockInfra.ts)
                              │                      │                       │
                              └──────────────────────┴───────────┬───────────┘
                                                                  ▼
                                                    Workers AI (Llama 3.3) triage
                                                                  │
                                                                  ▼
                                              setState: append incident to memory
```

`checkRecentDeploys` and `checkMetrics` return mock data (see `src/mockInfra.ts`) standing in for
a real deploy log / metrics API — swapping those two functions for real API calls is the only
change needed to point this at an actual infrastructure stack.

## Running locally

```bash
npm install
npx wrangler dev
```

Static assets and Durable Object routing work fully in local mode. The Workers AI call itself
needs either `wrangler dev --remote` or an actual `wrangler deploy`, since Workers AI isn't
emulated locally — see [Cloudflare's docs](https://developers.cloudflare.com/workers/development-testing/)
for details on remote bindings.

## Deploying

```bash
npx wrangler deploy
```

## What's deliberately left out (for now)

- **Tests** — tracked in [issue #6](https://github.com/Samanyu-dev/infra-incident-copilot/issues/6),
  deliberately deferred until the end per the assignment's own "prioritize building" framing.
- **Real deploy/metrics integration** — `src/mockInfra.ts` is intentionally fake data; wiring it to
  a real API is a follow-up, not part of demonstrating the four required components.
- **Terraform/IaC for the Cloudflare resources themselves** — this project is deployed via
  `wrangler deploy` directly; it doesn't provision its own Cloudflare account resources via IaC.

## Prompt history

AI-assisted coding was used throughout (Claude, via Claude Code). See [`PROMPT_HISTORY.md`](./PROMPT_HISTORY.md)
for the build directives used.
