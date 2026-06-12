---
title: Scaffold a project
description: Get a new Eidentic project running in one command using create-eidentic and the eidentic CLI.
---

Two tools get you from zero to a running agent project: the `create-eidentic` scaffolder for new projects, and the `eidentic` CLI for day-to-day development.

## Create a new project

```bash
npm create eidentic@latest my-agent
# or
npx create-eidentic my-agent
```

Follow the interactive prompts to choose your model provider and project template.

**Providers:** `anthropic` | `openai` | `google` | `deepseek` | `mistral`

**Templates:**

| Template | What you get |
|---|---|
| `default` | Bare Node.js agent script — no framework |
| `nextjs-chat` | Next.js App Router chat UI with `@eidentic/nextjs` + `useChat` |
| `bun-agent` | Bun-native agent script with `@eidentic/sqlite` |

### Non-interactive

Pass flags to skip the prompts:

```bash
npm create eidentic@latest my-agent -- --provider anthropic --template nextjs-chat
```

### After scaffolding

```bash
cd my-agent
pnpm install
export ANTHROPIC_API_KEY=sk-ant-...
pnpm dev
```

## CLI commands

The `eidentic` CLI is bundled in the `eidentic` umbrella package. Install it globally or run it via `npx`:

```bash
npm install -g eidentic
# or: npx eidentic <command>
```

### `eidentic init`

Scaffold Eidentic into an **existing** project directory. Idempotent — never overwrites existing files.

```bash
eidentic init
```

Creates `eidentic.config.ts`, `src/agent.ts`, `.env.example`, and `.gitignore` (with `.env` appended).

### `eidentic dev`

Start the dev server with live-reload. Loads `eidentic.config.ts` (or `.js` / `.mjs`) from the current directory using jiti — no build step required.

```bash
eidentic dev
```

The server exposes `POST /v1/agents/<id>/query` as an SSE endpoint for each agent declared in the config.

### `eidentic studio`

Open the local Studio dashboard — a visual interface for browsing sessions, memory blocks, skills, and workflow traces.

```bash
eidentic studio
```

Studio is a **dev-only tool**. Never expose it on a public address without configuring authentication.

### `eidentic add component`

Copy a built-in React UI component into your project (`components/eidentic/<name>.tsx`).

```bash
eidentic add component chat
eidentic add component run-status
eidentic add component workflow-trace
```

| Component | What it provides |
|---|---|
| `chat` | Full-featured streaming chat UI using `useAgent` (messages, tool-call display, stop) |
| `run-status` | Fire-and-poll async run status badge using `useAsyncRun` and `useRunStatus` |
| `workflow-trace` | Workflow run trace viewer using `useWorkflowRun` (step timeline, status badges) |

### `eidentic add skill`

Install a skill from a local directory into `skills/<name>/`:

```bash
eidentic add skill ./path/to/my-skill
```

The directory must contain a `SKILL.md` file (agentskills.io format). Skills with executable files produce a warning before installation. Pass `--force` to overwrite an existing skill.

### `eidentic doctor`

Run environment health diagnostics — checks Node.js version, model-provider API key presence, and config file existence.

```bash
eidentic doctor
```

## `eidentic.config.ts`

`eidentic dev` loads this file. Define one or more agents and export them under `agents`:

```ts
import { defineConfig } from "eidentic";
import { Agent, AIModel, SqliteStore, createTool, defaultPrices } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const store = new SqliteStore("./eidentic.sqlite");
await store.migrate();

const getTime = createTool({
  id: "get_time",
  description: "Get the current server time.",
  inputSchema: z.object({}),
  execute: async () => ({ now: new Date().toISOString() }),
});

export default defineConfig({
  agents: {
    assistant: new Agent({
      id: "assistant",
      instructions: "You are a helpful assistant.",
      model: new AIModel(anthropic("claude-sonnet-4-5")),
      tools: [getTime],
      store,
      prices: defaultPrices,
    }),
  },
  port: 3000,
  // auth: ApiKeyAuth({ "key_live_123": { userId: "u1" } }),
});
```

Config fields:

| Field | Required | Description |
|---|---|---|
| `agents` | Yes | `Record<string, Agent>` — at least one agent required |
| `port` | No | HTTP port (default `3000`) |
| `auth` | No | `AuthPort` — omit only for local dev |
| `basePath` | No | URL prefix for all routes |
| `exposeEvents` | No | Enable the raw event-stream endpoint |
