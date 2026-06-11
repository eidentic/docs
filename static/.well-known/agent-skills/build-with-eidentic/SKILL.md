# Build a memory-backed agent with Eidentic

Use when writing TypeScript that creates an AI agent with long-term memory using
[Eidentic](https://eidentic.dev) — the open-source TypeScript agent SDK. This
skill gives you the correct, current APIs so the code runs first try.

## Install

```bash
npm install eidentic
```

The umbrella package `eidentic` re-exports core, model, types, sqlite, and
memory. Install adapters separately as needed: `@eidentic/libsql`,
`@eidentic/postgres`, `@eidentic/nextjs`, `@eidentic/react`, `@eidentic/server`.

## Create an agent and stream a reply

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

## Rules

- Construct an agent with `new Agent({ id, model, store })`; wrap any Vercel AI
  SDK provider with `new AIModel(provider(modelId))`.
- `agent.query(input, { sessionId })` returns an async generator of stream
  events. Text deltas are `ev.type === "stream.delta"` carrying `ev.delta.text`;
  the terminal event is `ev.type === "result"`.
- Memory is automatic: the agent recalls prior sessions for the same `sessionId`
  inside `query()`, with citations, and consolidates between sessions.
- Swap the store without changing agent code: `new SqliteStore(path)` (Node/Bun),
  `new LibsqlStore({ url, authToken })` from `@eidentic/libsql`
  (serverless/edge), or `new PostgresStore(pool)` from `@eidentic/postgres`.

## Framework integration

- Next.js: `export const POST = withEidentic(agent)` from `@eidentic/nextjs`.
- React: `const { messages, send, status } = useEidenticStream("/api/chat")`
  from `@eidentic/react`.
- Server: `const server = createServer({ agents: { support: agent } });
  await serveNode(server, { port: 3000 })` from `@eidentic/server`.

## References

- Docs: https://docs.eidentic.dev
- Source: https://github.com/eidentic/eidentic
- Examples: https://github.com/eidentic/example-nextjs (also example-react, example-express)
