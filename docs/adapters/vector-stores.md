---
title: Vector stores
description: Swap the vector backend that powers semantic recall in Eidentic's memory engine.
---

A `VectorPort` backs semantic recall in `Memory`. When you pass a vector store and an embedder to `Memory`, similarity search activates and is fused with lexical (BM25) recall via Reciprocal Rank Fusion (RRF).

All four adapters implement the optional `list` (scan) method, which enables archival deduplication and embedding reindex.

Pair a vector store with an [embedder](./embedders.md) to produce and query vectors.

## Comparison

| Adapter | Package | Notes |
|---|---|---|
| `LanceDBVectorStore` | `@eidentic/lancedb` | Embedded, local file; no external service |
| `PgVectorStore` | `@eidentic/pgvector` | pgvector extension on Postgres or PGlite |
| `QdrantVectorStore` | `@eidentic/qdrant` | Managed or self-hosted Qdrant |
| `PineconeVectorStore` | `@eidentic/pinecone` | Fully managed Pinecone; index must be pre-created |

---

## LanceDBVectorStore

```bash
npm install @eidentic/lancedb @lancedb/lancedb apache-arrow
```

```ts
import { LanceDBVectorStore } from "@eidentic/lancedb";

const vector = await LanceDBVectorStore.open(
  "./lancedb",        // local directory for LanceDB tables
  "memory_vectors",   // table name
  1536,               // embedding dimension
);
```

**Factory:** `LanceDBVectorStore.open(path: string, tableName: string, dim: number): Promise<LanceDBVectorStore>`

Embedded — no server required. Suitable for single-node and development deployments.

---

## PgVectorStore

```bash
npm install @eidentic/pgvector pg
# or with PGlite (in-process, no server needed):
# npm install @eidentic/pgvector @electric-sql/pglite
```

```ts
import { PgVectorStore } from "@eidentic/pgvector";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const vector = await PgVectorStore.create({
  client: pool,
  table: "memory_vectors", // optional, defaults to "memories"
  dim: 1536,
});
```

**Factory:** `PgVectorStore.create({ client, table?, dim }): Promise<PgVectorStore>`  
`client` accepts `pg.Pool`, `pg.Client`, or `@electric-sql/pglite`. Creates the `pgvector` extension and table automatically on first use.

Requires the `pgvector` extension to be available in your database (the adapter enables it via `CREATE EXTENSION IF NOT EXISTS vector`).

---

## QdrantVectorStore

```bash
npm install @eidentic/qdrant @qdrant/js-client-rest
```

```ts
import { QdrantVectorStore } from "@eidentic/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: process.env.QDRANT_URL });

const vector = await QdrantVectorStore.create({
  client,
  collection: "eidentic-memory",
  dim: 1536,
});
```

**Factory:** `QdrantVectorStore.create({ client, collection, dim }): Promise<QdrantVectorStore>`  
String IDs are deterministically mapped to UUIDs (SHA-1, UUIDv5 format) to satisfy Qdrant's ID constraints. Creates the collection if it does not already exist.

---

## PineconeVectorStore

```bash
npm install @eidentic/pinecone @pinecone-database/pinecone
```

```ts
import { PineconeVectorStore } from "@eidentic/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index("eidentic-memory");

const vector = PineconeVectorStore.create({
  index,
  dim: 1536,
});
```

**Factory:** `PineconeVectorStore.create({ index, dim }): PineconeVectorStore`  
Synchronous — no await needed. The Pinecone index must be pre-created with the matching dimension and cosine metric; this adapter does not create indexes.
