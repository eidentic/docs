---
title: Knowledge graph
description: Store and query structured facts with temporal validity windows using Eidentic's knowledge graph tier.
---

The knowledge graph is Tier-4 of Eidentic's memory stack. It stores structured (subject, predicate, object) triples with ISO timestamp validity ranges, so you can ask not just "what is true now" but "what was true at a past date."

## Enabling it

Pass a `GraphPort` as the `graph` option when constructing `Memory`. Most built-in stores (`SqliteStore`, `LibsqlStore`, `PostgresStore`, `InMemoryStore`) implement both `StorePort` and `GraphPort`, so you can pass the same object for both:

```ts
import { Memory } from "@eidentic/memory";
import { SqliteStore } from "@eidentic/sqlite";

const store = await SqliteStore.create("./eidentic.sqlite");

const memory = new Memory({
  store,
  graph: store,  // same object; SqliteStore implements GraphPort
});
```

Without `graph`, calls to `assertFact`, `queryFacts`, `factTimeline`, or `sweepExpiredFacts` throw immediately.

## Asserting facts

```ts
import type { Scope } from "@eidentic/types";

const scope: Scope = { kind: "user", agentId: "my-agent", userId: "user-42" };

const result = await memory.assertFact(scope, {
  subject: "user",
  predicate: "city",
  object: "Berlin",
  // validFrom defaults to the current clock if omitted
});

console.log(result.asserted);     // the new Fact row
console.log(result.invalidated);  // prior facts for the same (subject, predicate) that were superseded
```

`AssertFactInput` fields:

| Field | Type | Default |
|---|---|---|
| `subject` | `string` | required |
| `predicate` | `string` | required |
| `object` | `string` | required |
| `objectKind` | `"entity" \| "literal"` | `"literal"` |
| `validFrom` | ISO string | clock at call time |
| `confidence` | `0..1` | `1` |
| `source` | `string` | — |
| `ttlMs` | `number` | — |

## Contradiction handling

Asserting a new fact with the same `subject` and `predicate` but a different `object` **invalidates** the previous fact — `validUntil` is set to the new fact's `validFrom`. The old row is never deleted, so the full history remains queryable.

Re-asserting the same `(subject, predicate, object)` triple is idempotent.

## Querying facts

```ts
// Currently-valid facts only (default)
const current = await memory.queryFacts({
  scope,
  subject: "user",
  predicate: "city",
});

// Point-in-time query: what was true on a past date?
const past = await memory.queryFacts({
  scope,
  subject: "user",
  predicate: "city",
  validAt: "2025-01-01T00:00:00.000Z",
});

// Full history including invalidated facts
const all = await memory.queryFacts({
  scope,
  subject: "user",
  predicate: "city",
  includeInvalidated: true,
});
```

`FactQuery` fields:

| Field | Type | Description |
|---|---|---|
| `scope` | `Scope` | required |
| `subject` | `string` | filter by subject |
| `predicate` | `string` | filter by predicate |
| `object` | `string` | filter by object |
| `validAt` | ISO string | point-in-time snapshot |
| `includeInvalidated` | `boolean` | include superseded/expired facts |
| `limit` | `number` | cap returned rows |

Each returned `Fact` has:

```ts
interface Fact {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  objectKind: "entity" | "literal";
  validFrom: string;       // ISO
  validUntil?: string;     // set when invalidated
  confidence: number;
  source?: string;
  expiresAt?: string;      // set when ttlMs was supplied
  supersedes?: string;     // id of the prior fact this replaced
  lastCorroboratedAt?: number; // epoch-ms
}
```

## State-transition timeline

`factTimeline` returns every version ever asserted for a `(subject, predicate)` pair, ordered ascending by `validFrom`:

```ts
const history = await memory.factTimeline(scope, "user", "city");
// [{ object: "London", validFrom: "2024-01-01...", validUntil: "2025-06-01..." },
//  { object: "Berlin", validFrom: "2025-06-01...", validUntil: undefined }]
```

## Passive fact extraction

When `Memory` is configured with `extraction: "passive"` or `"hybrid"`, the engine runs a rule-based extractor on every `ingest` call and asserts facts with `confidence: 0.6` automatically. This requires `graph` to be set.

```ts
const memory = new Memory({
  store,
  graph: store,
  extraction: "passive",   // or "hybrid" to also run the agentic Consolidator
});
```

The default is `"agentic"` — no passive extraction; only the explicit `assertFact` path and the `ConsolidationScheduler` run.

## Transient fact TTLs

Facts whose supporting text contains a word from `TRANSIENT_MARKERS` (e.g. `"currently"`, `"today"`, `"this week"`) are treated as short-lived. Set `transientTtlMs` to expire them automatically:

```ts
import { Memory, TRANSIENT_MARKERS } from "@eidentic/memory";

const memory = new Memory({
  store,
  graph: store,
  transientTtlMs: 24 * 60 * 60 * 1000, // 24 h (this is the default)
});
```

Set `transientTtlMs: 0` to disable automatic expiry for transient facts.

## Sweeping expired facts

Facts with an `expiresAt` that has passed are not removed automatically — call `sweepExpiredFacts` to invalidate them (sets `validUntil`, never deletes):

```ts
const count = await memory.sweepExpiredFacts(scope);
```

## Corroboration (staleness tiers)

Re-confirm a still-valid fact without creating a new version:

```ts
await memory.corroborate(scope, factId); // bumps lastCorroboratedAt to now
```

Enable staleness flagging at retrieval time with `corroborationTtlMs`. Facts not re-confirmed within the window are annotated `"(last confirmed >Nd ago — may be outdated)"`:

```ts
const memory = new Memory({
  store,
  graph: store,
  // global window, or per-predicate: { works_at: 90 * 86_400_000 }
  corroborationTtlMs: 90 * 24 * 60 * 60 * 1000,
});
```

## Runnable example

[`examples/hello-graph.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-graph.ts) walks through asserting two contradicting facts, a point-in-time query, and reading the full history — no infra required (uses `InMemoryStore`).
