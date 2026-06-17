# Eidentic Docs

This repository contains the new documentation site for Eidentic.

It is an Astro-based docs app with:

- migrated content from the old `eidentic/docs` Docusaurus repo
- Meilisearch-backed search
- dark/light UI
- generated migration audit tooling so content moves can be verified

The current migration audit is clean:

- `45` old markdown docs found
- `45` docs imported
- `45` generated articles
- `45` search entries
- `0` missing docs
- `0` title mismatches
- `0` category mismatches
- `0` broken internal article links

## Stack

- Astro
- React
- Tailwind CSS
- Astro Node adapter
- Meilisearch

This is not a Next.js project.

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:4321`.

If you prefer npm:

```bash
npm install
npm run dev
```

## Useful scripts

```bash
npm run docs:import
npm run docs:verify
npm run docs:report
npm run search:sync
npm run build
```

## Migration safety

Old docs are imported from:

`/Users/baran/projects/eidentic/docs/docs`

Verification scripts live in:

- [`scripts/verify-eidentic-import.mjs`](./scripts/verify-eidentic-import.mjs)
- [`scripts/report-eidentic-migration.mjs`](./scripts/report-eidentic-migration.mjs)
- [`scripts/lib/eidentic-migration-audit.mjs`](./scripts/lib/eidentic-migration-audit.mjs)

Generated audit outputs are written to:

- [`reports/eidentic-migration-report.md`](./reports/eidentic-migration-report.md)
- [`reports/eidentic-migration-report.json`](./reports/eidentic-migration-report.json)

Run this before pushing migration updates:

```bash
npm run docs:verify
npm run build
```

## Environment

Copy `.env.example` to `.env` and fill in the values you need.

Current notable env vars:

```bash
PUBLIC_API_URL=https://your-api.example.com/api
PUBLIC_PROJECT_ID=your-project-uuid-here

HOST=0.0.0.0
PORT=4321

MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_INDEX=eidentic_docs
MEILISEARCH_SEARCH_API_KEY=
MEILISEARCH_ADMIN_API_KEY=
```

## Deployment

### Recommended: Dokploy with Dockerfile

This repo is configured to run as an Astro SSR app on a regular Node server.

Relevant files:

- [`astro.config.mjs`](./astro.config.mjs)
- [`Dockerfile`](./Dockerfile)
- [`.dockerignore`](./.dockerignore)

Local production-style run:

```bash
pnpm install
pnpm run build
HOST=0.0.0.0 PORT=4321 pnpm start
```

### Dokploy setup

Use these settings in Dokploy:

- Build type: `Dockerfile`
- Port: `4321`
- Dockerfile path: `./Dockerfile`
- Context path: repo root

Recommended environment variables:

```bash
HOST=0.0.0.0
PORT=4321
MEILISEARCH_HOST=...
MEILISEARCH_INDEX=eidentic_docs
MEILISEARCH_SEARCH_API_KEY=...
MEILISEARCH_ADMIN_API_KEY=...
```

If you expose a custom domain in Dokploy, route it to container port `4321`.

### Why Dockerfile instead of Nixpacks / Railpack

Dokploy supports several build types, but this repo is cleaner with `Dockerfile` because:

- Astro SSR has an explicit Node entrypoint
- we control the runtime and port directly
- deployment behavior is reproducible

This is not a Next.js app, so treating it like one would be sloppy.

## Old repo parity

The old repo still matters as historical source material for:

- docs content
- README messaging
- repo context
- Docker/static hosting history

But the old Dockerfile should not be copied as-is into this repo, because it assumed a static Docusaurus build served by nginx. This repo now ships its own Dokploy-friendly SSR Dockerfile instead.

## Links

- Old docs repo: [github.com/eidentic/docs](https://github.com/eidentic/docs)
- SDK repo: [github.com/eidentic/eidentic](https://github.com/eidentic/eidentic)
- Site: [docs.eidentic.dev](https://docs.eidentic.dev)
