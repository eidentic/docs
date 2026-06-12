---
title: Skills
description: Load reusable playbooks into your agent at query time, with optional test-gating, ed25519 signing, and self-evolution.
---

The skill substrate gives agents a searchable library of reusable playbooks. Skills are `SKILL.md` files (agentskills.io format) that the agent searches at query time and loads into context on demand.

## Install

```bash
pnpm add @eidentic/skills
```

## Prompt skills with `SkillSet`

`SkillSet` is the lightweight path: it parses `SKILL.md` manifests and exposes them as a `SkillPort` you wire directly into the agent.

```ts
import { Agent } from "@eidentic/core";
import { SkillSet } from "@eidentic/skills";
import { SqliteStore } from "@eidentic/sqlite";
import { AIModel } from "@eidentic/model";
import { anthropic } from "@ai-sdk/anthropic";

const store = await SqliteStore.create("./eidentic.sqlite");
const model = new AIModel(anthropic("claude-sonnet-4-5"));

const skills = new SkillSet("./skills");  // directory of SKILL.md files

const agent = new Agent({
  id: "my-agent",
  instructions: "Help the user.",
  model,
  store,
  skills,
});
```

You can also build a `SkillSet` from inline manifests — no filesystem required:

```ts
const skills = SkillSet.fromManifests([
  {
    content: `---
name: git-commit
description: Write a Conventional Commit subject and body.
allowed-tools: [bash, read]
---
# Git Commit
Write the subject in imperative mood, <= 72 chars...
`,
    source: "inline:git-commit",
    author: "baran",
  },
]);
```

The agent gets two built-in tools from the skill substrate: `skill_search` (description-scored keyword search over the catalog) and `skill_use` (load a skill's full body + provenance + per-skill memory into context).

### `SkillPort` API

| Method | Description |
|---|---|
| `catalog()` | Returns always-in-context `SkillCatalogEntry[]` (name + description) |
| `search(query, topK?)` | Description-scored keyword search |
| `use(name)` | Loads the full `LoadedSkill` (body, provenance, per-skill memory, references) |
| `recordOutcome(name, note)` | Appends a note to the skill's `.memory.md` file; surfaces on next `use` |
| `read?(name, path)` | Reads a Tier-3 reference file from the skill's directory |

## Executable skills with `SkillBank`

`SkillBank` adds test-gating, ed25519 signing, and a quarantine layer for agent-authored skills.

```ts
import { SkillBank, type ExecutableSkillDef } from "@eidentic/skills";

const bank = new SkillBank();

const doubler: ExecutableSkillDef = {
  name: "doubler",
  description: "doubles a number",
  tests: [
    { name: "doubles 2", input: 2, check: (o) => o === 4 },
    { name: "doubles 5", input: 5, check: (o) => o === 10 },
  ],
  run: async (input) => (input as number) * 2,
};

const result = await bank.register(doubler);
// result.ok === true  → tests passed, skill registered
// result.ok === false → result.failures lists which tests failed
```

A skill with failing tests is rejected and never registered.

### `allowed-tools` enforcement

Skills declare the tools they may call. Calls to unlisted tools are denied:

```ts
const reader: ExecutableSkillDef = {
  name: "reader",
  description: "reads files",
  allowedTools: ["read_*"],
  tests: [{ name: "reads", input: "notes.md", check: (o) => o === "read:notes.md" }],
  run: async (input, ctx) => {
    return await ctx.callTool!("read_file", input);  // allowed
    // ctx.callTool!("delete_all", {})               // would throw — not in allowedTools
  },
};
```

### ed25519 signing

```ts
import { generateSkillKeypair, signLock, verifyLock } from "@eidentic/skills";

const { publicKey, privateKey } = generateSkillKeypair();
const lock = bank.get("doubler")!;
const signature = signLock(lock, privateKey);

verifyLock({ ...lock, signature }, publicKey); // true
verifyLock({ ...lock, signature, contentHash: "TAMPERED" }, publicKey); // false
```

Require signatures at the bank level:

```ts
const signedBank = new SkillBank({ requireSigned: true, verifyKey: publicKey });
await signedBank.register(doubler);
signedBank.setSignature("doubler", signLock(lock, privateKey));
await signedBank.use("doubler", 2); // 4
```

### Agent-authored skills and quarantine

Agent-authored skills that supply an in-process `run` function are rejected (security rule). They must use the `code` field (a string executed in a `SandboxPort`), and they are quarantined until a human calls `approve`:

```ts
const agentSkill: ExecutableSkillDef = {
  name: "agent-greeter",
  description: "greets a user",
  code: `
const input = "world";
console.log("EIDENTIC_RESULT:" + JSON.stringify("hi " + input));
`.trim(),
  tests: [{ name: "greets", input: "world", check: (o) => o === "hi world" }],
};

const reg = await bank.register(agentSkill, { author: "agent" });
// reg.lock.quarantined === true — blocked until approve()

bank.approve("agent-greeter");
await bank.use("agent-greeter", "world"); // "hi world"
```

The result marker format is `EIDENTIC_RESULT:<json>` — the bank extracts the value after the last occurrence.

## Skill self-evolution

`evolveSkill` runs an LLM-driven reflection loop to improve a failing skill's description (the playbook). It is **off by default** and never runs automatically in the agent loop.

```ts
import { evolveSkill, type EvolveOptions } from "@eidentic/skills";
import { AIModel } from "@eidentic/model";
import { anthropic } from "@ai-sdk/anthropic";

const result = await evolveSkill(mySkill, {
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  maxRounds: 3,
  maxUsd: 1.0,  // cost ceiling
});

if (result.evolved) {
  console.log("Evolved description:", result.evolved.description);
  // Register manually — evolveSkill never auto-registers
  await bank.register(result.evolved);
}
```

`EvolveResult` fields: `baselinePassed`, `rounds`, `usage`, `history`, `evolved` (the passing `ExecutableSkillDef`, or `undefined` if all rounds failed).

## Runnable examples

- [`examples/hello-skill.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-skill.ts) — `SkillSet.fromManifests`, catalog, search, `use`, `recordOutcome`, and a wired agent run.
- [`examples/hello-executable-skill.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-executable-skill.ts) — test-gating, `allowed-tools`, signing, agent-authored quarantine.
- [`examples/hello-skill-evolution.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-skill-evolution.ts) — `evolveSkill` loop with a scripted model; infra-free.
