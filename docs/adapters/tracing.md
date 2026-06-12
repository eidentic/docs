---
title: Tracing
description: Export OpenTelemetry GenAI spans from Eidentic to Langfuse or any OTLP/HTTP backend.
---

Eidentic emits OpenTelemetry GenAI Semantic Convention spans through the `TracerPort` interface. Any adapter that implements `TracerPort` can receive them; `@eidentic/langfuse` ships a ready-made adapter that exports to Langfuse's OTLP/HTTP endpoint with no extra SDK dependency.

Tracing is distinct from the audit bus (`onAuditEvent`), which covers security/compliance events (permission denials, erasures). Tracing covers performance and token observability.

## The `TracerPort` interface

```ts
interface TracerPort {
  startSpan(
    name: string,
    attributes?: Record<string, string | number | boolean>,
  ): Span;
}

interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: "ok" | "error", message?: string): void;
  end(): void;
}
```

Wire a tracer by passing it to `AgentConfig.tracer`:

```ts
const agent = new Agent({
  id: "my-agent",
  model,
  store,
  tracer, // any TracerPort implementation
});
```

## Spans emitted by Eidentic

| Span name | Key attributes |
|---|---|
| `gen_ai.invoke_agent` | `gen_ai.agent.id`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.usage.cached_input_tokens`, `eidentic.cost_usd`, `eidentic.kv_cache_hit_rate` |
| `gen_ai.chat` | `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` |
| `gen_ai.execute_tool` | `gen_ai.tool.name` |
| `memory.ingest` | `eidentic.scope` |
| `memory.retrieve` | `eidentic.scope` |

All `gen_ai.*` attributes follow the OpenTelemetry GenAI Semantic Conventions, so they populate Langfuse's model and token dashboards automatically.

## `@eidentic/langfuse` adapter

Install:

```bash
pnpm add @eidentic/langfuse
```

Create a tracer and pass it to the agent:

```ts
import { Agent } from "@eidentic/core";
import { langfuseTracer } from "@eidentic/langfuse";
import { AIModel } from "@eidentic/model";
import { SqliteStore } from "@eidentic/sqlite";
import { openai } from "@ai-sdk/openai";

const model = new AIModel(openai("gpt-4o-mini"));
const store = await SqliteStore.create("./eidentic.sqlite");

const tracer = langfuseTracer({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  // Optional — defaults to https://cloud.langfuse.com (EU)
  // baseUrl: "https://us.cloud.langfuse.com",
});

const agent = new Agent({
  id: "my-agent",
  model,
  store,
  tracer,
});

for await (const event of agent.query("Hello!")) {
  if (event.type === "result") console.log(event.output);
}

// Flush remaining spans and cancel the auto-flush timer on process exit.
await tracer.shutdown();
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `publicKey` | `string` | required | Langfuse project public key (`pk-lf-…`) |
| `secretKey` | `string` | required | Langfuse project secret key (`sk-lf-…`) |
| `baseUrl` | `string` | `https://cloud.langfuse.com` | Langfuse base URL (no trailing slash) |
| `flushAt` | `number` | `20` | Buffer size threshold that triggers an automatic flush |
| `flushInterval` | `number` | `5000` | Max milliseconds between automatic flushes |
| `fetchImpl` | `typeof fetch` | `globalThis.fetch` | Override the fetch implementation (useful in tests) |
| `redactAttributes` | callback | `undefined` | Scrub or mask span attributes before export (see below) |
| `onFlushError` | callback | `undefined` | Called with the error and dropped-span count on flush failures |
| `maxBufferSize` | `number` | `10000` | Drop-oldest cap on the in-memory span buffer |

### Attribute redaction

Span attributes can contain prompt text and tool arguments. Redact before they leave the process:

```ts
const tracer = langfuseTracer({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  redactAttributes: (attrs) =>
    attrs.filter(({ key }) => !key.startsWith("llm.prompt")),
});
```

### Dropped spans

The `LangfuseTracer` interface extends `TracerPort` with:

```ts
interface LangfuseTracer extends TracerPort {
  flush(): Promise<void>;
  shutdown(): Promise<void>;
  readonly droppedSpans: number;
}
```

`droppedSpans` counts spans silently dropped due to flush errors or buffer-cap overflow since the tracer was created. Feed it to your own monitoring pipeline via `onFlushError`.

### Transport

Spans are sent to `{baseUrl}/api/public/otel/v1/traces` as `POST` requests with `Content-Type: application/json` and `Authorization: Basic <base64(publicKey:secretKey)>`. The body is a standard OTLP/HTTP JSON `ExportTraceServiceRequest`. Network errors are silently swallowed and counted in `droppedSpans`.

## Runnable example

[`examples/hello-cost-otel.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-cost-otel.ts) shows `policy.maxTokens` enforcement and inspects the spans emitted by an `InMemoryTracer` from `@eidentic/types/testing` — no real API key or Langfuse account needed.
