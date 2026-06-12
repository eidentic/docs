---
title: Durable execution
description: Checkpoint and resume interrupted runs, guarantee exactly-once tool dispatch, and pause for human approval.
---

Without durability, a crash mid-run loses all progress and a retry re-sends every email, payment, or write the agent already executed. Durable execution solves both problems: crashed runs resume from the last checkpoint, and side-effecting tools are skipped on resume if they already completed.

## Enabling durable execution

Add `durable: true` to `AgentConfig`. The store must implement `DurablePort` — all four bundled stores (`SqliteStore`, `LibsqlStore`, `PostgresStore`, `ConvexStore`) do:

```ts
import { Agent, createTool } from "@eidentic/core";
import { SqliteStore } from "@eidentic/sqlite";

const store = new SqliteStore("./eidentic.sqlite");
await store.migrate();

const agent = new Agent({
  id: "mailer",
  instructions: "Send the email.",
  model,
  store,
  tools: [sendEmail],
  durable: true,
});
```

If `durable: true` is set but the store does not implement `DurablePort`, the agent throws at the first `query()` call with a clear error message.

## Checkpoints and resume

After every tool dispatch and every model call, Eidentic writes a content-addressed checkpoint. If the process crashes, call `agent.resume(sessionId)` to continue from the last checkpoint — already-completed steps are skipped, not re-run:

```ts
// Run 1 — may crash partway through
for await (const ev of agent.query("Send the email.", { sessionId: "run-1" })) {}

// Run 2 — resume from where it stopped; completed tools are not re-dispatched
for await (const ev of agent.resume("run-1")) {
  if (ev.type === "result") console.log(ev.output);
}
```

`resume` signature:

```ts
async *resume(
  sessionId: string,
  opts?: {
    userId?: string;
    orgId?: string;
    decision?: SuspendDecision;
    signal?: AbortSignal;
    outputSchema?: z.ZodType;
  }
): AsyncIterable<StreamEvent>
```

When `userId` or `orgId` is supplied, it is checked against the session's recorded owner. A mismatch throws `"session ownership mismatch"`.

## Exactly-once tool dispatch

The idempotency ledger prevents a side-effecting tool from executing more than once across crash/resume cycles. Declare `idempotencyKey` on any `"idempotent"` or `"destructive"` tool:

```ts
const sendEmail = createTool({
  id: "send_email",
  description: "Send an email — destructive, exactly once.",
  sideEffect: "destructive",
  inputSchema: z.object({ to: z.string() }),
  idempotencyKey: (input) => `send_email:${input.to}`,
  execute: async ({ input }) => {
    // This body runs at most once per (sessionId, key) pair.
    return { sent: true, to: input.to };
  },
});
```

The registry writes an **intent record** before executing, then a **completion record** after. On resume, a key already recorded as `"applied"` is skipped and the original result is returned — no re-execution. Without an `idempotencyKey`, a destructive tool still runs but logs a warning that exactly-once is not guaranteed.

The key is automatically scoped by `sessionId` in the ledger, so two sessions with identical tool arguments do not collide.

See [hello-durable.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-durable.ts) for a complete crash-and-resume example.

## Human-in-the-loop suspension

A tool can pause the entire run and wait for a human decision — consuming no compute while waiting — then resume with full context when the decision arrives.

In the tool's `execute` function, call `ctx.suspend()`. On the first run this throws a `SuspendSignal` that checkpoints the run and yields a `result{subtype:"suspended"}` terminal event. On resume with a `decision`, `ctx.suspend()` returns the recorded decision and the tool continues:

```ts
const requestRefund = createTool({
  id: "request_refund",
  description: "Issue a refund after human approval.",
  sideEffect: "destructive",
  inputSchema: z.object({ amount: z.number() }),
  idempotencyKey: (i) => `refund:${i.amount}`,
  execute: async ({ input, ctx }) => {
    // First run: suspends here. Resume: returns the decision.
    const decision = await ctx!.suspend!({
      reason: "approve refund",
      present: { amount: input.amount },
    });
    if (!decision.approved) return { refunded: false };
    return { refunded: true, amount: input.amount };
  },
});
```

`ctx.suspend` is only available on durable runs. Calling it on a non-durable run throws immediately.

### Starting a suspendable run

```ts
for await (const ev of agent.query("Refund $50.", { sessionId: "run-A" })) {
  if (ev.type === "result" && ev.subtype === "suspended") {
    console.log("Waiting for approval:", ev.request);
  }
}
```

### Resuming with a decision

```ts
for await (const ev of agent.resume("run-A", {
  decision: { approved: true },
})) {
  if (ev.type === "result") console.log(ev.output);
}
```

`SuspendDecision` is `{ approved: boolean }`. The decision is recorded by `durable.recordDecision(sessionId, callId, decision)` before replay begins, so the tool sees it on the re-dispatched call.

See [hello-suspend.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-suspend.ts) for approve and deny scenarios, and [hello-cancellation.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-cancellation.ts) for cooperative cancellation via `AbortSignal`.

## `DurablePort`

All four bundled stores implement this interface. Custom stores must implement these methods to support `durable: true`:

```ts
interface DurablePort {
  writeCheckpoint(sessionId: string, seq: number, hash: string): Promise<void>;
  lastCheckpoint(sessionId: string): Promise<Checkpoint | null>;
  recordIntent(key: string, argsHash: string): Promise<void>;
  recordCompletion(key: string, result: unknown): Promise<void>;
  getIdempotency(key: string): Promise<IdempotencyRecord | null>;
  recordDecision(sessionId: string, callId: string, decision: SuspendDecision): Promise<void>;
  getDecision(sessionId: string, callId: string): Promise<SuspendDecision | null>;
}
```

## Fast path vs. durable path

Durable execution adds ~5–20 ms per step for journaling. For short interactive turns this may be undesirable. Omit `durable: true` (the default) for a fast in-memory path; add it for multi-step, long-running, or side-effecting workflows:

| | Fast path | Durable path |
|---|---|---|
| Config | `durable` omitted (default) | `durable: true` |
| Crash behaviour | Run lost | Resume from last checkpoint |
| Side effects | May re-execute | Exactly-once via ledger |
| Latency overhead | None | ~5–20 ms/step |
