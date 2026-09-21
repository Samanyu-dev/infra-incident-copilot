# Prompt History

This project was built with Claude (via Claude Code) doing the implementation, directed by the
prompts below. Included per the assignment's request for AI-assisted-coding transparency.

## 1. Choosing the idea

> "shall we make it? (give few more examples)"

Claude proposed four options that satisfy the assignment's four required components (LLM,
workflow/coordination, chat/voice input, memory/state), each tied to something already in the
candidate's portfolio: an infra incident copilot, a fantasy-sports draft assistant, an open-source
issue-triage coach, and a voice expense ledger.

## 2. Picking a direction and scope

> "ok lets go with #1 make a github repository, create issues and work on them to finish the
> project ( dont do mmuch tests, let use tests at the end for now just building )"

This set the direction (Infra Incident Copilot), the process (public GitHub repo, tracked via
issues, each closed by the commit that resolves it), and the scope for this pass (skip test
coverage until the core flow works end to end — tracked as issue #6 instead of skipped silently).

## 3. Build execution (Claude, autonomous within the above scope)

Claude then, without further per-step prompts:

- Loaded Cloudflare's `agents-sdk` skill and read the actual reference docs for configuration,
  routing, and workflows before writing any code, rather than relying on possibly-stale training
  knowledge of the SDK.
- Decided coordination should live directly on the Agent (not a separate Cloudflare Workflow
  instance), based on Cloudflare's own documented guidance that Workflows are for tasks that are
  long-running or need retries/approval, while quick multi-step logic (this diagnostic sequence
  runs in well under a second) belongs on the Agent itself.
- Created the GitHub repo (`Samanyu-dev/infra-incident-copilot`) and six tracking issues before
  writing any code.
- Scaffolded the Workers project (`wrangler.jsonc`, `package.json`, `tsconfig.json`), installing
  `agents`, `wrangler`, and `@types/node` — and removed `@cloudflare/workers-types` after
  `wrangler types` flagged it as superseded by its own generated runtime types, rather than
  leaving a redundant dependency in place.
- Implemented the diagnostic logic (`src/mockInfra.ts`, `src/similarity.ts`), the Agent class and
  Workers AI call (`src/server.ts`), and the chat UI (`public/index.html`).
- Verified locally with `npx tsc --noEmit` (clean) and `wrangler dev` (confirmed routing, Durable
  Object state, and static asset serving all work). Found and reported, rather than silently
  working around, that the Workers AI call itself can't be verified in local-only mode because the
  Cloudflare account has no `workers.dev` subdomain registered yet — that's a one-time account
  setup choice left for the account owner rather than one Claude made unilaterally.
- Wrote the README mapping each of the four required components to the exact file/function that
  satisfies it, including the reasoning for the Agent-vs-Workflow choice above.
