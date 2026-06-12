---
title: Embedders & rerankers
description: Choose between a hosted API embedder or a fully local on-device embedder (and optional reranker) for Eidentic's memory engine.
---

An embedder converts text into vectors for storage and retrieval in a [vector store](./vector-stores.md). A reranker re-scores recalled snippets by relevance before they reach the model's context window.

Eidentic ships two embedder packages:

- **`@eidentic/model`** — `AIEmbedder` wraps any AI SDK embedding model (OpenAI, Cohere, Google, Mistral, …). Requires an API key; works on any runtime.
- **`@eidentic/transformers`** — `LocalEmbedder` and `LocalReranker` run entirely on-device via `@huggingface/transformers`. No API key, no external calls.

---

## AIEmbedder (`@eidentic/model`)

```bash
npm install @eidentic/model ai @ai-sdk/openai
# or any other @ai-sdk/* provider
```

```ts
import { AIEmbedder } from "@eidentic/model";
import { openai } from "@ai-sdk/openai";

const embedder = await AIEmbedder.create(
  openai.embedding("text-embedding-3-small"),
);
// embedder.dim is set automatically by probing the model once
```

**Factory:** `AIEmbedder.create(model, opts?): Promise<AIEmbedder>`  
`model` is any AI SDK v6 embedding model. On construction, the factory makes one embedding call to probe the output dimension; `embedder.dim` is set from the result. The optional `opts` object accepts `maxRetries?: number` (default `2`).

Pass the returned `AIEmbedder` to `Memory`:

```ts
import { Memory } from "@eidentic/memory";

const memory = new Memory({ store, vector, embedder });
```

---

## LocalEmbedder & LocalReranker (`@eidentic/transformers`)

```bash
npm install @eidentic/transformers @huggingface/transformers
```

Runs `bge-small-en-v1.5` (384-dim embeddings) and a cross-encoder reranker (`cross-encoder/ms-marco-MiniLM-L-6-v2`) entirely in-process. Models are downloaded on first use and cached locally. No API key required.

```ts
import { LocalEmbedder, LocalReranker } from "@eidentic/transformers";

// Load once; models download and cache on first run
const embedder = await LocalEmbedder.load(); // dim = 384
const reranker = await LocalReranker.load();
```

**Factory:** `LocalEmbedder.load(): Promise<LocalEmbedder>`  
Output dimension is fixed at `384` (bge-small-en-v1.5).

**Factory:** `LocalReranker.load(): Promise<LocalReranker>`

Use with `Memory`:

```ts
import { Memory } from "@eidentic/memory";

const memory = new Memory({ store, vector, embedder, reranker });
```

When a `reranker` is provided, recalled snippets are re-scored by cross-encoder relevance before being passed to the model.
