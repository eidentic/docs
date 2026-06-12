---
title: The agent loop
description: How Eidentic runs a stateful ReAct loop, streams events, and terminates safely.
---

Every call to `agent.query()` runs a **ReAct** (reason → act → observe) loop. This page explains what happens inside that loop and how to consume its output.

## The loop in brief

1. `session.init` is emitted with the session id, agent id, and the model and tool names for this turn.
2. The user message is appended to the event log.
3. The model is called. Token deltas arrive as `stream.delta` events.
4. If the model emits tool calls, each is dispatched and a `tool.result` event is yielded.
5. Steps 3–4 repeat until the model produces a final text answer (no tool calls).
6. A terminal `result` event is yielded and the generator exits.

The loop is owned by Eidentic — it is not delegated to the AI SDK's multi-step helpers. That ownership is what makes checkpointing, cost enforcement, permission gating, and memory hooks interleave correctly on every turn.

## `agent.query()` — the async iterable

```ts
async *query(
  input: string | ContentBlock[],
  opts: QueryOptions
): AsyncIterable<StreamEvent>
```

`QueryOptions`:

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string` | Required. Identifies the session; same id continues the same conversation. |
| `userId` | `string?` | Scopes memory and session ownership to a user. |
| `orgId` | `string?` | Tenant identifier for multi-tenant deployments. |
| `signal` | `AbortSignal?` | Cooperative cancellation — yields `result{subtype:"aborted"}` when fired. |
| `outputSchema` | `z.ZodType?` | Constrain the final answer to a validated object (`result.object`). |

`input` may be a plain string or an array of `ContentBlock` values for multimodal (text + image) input.

## Stream events

```ts
type StreamEvent =
  | { type: "session.init"; sessionId: string; agentId: string; tools: string[]; model: string }
  | { type: "assistant";    content: ContentBlock[] }        // text + tool_use blocks
  | { type: "tool.result";  callId: string; toolName: string; output: unknown; isError: boolean }
  | { type: "stream.delta"; delta: { text: string } }        // token-level streaming
  | { type: "result";       subtype: TerminationSubtype; output?: string; usage: Usage;
                            cost: CostBreakdown; numTurns: number; sessionId: string }
```

Consuming a streaming run:

```ts
import { Agent, AIModel, SqliteStore } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";

const agent = new Agent({
  id: "assistant",
  instructions: "You are a helpful assistant.",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store: new SqliteStore("./eidentic.sqlite"),
});

process.stdout.write("assistant: ");
for await (const ev of agent.query("Say hello.", { sessionId: "s1" })) {
  if (ev.type === "stream.delta") process.stdout.write(ev.delta.text);
  if (ev.type === "result") console.log("\nusage:", ev.usage);
}
```

See [hello-stream.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-stream.ts) for the full runnable version.

## Terminal subtypes

The `result` event's `subtype` field tells you why the loop stopped:

| Subtype | Meaning |
|---|---|
| `"success"` | Model produced a final text answer. |
| `"max_turns"` | Hit the `maxTurns` ceiling (default: 16). |
| `"max_cost"` | Hard cost ceiling (`policy.maxCostUsd`) was reached. |
| `"max_tokens"` | Token ceiling was reached. |
| `"aborted"` | `AbortSignal` was fired; partial cost is reported. |
| `"suspended"` | Run paused for a human-in-the-loop decision (requires `durable: true`). |
| `"guardrail"` | Input or output blocked or redacted by a guardrail. |
| `"error"` | Unrecoverable model or adapter failure. |

Narrowing on `subtype`:

```ts
for await (const ev of agent.query("Summarise this.", { sessionId })) {
  if (ev.type === "result") {
    switch (ev.subtype) {
      case "success":
        console.log(ev.output);
        console.log("cost $:", ev.cost?.usd);
        break;
      case "max_cost":
        console.warn("Hard cost ceiling hit.");
        break;
      case "suspended":
        console.log("Waiting for human approval.");
        break;
    }
  }
}
```

## Termination guards

All guards are enforced outside model reasoning — the model cannot argue past them:

- **`maxTurns`** — default 16; pass a higher value in `AgentConfig` or `policy.maxTurns`.
- **`policy.maxCostUsd` / `policy.maxTokens`** — hard ceilings that terminate the run.
- **`policy.maxWallClockMs`** — wall-clock budget.
- **`AbortSignal`** — pass via `QueryOptions.signal`; propagates into every tool's `ctx.signal`.

## Multi-turn sessions

The same `sessionId` in consecutive `query()` calls continues the same conversation — the agent reads the full prior event log and the model sees the complete conversation history:

```ts
// Turn 1
for await (const ev of agent.query("My name is Baran.", { sessionId: "chat-1" })) {}

// Turn 2 — agent remembers turn 1
for await (const ev of agent.query("What is my name?", { sessionId: "chat-1" })) {
  if (ev.type === "result") console.log(ev.output); // "Baran"
}
```

See [hello-stateful.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-stateful.ts) for a complete example.

## Strategies

The default loop is ReAct. You can wrap it with a composable strategy — `reflection()` or `planAndExecute()` — to add critique passes or hierarchical planning without changing anything else. See the Strategies concept page for details.
