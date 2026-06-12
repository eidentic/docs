---
title: A2A
description: Expose an Eidentic agent over the Agent-to-Agent protocol or call remote A2A agents as tools with @eidentic/a2a.
---

`@eidentic/a2a` implements the [A2A v0.3 specification](https://github.com/google/A2A) for agent interoperability. It covers both sides: expose an agent as an A2A endpoint (Hono routes serving discovery and JSON-RPC), and consume a remote A2A agent as a first-class Eidentic tool.

## Install

```bash
npm install @eidentic/a2a
```

## Server side: exposing an agent over A2A

### `a2aRoutes(opts)`

Returns a Hono app mounted with two routes:

- `GET /.well-known/agent-card.json` — discovery card (always public, A2A compliance)
- `POST /` — JSON-RPC endpoint: `message/send` and `tasks/get`

```ts
import { a2aRoutes } from "@eidentic/a2a";
import { serve } from "@hono/node-server";

const app = a2aRoutes({
  card: {
    name: "Support Agent",
    description: "Handles customer support queries.",
    url: "https://agent.example.com",
    version: "1.0.0",
    skills: [
      { id: "support", name: "Support", description: "Answer support questions." },
    ],
  },
  agent: myAgent, // any @eidentic/core Agent (or AgentLike)
});

serve({ fetch: app.fetch, port: 3100 });
```

### `A2AServerOptions`

| Option | Description |
|---|---|
| `card` | `A2AAgentCard` — `name`, `description`, optional `url`, `version`, `skills` |
| `agent` | An Eidentic `Agent` or any `AgentLike` with a `query()` method |
| `auth?` | `{ verify: A2AAuthVerifier }` — auth guard for the JSON-RPC endpoint |
| `maxTasks?` | In-memory task store cap; oldest settled tasks evicted (default 1000) |

### Auth guard

The agent-card endpoint is intentionally left public for A2A discovery. Protect the JSON-RPC endpoint with `auth.verify`:

```ts
a2aRoutes({
  card: { /* … */ },
  agent: myAgent,
  auth: {
    verify: (req) => {
      const key = req.headers.get("x-api-key");
      return key ?? false; // returned string becomes the caller identity
    },
  },
});
```

`verify` can return a non-empty string (used as the caller identity, enforced on `tasks/get`), `true` (sentinel identity `"*"` for single-tenant mode), or a falsy value (→ HTTP 401).

### Mounting under a prefix

`a2aRoutes` returns a plain Hono app. Mount it under a prefix with `app.route()`:

```ts
import { Hono } from "hono";
const main = new Hono();
main.route("/agents/support", a2aRoutes({ card, agent: myAgent }));
```

## Client side: calling a remote A2A agent

### `a2aTool(transport, opts?)`

Wraps a remote A2A agent as a first-class Eidentic `Tool`. Pass it to an `Agent` alongside any other tools.

```ts
import { a2aTool, httpA2ATransport } from "@eidentic/a2a";
import { Agent, AIModel, SqliteStore } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";

const delegateTool = a2aTool(
  httpA2ATransport("https://agent.example.com"),
  {
    id: "remote_support",
    description: "Delegate to the remote support agent.",
  },
);

const orchestrator = new Agent({
  id: "orchestrator",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store: new SqliteStore("./eidentic.sqlite"),
  tools: [delegateTool],
});
```

The tool sends a `message/send` JSON-RPC call and returns the agent's reply text. It accepts one input field: `message: string`.

### `A2AToolOptions`

| Option | Default | Description |
|---|---|---|
| `id?` | `"a2a_agent"` | Eidentic tool id |
| `description?` | `"Call a remote A2A agent."` | Shown to the model |
| `sessionId?` | Generated per call | Fixed `contextId` sent in every message |

### `httpA2ATransport(baseUrl, init?)`

Creates a fetch-based `A2ATransport` that POSTs JSON-RPC to `baseUrl`. Pass custom headers for auth:

```ts
const transport = httpA2ATransport("https://agent.example.com", {
  headers: { Authorization: "Bearer <token>" },
});
```

### `fetchAgentCard(baseUrl)`

Fetches `GET /.well-known/agent-card.json` and returns the parsed `A2AAgentCard`:

```ts
import { fetchAgentCard } from "@eidentic/a2a";

const card = await fetchAgentCard("https://agent.example.com");
console.log(card.name, card.skills);
```

## Protocol notes

- Implements A2A v0.3 synchronous path only. Streaming (`message/stream` + SSE) and push notifications are not yet supported.
- `tasks/get` enforces caller ownership when `auth.verify` is configured — a caller can only retrieve tasks they created.
- Task IDs are cryptographically random UUIDs (not guessable).

## Runnable example

[`examples/hello-a2a.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-a2a.ts) — both sides in-process, no HTTP server required.
