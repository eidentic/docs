---
title: Cost & pricing
description: Set hard token and USD ceilings, attach a live price table, and subscribe to a soft-cap hook for cost-aware agents.
---

Eidentic's cost governor enforces ceilings before each model call and tracks per-run spend in a `CostBreakdown` attached to the final `result` event.

## Attaching a price table

Pass `prices` (a `PriceTable`) and `modelId` to the agent. `@eidentic/model` ships `defaultPrices` sourced from LiteLLM, updated periodically:

```ts
import { Agent } from "@eidentic/core";
import { AIModel } from "@eidentic/model";
import { defaultPrices, pricesUpdatedAt } from "@eidentic/model";
import { SqliteStore } from "@eidentic/sqlite";
import { anthropic } from "@ai-sdk/anthropic";

console.log(`Price table last updated: ${pricesUpdatedAt}`);

const store = await SqliteStore.create("./eidentic.sqlite");
const model = new AIModel(anthropic("claude-sonnet-4-5"));

const agent = new Agent({
  id: "my-agent",
  instructions: "Answer concisely.",
  model,
  store,
  modelId: "claude-sonnet-4-5",  // key into the price table
  prices: defaultPrices,
});
```

You can also supply a minimal inline table:

```ts
const prices = {
  "my-model": { inputPerMTok: 2.0, outputPerMTok: 8.0, cachedInputPerMTok: 0.2 },
};
```

`ModelPrice` fields: `inputPerMTok` (USD per 1M input tokens), `outputPerMTok` (USD per 1M output tokens), `cachedInputPerMTok` (optional; defaults to `inputPerMTok` when absent).

## Hard ceilings with `policy`

Pass `policy` to enforce hard limits. The governor checks each ceiling before every model call; the first one met-or-exceeded aborts the run with the matching termination subtype.

```ts
const agent = new Agent({
  // ...
  policy: {
    maxTurns: 10,            // model round-trips
    maxTokens: 50_000,       // total input + output tokens across the run
    maxCostUsd: 0.50,        // USD ceiling — requires prices + modelId
    maxWallClockMs: 30_000,  // elapsed wall-clock in ms
  },
});
```

`CostPolicy` fields:

| Field | Type | Description |
|---|---|---|
| `maxTurns` | `number` | Max model round-trips. Defaults to `16` when no policy is set. |
| `maxTokens` | `number` | Total input + output tokens for the run. |
| `maxCostUsd` | `number` | Total USD spend. Requires `prices` + `modelId`. |
| `maxWallClockMs` | `number` | Elapsed wall-clock milliseconds. |
| `softCostUsd` | `number` | Soft cap — fires `onCostThreshold` once, does NOT abort. |

## Soft cap hook

```ts
const agent = new Agent({
  // ...
  policy: { softCostUsd: 0.10, maxCostUsd: 0.50 },
  prices: defaultPrices,
  modelId: "claude-sonnet-4-5",
  onCostThreshold: ({ usd, cost, numTurns }) => {
    console.warn(`Soft cap crossed at $${usd.toFixed(4)} after ${numTurns} turns`);
  },
});
```

`CostThresholdInfo`: `usd` (current spend), `cost` (full `CostBreakdown`), `numTurns`.

`onCostThreshold` is called exactly once per run when `softCostUsd` is first crossed. It does not abort — the run continues until `maxCostUsd` or another hard ceiling stops it.

## Reading cost from the result event

```ts
for await (const ev of agent.query("hello", { sessionId: "s1" })) {
  if (ev.type === "result") {
    const { foreground, background, cachedInputTokens, children, usd } = ev.cost!;
    console.log("Input tokens:", foreground.inputTokens);
    console.log("Output tokens:", foreground.outputTokens);
    console.log("Cached input tokens:", cachedInputTokens);
    console.log("USD:", usd?.toFixed(6));
  }
}
```

`CostBreakdown` fields:

| Field | Type | Description |
|---|---|---|
| `foreground` | `Usage` | Tokens from the interactive agent loop (`inputTokens`, `outputTokens`). |
| `background` | `Usage` | Tokens from memory consolidation / skill evolution. Always `{0,0}` in the v1 loop. |
| `cachedInputTokens` | `number` | Provider-reported KV-cached input tokens. |
| `children` | `Usage` | Aggregated usage from spawned sub-agents (absent for single-agent runs). |
| `usd` | `number \| undefined` | Computed only when a `PriceTable` is configured. |

Cached tokens are billed at `cachedInputPerMTok` (if set in the price table) rather than the full `inputPerMTok` rate.

## Runnable examples

- [`examples/hello-pricing.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-pricing.ts) — `defaultPrices`, cached-token discount, custom price table; no real API key needed.
- [`examples/hello-cost-otel.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-cost-otel.ts) — `policy.maxTokens` ceiling enforcement, `CostBreakdown` output, and OTel spans from an `InMemoryTracer`.
