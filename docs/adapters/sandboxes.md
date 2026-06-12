---
title: Sandboxes
description: Run untrusted code safely inside isolated microVMs by wiring a sandbox adapter into the agent.
---

A `SandboxPort` gives the agent a safe environment to execute code and shell commands. When no sandbox is configured, the agent uses a `NoopSandbox` that refuses all execution — a fail-safe default that prevents accidental code execution in production.

---

## E2BSandbox (`@eidentic/e2b`)

`E2BSandbox` implements `SandboxPort` using [E2B](https://e2b.dev) Firecracker microVMs. Each `run()` call creates a fresh isolated sandbox and tears it down afterward.

```bash
npm install @eidentic/e2b @e2b/code-interpreter
```

```ts
import { E2BSandbox } from "@eidentic/e2b";
import { Sandbox } from "@e2b/code-interpreter";
import { Agent } from "eidentic";

const sandbox = await E2BSandbox.create({
  client: Sandbox,
  apiKey: process.env.E2B_API_KEY,
  defaultTimeoutMs: 10_000,
});

const agent = new Agent({
  id: "coder",
  model,
  store,
  sandbox,
});
```

**Factory:** `E2BSandbox.create({ client, apiKey?, defaultTimeoutMs? }): Promise<E2BSandbox>`  
`client` is the `Sandbox` class from `@e2b/code-interpreter` (or any value satisfying the `E2BLike` interface for testing). `apiKey` defaults to `process.env.E2B_API_KEY` if not passed. `defaultTimeoutMs` bounds each sandbox run; individual `run()` calls can override it.

Pass the `sandbox` instance to `Agent` via the `sandbox` field in `AgentConfig`. When a tool triggers code execution, the agent dispatches to the sandbox automatically.

### Default: NoopSandbox

If `sandbox` is omitted from `AgentConfig`, the agent uses a `NoopSandbox` that throws on every execution attempt. This is intentional — no code runs accidentally without an explicit sandbox configured.
