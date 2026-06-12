---
title: Introduction
description: What Eidentic is, why it exists, and the three pillars that set it apart.
---

Eidentic is an open-source TypeScript SDK for AI agents with self-improving memory and production fundamentals built in. Durable execution, enforced cost ceilings, multi-tenant isolation, GDPR erasure, and sandboxed tools ship in the same package — not behind an enterprise tier. Apache-2.0. Runs on Node, Bun, Deno, and the edge.

## The thesis

Most agent frameworks focus on one lane — memory, or coding/sandbox, or DX, or durable orchestration, or skills. Production-readiness is usually behind a paywall. Eidentic's thesis: everything in one composable, fully-open package.

## Three pillars

### 1. Memory that improves itself

Eidentic's memory engine is four tiers, not one:

- **Self-editing memory blocks** — always-in-context text the agent can read and rewrite mid-reasoning, like a scratchpad it maintains about each user.
- **Lexical + semantic recall** — BM25 full-text search fused with vector similarity via Reciprocal Rank Fusion (RRF). Works without a vector store; optional when you add one.
- **Temporal knowledge graph** — facts with validity windows. Contradictions invalidate the old value rather than accumulating, preserving the full history of what was known when.
- **Sleep-time consolidation** — a background job distills raw episode history into durable summary facts, grounded in actual conversation content.

### 2. Production fundamentals, built in — not bolted on

- Durable checkpoint/resume with exactly-once tool dispatch
- Enforced cost ceilings ($/token/turn) with per-turn cost visibility
- Built-in rate-limiting and per-tenant quotas
- OpenTelemetry GenAI spans and a structured audit-event stream
- Deny-by-default tool permissions and sandboxed code execution
- Secret isolation — the model never sees your API keys
- One-call GDPR right-to-erasure that fans out across every store
- Built-in eval harness with a CI pass-rate gate; promote any production trace into a regression test

### 3. Composable, fully open, runs everywhere

Ports-and-adapters architecture: swap the store (SQLite / libSQL / Postgres), vector backend (LanceDB / pgvector / Qdrant / Pinecone), or embedder without touching agent code. Ingest PDF, HTML, and Markdown out of the box. Interop via MCP (with OAuth) and A2A. Verified on Node, Bun, and Deno in CI.

## Who it's for

- **Backend developers** who want to drop an agent into an existing Express, Next.js, or Cloudflare Workers service without standing up a separate process.
- **Teams** who need multi-tenant isolation, cost control, and audit logs from day one — not after an incident.
- **Builders** who want memory-enabled agents with honest, reproducible recall — not a black-box service.

## How to use Eidentic

Eidentic is a **library first**. Import it into your own backend and call `agent.query()` from any request handler. Running it as a standalone HTTP service via `@eidentic/server` is an optional second mode.

```ts
import { Agent, AIModel, SqliteStore } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";

const agent = new Agent({
  id: "support",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store: new SqliteStore("./eidentic.sqlite"),
});

for await (const ev of agent.query("What did we decide last week?", { sessionId: "u-42" })) {
  if (ev.type === "text_delta") process.stdout.write(ev.delta);
}
```

## Next steps

Head to [Getting Started](/getting-started) to install Eidentic and build your first agent in under five minutes.
