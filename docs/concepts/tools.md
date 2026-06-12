---
title: Tools
description: Define, register, and dispatch tools — the actions your agent can take.
---

Tools are the actions an agent can take. Eidentic keeps three concerns cleanly separated: **definition** (`createTool`), **schema generation** (JSON Schema derived from the Zod input schema, filtered per permission policy), and **dispatch** (`ToolRegistry`).

## `createTool`

```ts
import { createTool } from "@eidentic/core";
import { z } from "zod";

const weather = createTool({
  id: "get_weather",
  description: "Get the current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ input }) => ({ temp: 22, condition: "sunny", city: input.city }),
});
```

`ToolDef` fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique tool name — what the model calls. |
| `description` | `string` | Yes | Shown to the model. Write it for a language model, not a human developer. |
| `inputSchema` | `z.ZodType<I>` | Yes | Zod schema; validated at dispatch before `execute` is called. |
| `sideEffect` | `SideEffect?` | No | `"read-only"` (default), `"idempotent"`, or `"destructive"`. |
| `idempotencyKey` | `(input: I) => string \| Promise<string>` | No | Required for destructive tools under durable execution. |
| `execute` | `({ input: I; ctx?: ToolContext }) => Promise<O>` | Yes | The tool handler. |

The returned `Tool` object has a `jsonSchema` property (JSON Schema derived from `inputSchema`) that the registry sends to the model. You never construct `Tool` directly — always use `createTool`.

## Side-effect levels

```ts
export type SideEffect = "read-only" | "idempotent" | "destructive";
```

This single field drives three subsystems:

- **Permissions** — `destructive` tools are denied by default in `plan` mode and require explicit allow rules or a human gate.
- **Dispatch scheduling** — `read-only` tool calls in the same turn run concurrently; `idempotent` and `destructive` calls run serially.
- **Durability** — `idempotent` and `destructive` tools are tracked in the idempotency ledger under durable execution; `read-only` tools are always safe to re-run and are never ledgered.

```ts
const sendEmail = createTool({
  id: "send_email",
  description: "Send an email to a recipient.",
  sideEffect: "destructive",
  inputSchema: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
  idempotencyKey: (input) => `send_email:${input.to}:${input.subject}`,
  execute: async ({ input }) => { /* ... */ return { sent: true }; },
});
```

## `ToolContext`

Every tool's `execute` function receives an optional `ctx` object injected by the registry at dispatch time:

```ts
export interface ToolContext {
  scope?: Scope;           // tenant boundary (user/agent/org)
  secrets?: SecretsPort;  // credential vault — fetch secrets here, never hardcode
  signal?: AbortSignal;   // honours parent query cancellation
  suspend?: (request: SuspendRequest) => Promise<SuspendDecision>; // HITL suspension (durable only)
}
```

The model never sees `ctx` — it is injected at dispatch, not serialized into the prompt. Accessing secrets:

```ts
execute: async ({ input, ctx }) => {
  const apiKey = await ctx?.secrets?.get("MY_API_KEY");
  // use apiKey ...
},
```

## `ToolRegistry`

`ToolRegistry` is the runtime dispatch engine. You rarely construct it directly — the `Agent` builds one per run from the tools in `AgentConfig.tools`. But it is useful in tests:

```ts
import { ToolRegistry, createTool } from "@eidentic/core";

const registry = new ToolRegistry([weather, sendEmail], {
  permissions: { deny: ["send_*"] },
});

const results = await registry.dispatch([
  { callId: "c1", name: "get_weather", input: { city: "Berlin" } },
]);
```

`registry.schemas()` returns the permission-filtered list of `ToolSchema` objects sent to the model — statically denied tools are absent.

## Lazy tools

When an agent registers more than 20 tools, sending every schema on every turn wastes tokens. Setting `lazyTools: true` in `AgentConfig` activates lazy discovery: the model only sees the two meta-tools `search_tools` and `load_tool` plus a small eager set on each turn, and loads full schemas on demand:

```ts
const agent = new Agent({
  id: "assistant",
  instructions: "Find and use the right tool.",
  model,
  store,
  tools: [...thirtyTools],
  lazyTools: true,  // auto: activates when toolset > threshold (default 20)
});
```

When the model needs a tool, it calls `search_tools({ query: "send email" })` to get top-k signatures, then `load_tool({ name: "send_email" })` to inject the full schema before dispatching. The full tool is still dispatched normally — lazy discovery is purely a context-cost optimization; it never gates execution.

See [hello-tools.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-tools.ts) and [hello-lazy-tools.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-lazy-tools.ts) for runnable examples.
