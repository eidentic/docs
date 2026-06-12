---
title: Examples
description: A catalog of every runnable example in the Eidentic monorepo, grouped by topic.
---

All examples live in the `examples/` directory of the monorepo. Most use mock models and in-memory stores, so no API key is needed to run them.

**Run any example:**

```bash
# By npm script name (from the repo root)
pnpm --filter eidentic-examples hello:stateful

# Or directly with tsx from the examples/ directory
tsx examples/hello-stateful.ts
```

The full list of script names is in `examples/package.json`. Scripts follow the pattern `hello:<name>` for `hello-<name>.ts` files and `bench:<name>` for benchmark runners.

---

## Basics

| Example | What it shows |
|---|---|
| [hello-stateful](https://github.com/eidentic/eidentic/blob/main/examples/hello-stateful.ts) | Multi-turn stateful agent with a persistent SQLite session store |
| [hello-stream](https://github.com/eidentic/eidentic/blob/main/examples/hello-stream.ts) | Token-level streaming of `text_delta` events using a stream-capable mock model |
| [hello-real](https://github.com/eidentic/eidentic/blob/main/examples/hello-real.ts) | Wiring a real provider (Anthropic) via `AIModel` — requires `ANTHROPIC_API_KEY` |
| [hello-embedded](https://github.com/eidentic/eidentic/blob/main/examples/hello-embedded.ts) | Embedding an agent directly in your own backend (plain `node:http`, no `@eidentic/server`) |
| [hello-tools](https://github.com/eidentic/eidentic/blob/main/examples/hello-tools.ts) | Built-in tool set: `fileTools`, `bashTool`, and `webTools` with allowlist and sandbox enforcement |
| [hello-structured](https://github.com/eidentic/eidentic/blob/main/examples/hello-structured.ts) | Schema-constrained output via `outputSchema` — the final turn is validated against a Zod schema |

---

## Memory & graph

| Example | What it shows |
|---|---|
| [hello-memory](https://github.com/eidentic/eidentic/blob/main/examples/hello-memory.ts) | Cross-session per-user recall using `Memory` + `userId` with BM25 lexical search |
| [hello-self-editing](https://github.com/eidentic/eidentic/blob/main/examples/hello-self-editing.ts) | Agent-managed self-editing memory blocks — the agent reads and rewrites its own scratchpad mid-reasoning |
| [hello-graph](https://github.com/eidentic/eidentic/blob/main/examples/hello-graph.ts) | Temporal knowledge graph: asserting facts, querying with validity windows, and contradiction invalidation |
| [hello-consolidation](https://github.com/eidentic/eidentic/blob/main/examples/hello-consolidation.ts) | Sleep-time consolidation: distilling a conversation into grounded KG facts, including contradiction handling |
| [hello-memory-completion](https://github.com/eidentic/eidentic/blob/main/examples/hello-memory-completion.ts) | Passive fact extraction with `extraction:"hybrid"` plus block-health reporting (fill ratio, empty blocks) |
| [hello-memory-maintenance](https://github.com/eidentic/eidentic/blob/main/examples/hello-memory-maintenance.ts) | Memory maintenance: TTL invalidation via `sweepExpiredFacts`, dedup/merge, and a `ConsolidationScheduler` pass |
| [hello-vector](https://github.com/eidentic/eidentic/blob/main/examples/hello-vector.ts) | Local semantic recall with LanceDB + `LocalEmbedder` — a paraphrased query with no shared keywords still hits |
| [hello-remote-vector](https://github.com/eidentic/eidentic/blob/main/examples/hello-remote-vector.ts) | Remote vector store with `PgVectorStore` via an embedded Postgres (pglite) — swap for a real `pg.Pool` in prod |
| [hello-hosted-embedding](https://github.com/eidentic/eidentic/blob/main/examples/hello-hosted-embedding.ts) | Semantic recall using any AI SDK embedding model (`AIEmbedder`) as the embedder |

---

## Skills

| Example | What it shows |
|---|---|
| [hello-skill](https://github.com/eidentic/eidentic/blob/main/examples/hello-skill.ts) | Inline `SKILL.md` prompt skill registered in a `SkillSet` and retrieved by the agent at query time |
| [hello-executable-skill](https://github.com/eidentic/eidentic/blob/main/examples/hello-executable-skill.ts) | Executable skills with test-gating, `allowed-tools` enforcement, and ed25519 signature verification |
| [hello-skill-evolution](https://github.com/eidentic/eidentic/blob/main/examples/hello-skill-evolution.ts) | Skill self-evolution via `evolveSkill()` — a failing skill is improved by a model reflection loop |

---

## Durable & control

| Example | What it shows |
|---|---|
| [hello-durable](https://github.com/eidentic/eidentic/blob/main/examples/hello-durable.ts) | Durable checkpoint/resume: a scripted mid-run "crash" is recovered from the persisted event log |
| [hello-suspend](https://github.com/eidentic/eidentic/blob/main/examples/hello-suspend.ts) | Human-in-the-loop suspension: a pending tool call is persisted, the run is resumed later without re-calling the model |
| [hello-cancellation](https://github.com/eidentic/eidentic/blob/main/examples/hello-cancellation.ts) | Cooperative cancellation via `AbortSignal` — the loop terminates with `result{subtype:"aborted"}` carrying partial work |
| [hello-compaction](https://github.com/eidentic/eidentic/blob/main/examples/hello-compaction.ts) | Context-engine compaction triggered by a tiny `maxContextTokens` budget — error evidence survives the drop |
| [hello-schema-evolution](https://github.com/eidentic/eidentic/blob/main/examples/hello-schema-evolution.ts) | Event-schema upcasting (v0→v1), embedding model migration with re-indexing, and prompt schema versioning |

---

## Production

| Example | What it shows |
|---|---|
| [hello-security](https://github.com/eidentic/eidentic/blob/main/examples/hello-security.ts) | Deny-by-default tool permissions, schema-layer dispatch gate, and `MapSecrets` for secret isolation |
| [hello-guardrails](https://github.com/eidentic/eidentic/blob/main/examples/hello-guardrails.ts) | `GuardrailPort`: input blocking, PII redaction, and output filtering before the model or client sees the text |
| [hello-quota](https://github.com/eidentic/eidentic/blob/main/examples/hello-quota.ts) | Per-tenant cumulative quotas: second request for the same key is rejected 402 after `hardRuns:1` is exhausted |
| [hello-rate-limit](https://github.com/eidentic/eidentic/blob/main/examples/hello-rate-limit.ts) | Token-bucket rate limiting: second request is rejected 429 with `Retry-After` header |
| [hello-pricing](https://github.com/eidentic/eidentic/blob/main/examples/hello-pricing.ts) | Bundled `defaultPrices` table and cached-token discount — `cost.usd` is populated on every result event |
| [hello-cost-otel](https://github.com/eidentic/eidentic/blob/main/examples/hello-cost-otel.ts) | Cost governor with an enforced token ceiling, wired to an `InMemoryTracer` for OTel span inspection |
| [hello-erasure](https://github.com/eidentic/eidentic/blob/main/examples/hello-erasure.ts) | GDPR right-to-erasure: `memory.eraseScope()` fans out across store, vector index, and knowledge graph |
| [hello-debug](https://github.com/eidentic/eidentic/blob/main/examples/hello-debug.ts) | `LoggerPort` injection and `DEBUG=eidentic:*` env-gated logging with secret redaction |

---

## Server & UI

| Example | What it shows |
|---|---|
| [hello-server](https://github.com/eidentic/eidentic/blob/main/examples/hello-server.ts) | `@eidentic/server`: build and query a Hono app via `app.request()` — no real socket needed |
| [hello-chat-ui](https://github.com/eidentic/eidentic/blob/main/examples/hello-chat-ui.ts) | AI SDK UI integration: `withEidentic(agent)` backend route + `useChat` from `@ai-sdk/react` on the client |
| [hello-studio](https://github.com/eidentic/eidentic/blob/main/examples/hello-studio.ts) | `@eidentic/studio` management API: list sessions/events, edit memory blocks, query facts and skills |
| [hello-better-auth](https://github.com/eidentic/eidentic/blob/main/examples/hello-better-auth.ts) | `@eidentic/better-auth`: session-based auth — valid session → 200 SSE scoped to `userId`; no session → 401 |

---

## Integrations

| Example | What it shows |
|---|---|
| [hello-mcp](https://github.com/eidentic/eidentic/blob/main/examples/hello-mcp.ts) | MCP host: connect to an MCP server and expose its tools as first-class Eidentic tools via `ToolRegistry` |
| [hello-mcp-server](https://github.com/eidentic/eidentic/blob/main/examples/hello-mcp-server.ts) | MCP server: expose Eidentic tools as an MCP server consumable by any MCP client (Claude Desktop, other agents) |
| [hello-a2a](https://github.com/eidentic/eidentic/blob/main/examples/hello-a2a.ts) | A2A (Agent-to-Agent) interop: expose Agent A via `a2aRoutes`, consume it as a tool on Agent B via `a2aTool` |
| [hello-libsql](https://github.com/eidentic/eidentic/blob/main/examples/hello-libsql.ts) | `LibsqlStore` (pure-JS, works under Next.js/Bun/edge) with an in-memory libSQL database |
| [hello-postgres](https://github.com/eidentic/eidentic/blob/main/examples/hello-postgres.ts) | `PostgresStore` via embedded Postgres in WASM (pglite) — swap for a real `pg.Pool` in production |
| [hello-sandbox](https://github.com/eidentic/eidentic/blob/main/examples/hello-sandbox.ts) | Sandbox substrate: `NoopSandbox` refuses untrusted exec by default; `EchoSandbox` (or `E2BSandbox`) runs it |
| [hello-web-search](https://github.com/eidentic/eidentic/blob/main/examples/hello-web-search.ts) | Pluggable `WebSearchPort`: canned-results fake wired end-to-end; `webSearchFromEnv` with an unconfigured env |

---

## Multi-agent & strategies

| Example | What it shows |
|---|---|
| [hello-multi-agent](https://github.com/eidentic/eidentic/blob/main/examples/hello-multi-agent.ts) | Supervisor fans out to two sub-agents via `spawn_agent` — isolated context windows under a shared budget |
| [hello-strategies](https://github.com/eidentic/eidentic/blob/main/examples/hello-strategies.ts) | `reflection()` strategy: a draft is critiqued by a separate critic model, revised, then accepted |
| [hello-lazy-tools](https://github.com/eidentic/eidentic/blob/main/examples/hello-lazy-tools.ts) | Lazy tool discovery for large toolsets: the model searches and loads schemas on demand rather than receiving all upfront |

---

## Eval & bench

| Example | What it shows |
|---|---|
| [hello-eval](https://github.com/eidentic/eidentic/blob/main/examples/hello-eval.ts) | Eval harness: dataset + runner + scorers (`toolCorrectness`, `verifierStall`, `llmJudge`) → `EvalReport` |
| [hello-bench](https://github.com/eidentic/eidentic/blob/main/examples/hello-bench.ts) | Memory benchmark harness: `runMemoryBench` over a synthetic dataset → `BenchReport` with recall@k |
| [hello-bench-write](https://github.com/eidentic/eidentic/blob/main/examples/hello-bench-write.ts) | Write-quality benchmarks: contradiction suppression, junk resistance, and duplicate resistance |
| [bench-locomo](https://github.com/eidentic/eidentic/blob/main/examples/bench-locomo.ts) | LoCoMo benchmark runner against the downloaded dataset — requires a real LLM API key |
| [bench-longmemeval](https://github.com/eidentic/eidentic/blob/main/examples/bench-longmemeval.ts) | LongMemEval benchmark runner against the downloaded dataset — requires a real LLM API key |
