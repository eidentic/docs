# Eidentic — documentation

This repository contains the documentation site for **Eidentic**, published at
[docs.eidentic.dev](https://docs.eidentic.dev).

**Eidentic is the open-source TypeScript SDK for AI agents with self-improving memory and
production fundamentals built in.** It provides a stateful agent loop, a four-tier memory
engine (lexical + vector recall, self-editing memory blocks, a temporal knowledge graph, and
sleep-time consolidation), and production fundamentals — durable checkpoint/resume, enforced
cost ceilings, multi-tenant isolation, rate-limiting and quotas, sandboxed tool execution,
GDPR erasure, MCP host + server, A2A, an eval harness, React hooks, a Next.js handler, and a
CLI. A ports-and-adapters design keeps the store (SQLite/libSQL/Postgres), vector backend
(LanceDB/pgvector/Qdrant/Pinecone), and model provider swappable. Apache-2.0. Runs on Node,
Bun, Deno, and the edge.

```bash
npm install eidentic
```

```ts
import { Agent, AIModel } from "eidentic";
import { LibsqlStore } from "@eidentic/libsql";
import { openai } from "@ai-sdk/openai";

const store = new LibsqlStore("file:eidentic.db");
await store.migrate();

const agent = new Agent({
  id: "support",
  instructions: "You are a helpful assistant with memory of the conversation.",
  model: new AIModel(openai("gpt-4o-mini")),
  store,
});

for await (const ev of agent.query("What did we decide last week?", { sessionId: "u-42" })) {
  if (ev.type === "stream.delta") process.stdout.write(ev.delta.text);
}
```

## Documentation

The guides under [`docs/`](./docs) cover memory, workflows, the server, React hooks, model
routing, evals, benchmarks, and more. Browse them at **[docs.eidentic.dev](https://docs.eidentic.dev)**.

## Links

- SDK source: [github.com/eidentic/eidentic](https://github.com/eidentic/eidentic)
- npm: [`eidentic`](https://www.npmjs.com/package/eidentic)
- Example apps: [example-nextjs](https://github.com/eidentic/example-nextjs) · [example-react](https://github.com/eidentic/example-react) · [example-express](https://github.com/eidentic/example-express)

## Local development

```bash
npm install
npm start        # dev server
npm run build    # static build → build/
```

Apache-2.0
