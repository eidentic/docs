# Eidentic

> The open-source TypeScript SDK for AI agents with self-improving memory and production fundamentals built in. Apache-2.0. Runs on Node, Bun, Deno, and the edge.

Eidentic pairs a stateful agent loop with a four-tier memory engine — lexical + vector recall, self-editing memory blocks, a temporal knowledge graph, and sleep-time consolidation — and ships the production fundamentals as first-class, open features rather than an enterprise tier.

## Install

```bash
npm install eidentic
```

## Quickstart

```ts
import { Agent, AIModel, SqliteStore } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";

const agent = new Agent({
  id: "support",
  instructions: "You are a support agent. Remember the user.",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store: new SqliteStore("./eidentic.sqlite"),
});

for await (const ev of agent.query("What did we decide last week?", {
  sessionId: "u-42",
})) {
  if (ev.type === "stream.delta") process.stdout.write(ev.delta.text);
}
```

`agent.query(input, { sessionId })` returns an async generator of stream events; text deltas are `ev.type === "stream.delta"` with `ev.delta.text`. The agent recalls prior sessions inside `query()`, with citations, and consolidates what it learned while idle.

## What's included

- **Memory that improves itself:** a temporal knowledge graph where facts carry validity over time (contradictions invalidate rather than overwrite), self-editing blocks, passive extraction, and sleep-time consolidation.
- **Production fundamentals:** durable checkpoint/resume with exactly-once tool dispatch, enforced cost ceilings, rate limits, quotas, multi-tenant isolation, sandboxed tools, one-call GDPR erasure, and an eval harness with a CI pass-rate gate.
- **Composable:** swap the store (`@eidentic/sqlite`, `@eidentic/libsql`, `@eidentic/postgres`), vector backend (pgvector, Qdrant, LanceDB, Pinecone), embedder, and model provider without touching agent code.
- **Native to TypeScript:** React hooks (`@eidentic/react`), a Next.js handler (`@eidentic/nextjs`), a standalone server (`@eidentic/server`), MCP host + server with OAuth, A2A, and a CLI.

## Benchmarks

On LongMemEval (~115k-token histories), Eidentic memory scores **55.2% overall vs 41.0%** for a full-context baseline (+14.2 points), winning all six question types while using up to **~39× fewer tokens** per query (2,550 vs 99,435). On LoCoMo's smaller haystack, full context stays ahead by 7.8 points — published in full, wins and losses, no sampling.

## Links

- Docs: https://docs.eidentic.dev
- Source: https://github.com/eidentic/eidentic
- npm: https://www.npmjs.com/package/eidentic
- Blog: https://eidentic.dev/blog
- License: Apache-2.0
