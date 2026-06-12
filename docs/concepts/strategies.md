---
title: Strategies
description: Wrap the ReAct loop with reflection or plan-and-execute without changing any other configuration.
---

By default, `agent.query()` runs a **ReAct** loop (reason → act → observe). Strategies let you layer richer reasoning patterns on top of that loop without forking it. You configure a strategy once in `AgentConfig`; the rest of the agent — tools, memory, permissions, cost policy — works unchanged.

## The three built-in strategies

Import from `@eidentic/core`:

```ts
import { react, reflection, planAndExecute } from "@eidentic/core";
```

### `react()` — default passthrough

The base ReAct loop. Passing `react()` explicitly is identical to passing no strategy:

```ts
const agent = new Agent({ ..., strategy: react() });
```

### `reflection()` — draft → critic → revise

The agent produces a draft, a **separate** critic model evaluates it, and the loop revises up to `maxRevisions` times before accepting the draft:

```ts
import { Agent, reflection } from "@eidentic/core";
import { AIModel } from "@eidentic/model";
import { anthropic } from "@ai-sdk/anthropic";

const agent = new Agent({
  id: "writer",
  instructions: "Write thorough, well-structured answers.",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store,
  strategy: reflection({
    critic: new AIModel(anthropic("claude-sonnet-4-5")),  // must be a DIFFERENT instance
    maxRevisions: 2,
  }),
});
```

`reflection` options:

| Field | Type | Default | Description |
|---|---|---|---|
| `critic` | `ModelPort` | — | Required. Must be a different `ModelPort` instance from the agent's model — same-model self-critique is unreliable. |
| `maxRevisions` | `number` | `2` | Maximum revision rounds. After `maxRevisions` the last draft is accepted. |
| `ground` | `GroundSignal[]?` | `[]` | Optional external validation functions (e.g. run tests, validate a schema). Reports are fed to the critic so the critique is grounded in real signals. |

The stream emits **exactly one terminal `result`** — the accepted draft. Intermediate drafts' terminal events are swallowed; intermediate assistant/tool events are forwarded so consumers see progress. A shared cost budget governs the entire strategy including all critic calls.

### `planAndExecute()` — planner + per-step executor

A strong planner model produces a typed step list. Each step runs as an independent ReAct sub-run, optionally on a cheaper executor model. The planner is called again after every `replanEvery` steps or on step failure:

```ts
import { planAndExecute } from "@eidentic/core";

const agent = new Agent({
  id: "researcher",
  instructions: "Complete multi-step research tasks.",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store,
  strategy: planAndExecute({
    planner: new AIModel(anthropic("claude-sonnet-4-5")),
    executor: new AIModel(anthropic("claude-haiku-4-5")), // cheaper model for step execution
    maxSteps: 10,
    replanEvery: 5,
  }),
});
```

`planAndExecute` options:

| Field | Type | Default | Description |
|---|---|---|---|
| `planner` | `ModelPort` | — | Required. The strong model that produces the step list. |
| `executor` | `ModelPort?` | Agent's own model | The model used to run each step sub-run. |
| `maxSteps` | `number` | `10` | Total step cap across all planning rounds. |
| `replanEvery` | `number` | `5` | Re-invoke the planner after this many steps to check for needed adjustments. |

If the planner fails to produce a step list, the strategy falls back to a single plain ReAct run on the original input. The stream emits **exactly one terminal `result`** — a synthesis of all step outputs.

## Cost budgeting across strategies

A single shared budget accumulates spend across all sub-runs (draft passes, critic calls, planner calls, step executions). `policy.maxCostUsd` governs the whole strategy run, not each sub-run individually. If the budget is exhausted mid-strategy, the current draft or partial step output is accepted immediately (fail-safe).

## Structured output with strategies

`outputSchema` constrains only the strategy's **final** answer. Intermediate passes (draft passes, step runs) are unconstrained so they can call tools and emit free text. After the strategy accepts an answer, one additional schema-constrained pass renders the final `result.object`:

```ts
import { z } from "zod";

for await (const ev of agent.query("Analyse this.", {
  sessionId: "s1",
  outputSchema: z.object({ summary: z.string(), keyPoints: z.array(z.string()) }),
})) {
  if (ev.type === "result" && ev.subtype === "success") {
    console.log(ev.object); // { summary: "...", keyPoints: [...] }
  }
}
```

See [hello-strategies.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-strategies.ts) for a complete runnable example of the reflection strategy.
