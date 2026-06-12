---
title: Permissions & guardrails
description: Control which tools an agent can call and what content it can process with deny-by-default policies and content guardrails.
---

Eidentic's security model has two independent layers: a **permission policy** that controls which tools the model can see and call, and **guardrails** that inspect and optionally block or redact the text content flowing through the agent.

## Permission policy

Pass a `PermissionPolicy` in `AgentConfig.permissions`:

```ts
import { Agent } from "@eidentic/core";

const agent = new Agent({
  id: "assistant",
  model,
  store,
  tools: [readFile, deleteFile, sendEmail],
  permissions: {
    mode: "default",
    deny: ["delete_*"],
    allow: ["read_*"],
  },
});
```

`PermissionPolicy` shape:

```ts
interface PermissionPolicy {
  mode?: PermissionMode;  // "default" (default), "plan", "ask", "bypass", "acceptEdits"
  allow?: string[];       // tool-id globs that are always permitted
  deny?: string[];        // tool-id globs that are always denied
}
```

### Modes

| Mode | Behaviour |
|---|---|
| `"default"` | Allow unless a `deny` glob matches. |
| `"plan"` | Only `"read-only"` tools are visible and callable. All side-effecting tools are removed from the schema sent to the model. |
| `"ask"` | Every tool not pre-approved by an `allow` glob requires dynamic approval via `onPermissionRequest`. Tools without a resolver are denied. |
| `"bypass"` | Skip plan-mode and ask-mode checks. `deny` globs and `onPreToolUse` still apply. |
| `"acceptEdits"` | Currently behaves like `"default"`. Reserved for future fine-grained edit-class gating. |

### Deny globs

Bare-name deny entries remove the tool from the schema **and** block dispatch:

```ts
permissions: { deny: ["delete_*", "write_*"] }
```

The model never sees `delete_file` or `write_file` in its tool list — it cannot call what it cannot see.

Argument-scoped deny entries (with parentheses) block a tool only when the serialized input matches a glob pattern. The tool stays in the schema:

```ts
permissions: { deny: ["bash(*rm -rf*)"] }
// bash is visible to the model but any call whose input contains "rm -rf" is denied at dispatch
```

### Evaluation order

1. `onPreToolUse` hook — explicit `"allow"` or `"deny"` wins immediately.
2. Bare-name `deny` globs — tool removed from schema and denied at dispatch.
3. `"plan"` mode — non-`"read-only"` tools denied.
4. `allow` globs — pre-approve matching tools.
5. `"ask"` mode — unmatched tools go to `onPermissionRequest`.
6. Default fall-through — allow.

### Changing the mode at runtime

```ts
agent.setPermissionMode("plan"); // takes effect on the next query() or resume() call
```

## Hooks

### `onPreToolUse`

Called before every tool dispatch. Return `"deny"` to block or `"allow"` to force-permit regardless of policy. Return `void`/`undefined` to let the policy decide:

```ts
const agent = new Agent({
  ...,
  onPreToolUse: async (toolId, input) => {
    if (toolId === "bash" && (input as { command: string }).command.includes("rm -rf")) {
      return "deny";
    }
    // undefined → policy continues
  },
});
```

### `onPermissionRequest`

Required when using `mode: "ask"`. Called for every tool that is not pre-approved. Must return `"allow"` or `"deny"`:

```ts
const agent = new Agent({
  ...,
  permissions: { mode: "ask" },
  onPermissionRequest: async (toolId, input) => {
    const approved = await humanApprovalQueue.ask({ toolId, input });
    return approved ? "allow" : "deny";
  },
});
```

If a `mode: "ask"` tool is dispatched and no `onPermissionRequest` is configured, the dispatch is denied automatically.

## Secrets isolation

Credentials never enter the model's context. Store them in a `SecretsPort` vault and tools fetch them at call time via `ctx.secrets`:

```ts
import { MapSecrets } from "@eidentic/types/testing"; // or your production vault

const agent = new Agent({
  ...,
  secrets: new MapSecrets({ API_KEY: "sk-real-key" }),
});

const callApi = createTool({
  id: "call_api",
  inputSchema: z.object({ endpoint: z.string() }),
  execute: async ({ input, ctx }) => {
    const key = await ctx?.secrets?.get("API_KEY"); // injected at dispatch, never in the prompt
    // use key ...
  },
});
```

See [hello-security.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-security.ts) for a complete example showing both schema-layer filtering and secrets isolation.

## Guardrails

Guardrails inspect the text content of a run — the user's input and the model's final output — independently of the tool permission system.

Configure one or more `GuardrailPort` instances in `AgentConfig.guardrails`:

```ts
import type { GuardrailPort } from "@eidentic/types";

const blockGuardrail: GuardrailPort = {
  checkInput(text) {
    if (text.toLowerCase().includes("confidential")) {
      return { action: "block", reason: "confidential keyword detected" };
    }
    return { action: "allow" };
  },
};

const agent = new Agent({
  ...,
  guardrails: blockGuardrail,       // single guardrail
  // guardrails: [guardrailA, guardrailB],  // or an array — runs in order
});
```

`GuardrailPort` interface:

```ts
interface GuardrailPort {
  checkInput?(text: string, ctx?: GuardrailContext): Promise<GuardrailResult> | GuardrailResult;
  checkOutput?(text: string, ctx?: GuardrailContext): Promise<GuardrailResult> | GuardrailResult;
}
```

`GuardrailResult` union:

| Action | Effect |
|---|---|
| `{ action: "allow" }` | Pass the text through unchanged. |
| `{ action: "block"; reason: string }` | Terminate the run. On input: model is never called; `result.subtype` is `"guardrail"`. On output: final text is replaced with a safe message. |
| `{ action: "redact"; text: string; reason?: string }` | Replace the text with `result.text` and continue. On input: model receives the redacted text. On output: `result.output` carries the redacted text. |

When multiple guardrails are provided, they run in array order. The first `"block"` wins. A `"redact"` result passes the redacted text to the next guardrail in the chain.

### Built-in PII guardrail

`regexPiiGuardrail()` from `@eidentic/core` covers emails, phone numbers, credit-card numbers, and SSNs with a pure-JS regex implementation:

```ts
import { regexPiiGuardrail } from "@eidentic/core";

const agent = new Agent({
  ...,
  guardrails: regexPiiGuardrail({ mode: "redact" }), // "redact" or "block"; default checks both input and output
});
```

Options: `{ mode: "redact" | "block"; check?: ("input" | "output")[] }`.

### Topic guardrail (LLM-based scope enforcement)

`topicGuardrail()` uses a separate classifier model to enforce that requests are on-topic. The classifier is an independent model call — it is harder to subvert than a system-prompt instruction alone:

```ts
import { topicGuardrail } from "@eidentic/core";

const agent = new Agent({
  ...,
  guardrails: topicGuardrail({
    model: cheapClassifierModel,
    description: "billing and account support for Acme",
    blockMessage: "I can only help with Acme billing and account questions.",
  }),
});
```

See [hello-guardrails.ts](https://github.com/eidentic/eidentic/blob/main/examples/hello-guardrails.ts) for all six guardrail scenarios, including input block, input redact, output redact, combined PII, topic enforcement, and greeting.
