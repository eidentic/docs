---
title: Sessions & event sourcing
description: How Eidentic identifies sessions, stores the event log, and supports resume and listing.
---

Every agent run belongs to a **session** — an append-only log of typed events identified by a `sessionId`. Sessions are the durable substrate that powers multi-turn memory, crash-resume, and audit.

## Session identity

A session is created the first time `agent.query()` is called with a given `sessionId`. All subsequent calls with the same id continue the same session:

```ts
// First call — session "chat-42" is created
for await (const ev of agent.query("Hello.", { sessionId: "chat-42" })) {}

// Later call — session "chat-42" continues
for await (const ev of agent.query("What did I just say?", { sessionId: "chat-42" })) {}
```

Session ids are caller-supplied strings. Use stable, meaningful identifiers (`user-${userId}-support`, `order-${orderId}-review`) so sessions stay resumable and auditable across process restarts.

## Owner identity

A session can be locked to a principal by passing `userId` or `orgId` at query time. Once recorded, only a caller that supplies a matching identity can continue or resume that session:

```ts
for await (const ev of agent.query("Hello.", {
  sessionId: "chat-42",
  userId: "user-7",
})) {}
```

Passing a mismatched `userId` on a subsequent call throws a `StoreConflictError`. This prevents cross-tenant reads in multi-tenant deployments.

## The event log

Internally, a session is represented as a `Session` object backed by an append-only event store. Events have this shape:

```ts
interface StoredEvent {
  id: string;
  sessionId: string;
  seq: number;
  kind: EventKind;  // "user" | "assistant" | "tool_call" | "tool_result" | "checkpoint" | ...
  schemaVersion: number;
  payload: unknown;
  meta?: { usage?: Usage };
  createdAt: string;
}
```

`seq` is a monotone counter scoped to the session. The log is strictly append-only — no event is ever mutated or deleted (except via an explicit GDPR erasure).

The event schema is versioned. When you load events written by an older version of the library, the built-in upcaster chain migrates them to the current schema transparently.

## Replay and resume

Because the full event log is persisted, an interrupted run can be continued exactly where it stopped. On `agent.resume(sessionId)`, Eidentic replays the log to reconstruct the conversation state, skips already-completed tool dispatches (via the idempotency ledger), and re-enters the loop from the last checkpoint. See the Durable execution concept page for the full picture.

## Listing sessions

`store.listSessions()` returns `SessionRecord` objects for admin UIs and inspection:

```ts
const sessions = await store.listSessions({
  agentId: "assistant",
  userId: "user-7",
  limit: 20,
});

for (const s of sessions) {
  console.log(s.id, s.createdAt, s.userId);
}
```

`listSessions` options:

| Option | Type | Description |
|---|---|---|
| `agentId` | `string?` | Filter to a specific agent. |
| `userId` | `string?` | Return only sessions owned by this user (strict — sessions with no owner are excluded). |
| `orgId` | `string?` | Return only sessions owned by this org. |
| `limit` | `number?` | Cap the result set (newest first). |

## Session record shape

```ts
interface SessionRecord {
  id: string;
  agentId: string;
  createdAt: string;
  userId?: string;   // set when query() was called with a userId
  orgId?: string;    // set when query() was called with an orgId
  apiKey?: string;   // set when a bearer-token principal created the session
}
```

## Store backends

Sessions and events are stored via the `StorePort` interface. The bundled implementations are:

| Package | Backend | Use case |
|---|---|---|
| `@eidentic/sqlite` (`SqliteStore`) | SQLite (embedded) | Local dev, single-process apps |
| `@eidentic/libsql` (`LibsqlStore`) | libSQL / Turso | Edge deployments |
| `@eidentic/postgres` (`PostgresStore`) | PostgreSQL | Server-side production |
| `@eidentic/convex` (`ConvexStore`) | Convex | Serverless / Convex apps |

All four also implement `DurablePort`, so they support durable execution without any extra setup.

Call `store.migrate()` once on startup (or let the agent call it lazily on the first `query()`):

```ts
const store = new SqliteStore("./eidentic.sqlite");
await store.migrate(); // forward-only schema migrations, safe to re-run
```

See [hello-stateful.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-stateful.ts) for a complete working example.
