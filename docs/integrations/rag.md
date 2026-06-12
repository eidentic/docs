---
title: RAG
description: Ingest documents into agent memory with @eidentic/rag — chunking, loaders, and URL fetching.
---

`@eidentic/rag` provides the ingestion layer for Retrieval-Augmented Generation: it chunks text, loads documents from files or URLs, and feeds the resulting events into any `Memory` instance.

## Install

```bash
npm install @eidentic/rag
```

For PDF support, also install the optional peer:

```bash
npm install pdf-parse
```

## Core functions

### `chunkText(text, opts?)`

Splits a string into overlapping chunks ready for embedding.

```ts
import { chunkText } from "@eidentic/rag";

const chunks = chunkText(doc, {
  size: 512,       // target chunk size in characters (default 1000)
  overlap: 64,     // overlap with the previous chunk (default 150)
  strategy: "paragraph", // "fixed" | "paragraph" | "sentence" (default "fixed")
});
// chunks: Array<{ text: string; index: number; start: number; end: number }>
```

Each `Chunk` carries `index`, `start`, and `end` offsets into the original text so retrieval results can cite their source position. The `overlap` prefix from the previous chunk is prepended to each chunk's text so retrieval can straddle boundaries.

### `ingestDocument(source, opts)`

Fetches or accepts a document, applies the appropriate loader, chunks it, and writes `MemoryEvent` objects into a `Memory` instance.

```ts
import { ingestDocument } from "@eidentic/rag";
import { Memory } from "@eidentic/memory";

// Fetch a URL (SSRF guard enforced; private/loopback hosts rejected)
await ingestDocument(
  { url: "https://docs.example.com/guide" },
  { memory, scope: { kind: "user", agentId: "support", userId: "u-1" } },
);

// Pre-loaded text
await ingestDocument("Raw content here", {
  memory,
  scope: { kind: "user", agentId: "support", userId: "u-1" },
  chunk: { size: 512, overlap: 64 },
});

// Returns { chunks: number }
const { chunks } = await ingestDocument(source, opts);
```

The `source` parameter accepts three forms:

| Form | Description |
|---|---|
| `string` | Raw text — chunked directly, no network fetch |
| `{ url: string }` | Fetched over HTTP(S); redirect hops re-validated |
| `TypedContentSource` | `{ type: "markdown" \| "html" \| "pdf", data: … }` |

`IngestDocumentOptions`:

| Option | Type | Description |
|---|---|---|
| `memory` | `IngestableMemory` | Any object with `ingest(events)` |
| `scope` | `Scope` | Memory scope for the ingested chunks |
| `docId?` | `string` | Stable document ID for chunk IDs (default: slug from URL or text hash) |
| `chunk?` | `ChunkOptions` | Forwarded to `chunkText` |
| `allowlist?` | `string[]` | Restrict URL fetches to listed hostnames |

### Loaders

The loaders extract plain text from structured formats.

```ts
import { loadMarkdown, loadHtml, loadPdf } from "@eidentic/rag";

const md = loadMarkdown(markdownString, { source: "https://example.com/doc" });
// → { text: string; metadata: { source: string } }

const html = loadHtml(htmlString, { source: "https://example.com/page" });
// → { text: string; metadata: { source: string } }

const pdf = await loadPdf(pdfBuffer, { source: "invoice.pdf" });
// → { text: string; metadata: { source: string; pages: number } }
// Requires pdf-parse peer dep — throws a clear error if absent.
```

You can also pass pre-loaded content directly to `ingestDocument` via `TypedContentSource`:

```ts
await ingestDocument(
  { type: "html", data: "<html>…</html>", source: "https://example.com" },
  { memory, scope },
);
```

## Ingestion pipeline

```
source (URL / text / buffer)
  → loader (loadMarkdown / loadHtml / loadPdf — strips markup)
  → chunkText (overlapping windows)
  → MemoryEvent[] (id, scope, text, metadata.source)
  → memory.ingest(events)
  → indexed in BM25 + optional vector store
```

Once ingested, chunks surface automatically during `agent.query()` via `memory.retrieve()`. The `metadata.source` field passes through to recalled `MemorySnippet.metadata.source` so the model can cite its sources.

## Full example

```ts
import { Agent, AIModel, SqliteStore } from "eidentic";
import { Memory } from "@eidentic/memory";
import { ingestDocument, loadMarkdown } from "@eidentic/rag";
import { anthropic } from "@ai-sdk/anthropic";
import { readFileSync } from "node:fs";

const store = new SqliteStore("./eidentic.sqlite");
const memory = new Memory({ store });

const agent = new Agent({
  id: "support",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store,
  memory,
});

// Ingest a local Markdown file
const raw = readFileSync("./docs/faq.md", "utf8");
const doc = loadMarkdown(raw, { source: "faq.md" });
const chunks = chunkText(doc.text, { size: 512, overlap: 64 });
// or use ingestDocument directly:
await ingestDocument(
  { type: "markdown", data: raw, source: "faq.md" },
  { memory, scope: { kind: "agent", agentId: "support" } },
);

// Ingest a live URL
await ingestDocument(
  { url: "https://docs.example.com/api" },
  { memory, scope: { kind: "agent", agentId: "support" } },
);
```

See the [`@eidentic/memory` guide](/guides/memory) for how recalled chunks reach the model.
