---
title: Stores
description: Swap the persistence backend — sessions, event log, memory blocks, knowledge graph, and durable execution — without touching agent code.
---

A `StorePort` is the single persistence contract the agent runtime writes to and reads from. It persists sessions, the append-only event log, always-in-context memory blocks, the lexical memory index, and (on adapters that implement `GraphPort`) the temporal knowledge graph. Adapters that also implement `DurablePort` add durable execution — checkpoint/resume, exactly-once tool dispatch, and human-in-the-loop suspension decisions.

Swap the adapter by changing one constructor call. No agent code changes.

## Comparison

| Adapter | Package | Ports implemented | Runtime | Notes |
|---|---|---|---|---|
| `SqliteStore` | `@eidentic/sqlite` | StorePort · GraphPort · DurablePort | Node · Bun | Requires `better-sqlite3` native addon |
| `LibsqlStore` | `@eidentic/libsql` | StorePort · GraphPort · DurablePort | Node · Bun · Edge | Pure-JS, edge-safe; recommended for Next.js / serverless |
| `PostgresStore` | `@eidentic/postgres` | StorePort · GraphPort · DurablePort | Node · Bun | Accepts `pg.Pool` or PGlite; runs migrations on first use |
| `ConvexStore` | `@eidentic/convex` | StorePort · GraphPort · DurablePort | Node · Bun · Edge | App-functions model; two-step schema + handler setup required |

---

## SqliteStore

```bash
npm install @eidentic/sqlite better-sqlite3
```

`better-sqlite3` is a native addon — peer dependency, must be installed separately.

```ts
import { SqliteStore } from "@eidentic/sqlite";
import { Agent, AIModel } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";

const store = new SqliteStore("./eidentic.sqlite");
// or in-memory:
// const store = new SqliteStore(":memory:");

const agent = new Agent({
  id: "assistant",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store,
});
```

**Constructor:** `new SqliteStore(path?: string)`  
Default path is `":memory:"`. Accepts a file path or the special `":memory:"` string.

**Ports implemented:** `StorePort`, `GraphPort`, `DurablePort`

**Runtime notes:** Node 22/24 (CI verified) and Bun (native addon compiles on most Bun versions). Not available on Deno or edge/Workers — use `@eidentic/libsql` or `@eidentic/postgres` instead. Importing `@eidentic/sqlite` (or the `eidentic` umbrella) is safe on any runtime; the native addon is only loaded when `new SqliteStore()` is called.

---

## LibsqlStore

```bash
npm install @eidentic/libsql
```

Pure-JS — no native addon. Works in serverless and edge environments including Next.js App Router and Cloudflare Workers.

```ts
import { LibsqlStore } from "@eidentic/libsql";

// Local file (development)
const store = new LibsqlStore("file:eidentic.db");

// Turso remote (production)
const store = new LibsqlStore(process.env.LIBSQL_URL!, {
  authToken: process.env.LIBSQL_AUTH_TOKEN,
});
```

**Constructor:** `new LibsqlStore(url?: string | LibsqlStoreOptions, opts?: LibsqlStoreOptions)`  
Pass a URL string as the first argument (shorthand) or a full options object. Defaults to `":memory:"`.

**Ports implemented:** `StorePort`, `GraphPort`, `DurablePort`

**Runtime notes:** Edge-safe. Recommended for Next.js, Cloudflare Workers, Deno, and any environment without native addon support. Use [Turso](https://turso.tech) for a hosted LibSQL database.

---

## PostgresStore

```bash
npm install @eidentic/postgres pg
```

```ts
import { PostgresStore } from "@eidentic/postgres";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const store = await PostgresStore.create({ client: pool });
```

**Constructor:** `PostgresStore.create({ client }): Promise<PostgresStore>`  
Accepts any value satisfying the `PgClient` interface — `pg.Pool`, `pg.Client`, or `@electric-sql/pglite`. Runs schema migrations automatically on first call.

**Ports implemented:** `StorePort`, `GraphPort`, `DurablePort`

**Runtime notes:** Node and Bun. Pure HTTP driver — no native addon. If you want an in-process Postgres database without a server, swap `pg.Pool` for `@electric-sql/pglite`.

---

## ConvexStore

```bash
npm install @eidentic/convex convex
```

`convex` is a peer dependency.

`ConvexStore` implements `StorePort`, `GraphPort`, and `DurablePort`. Durable execution (checkpoint/resume, exactly-once idempotency ledger, HITL suspension decisions) is fully supported: Convex's serializable mutations make every checkpoint or completion write atomic by construction.

Setup is a two-step process — you spread the adapter's tables into your own Convex schema and re-export its function handlers, then build a runner from a `ConvexHttpClient`.

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { eidenticTables } from "@eidentic/convex/schema";

export default defineSchema({
  ...eidenticTables,
  // ...your own tables
});
```

```ts
// convex/eidentic.ts
export * from "@eidentic/convex/server";
```

Run `npx convex dev` as usual so Convex picks up the new tables and functions.

```ts
import { ConvexHttpClient } from "convex/browser";
import { ConvexStore, convexHttpRunner } from "@eidentic/convex";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);
const runner = convexHttpRunner(client);

const store = new ConvexStore(runner); // StorePort, GraphPort & DurablePort
```

**Constructor:** `new ConvexStore(runner)`  
`runner` is built with `convexHttpRunner(client)`. If you re-exported handlers from a module other than `convex/eidentic.ts`, pass custom function refs via `{ fns: defaultStoreFns("your-module-name") }`.

**Ports implemented:** `StorePort`, `GraphPort`, `DurablePort`

**Runtime notes:** Pure HTTP — edge-safe. The agent runtime runs outside Convex and communicates through the injectable runner. `migrate()` and `close()` are no-ops (Convex owns the schema).

See the `@eidentic/convex` README for the full two-step setup, codegen references, and testing with `convex-test`.
