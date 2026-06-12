---
title: MCP
description: Use @eidentic/mcp to consume external MCP servers as agent tools or expose your tools as an MCP server.
---

`@eidentic/mcp` has two roles: **host** (consume a remote MCP server's tools as first-class Eidentic tools) and **server** (expose Eidentic tools over MCP so any MCP-compatible client can call them). The `@modelcontextprotocol/sdk` is an optional peer dependency — only required when using transport helpers.

## Install

```bash
npm install @eidentic/mcp
# For transport helpers (streamableHttpClient, stdioClient, createMcpServer):
npm install @modelcontextprotocol/sdk
```

## Host side: consuming an MCP server

### `mcpTools(client, opts?)`

Takes an already-connected `McpClientLike`, lists its tools, and wraps each as a first-class Eidentic `Tool`. The tools can then be passed directly to an `Agent`.

```ts
import { mcpTools, stdioClient } from "@eidentic/mcp";
import { Agent, AIModel, SqliteStore } from "eidentic";
import { anthropic } from "@ai-sdk/anthropic";

// Connect to a local MCP server over stdio
const client = await stdioClient({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-everything"],
});

const tools = await mcpTools(client, {
  prefix: "mcp",           // tool ids become "mcp__<name>"
  defaultSideEffect: "destructive", // safe default for unannotated tools
});

const agent = new Agent({
  id: "assistant",
  model: new AIModel(anthropic("claude-sonnet-4-5")),
  store: new SqliteStore("./eidentic.sqlite"),
  tools,
});
```

`mcpTools` respects the MCP server's `readOnlyHint` annotation: tools with `readOnlyHint: true` receive `sideEffect: "read-only"` (parallelizable); unannotated tools default to `"destructive"`.

### `McpToolsOptions`

| Option | Description |
|---|---|
| `prefix?` | Namespace prefix; tool ids become `${prefix}__${name}` |
| `defaultSideEffect?` | Side-effect for unannotated tools (default `"destructive"`) |
| `forceSideEffect?` | Override all tools' side-effects regardless of server annotations |
| `tracer?` | `TracerPort` for per-call OTel spans (`mcp.call_tool`) |

### Transport helpers

```ts
import { streamableHttpClient, stdioClient } from "@eidentic/mcp";

// Remote server over Streamable HTTP
const client = await streamableHttpClient("https://mcp.example.com/mcp", {
  headers: { Authorization: "Bearer <token>" },
});

// Local server over stdio
const client = await stdioClient({ command: "npx", args: ["my-mcp-server"] });
```

### OAuth 2.1 for authenticated MCP servers

```ts
import {
  OAuthConnection,
  beginAuthorizationFlow,
  completeAuthorizationFlow,
  streamableHttpClient,
  mcpTools,
} from "@eidentic/mcp";

const config = {
  authorizationEndpoint: "https://auth.example.com/oauth/authorize",
  tokenEndpoint: "https://auth.example.com/oauth/token",
  clientId: "my-client-id",
  redirectUri: "http://localhost:3000/callback",
  scope: "mcp:read mcp:write",
};

const conn = new OAuthConnection(config);
const { authorizationUrl, state, codeVerifier } = await beginAuthorizationFlow(config);
// Redirect user to authorizationUrl → receive ?code=…&state=…
const tokens = await completeAuthorizationFlow(config, code, codeVerifier, returnedState, state);
await conn.setTokens(tokens);

// Bearer token injected automatically; refreshed as needed
const client = await streamableHttpClient("https://mcp.example.com/mcp", { oauth: conn });
const tools = await mcpTools(client);
```

## Server side: exposing tools as MCP

### `createMcpServer(tools, opts?)`

Dynamically imports the MCP SDK `Server`, registers tools, and returns a handle with `serveStdio()` and `serveHttp()` transport helpers.

```ts
import { createMcpServer } from "@eidentic/mcp";
import { fileTools } from "@eidentic/tools";

const handle = await createMcpServer(
  fileTools({ root: process.cwd() }),
  { name: "my-tools", version: "1.0.0" },
);

// Wire into stdio (for Claude Desktop or npx-style servers):
await handle.serveStdio(); // blocks

// Or over Streamable HTTP:
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const { handleRequest } = handle.serveHttp({ sessionIdGenerator: () => randomUUID() });
createServer((req, res) => handleRequest(req, res)).listen(3000);
```

### `mcpServer(opts)` — opts-style API (recommended for new code)

Accepts `tools` plus an optional `agent` to expose alongside them:

```ts
import { mcpServer } from "@eidentic/mcp";

const handle = await mcpServer({
  tools: myTools,
  agent: myAgent,
  agentId: "support",
  agentDescription: "Customer support agent.",
  allowDestructive: true, // required to expose the agent tool
  name: "support-server",
  version: "1.0.0",
});
await handle.serveStdio();
```

### Security defaults

- **Destructive tools are skipped** unless you pass `allowDestructive: true` or an `authorize` hook.
- **No authentication** is built in. Put HTTP transport behind your own auth middleware.
- **No per-call authorization** by default. Use the `authorize` hook to gate individual calls.
- **Empty execution context** by default — override `ctxFactory` to inject a `PermissionPolicy` or `SecretsPort`.

### `McpServerOptions`

| Option | Description |
|---|---|
| `name?` / `version?` | Server identity advertised to clients |
| `authenticateConnection?` | Transport-level auth guard; return `false` to reject before any handler runs |
| `authorize?` | Per-call authorization: `(toolName, input) => boolean` |
| `allowDestructive?` | Register tools with `sideEffect: "destructive"` |
| `ctxFactory?` | Factory for the `ToolContext` injected into every `tool.execute` call |
| `onAudit?` | Hook fired for every request (ok / denied / error) for structured audit logging |
| `tracer?` | `TracerPort` for per-request OTel spans (`mcp.handle_request`) |

## Runnable examples

- Host side: [`examples/hello-mcp.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-mcp.ts)
- Server side: [`examples/hello-mcp-server.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-mcp-server.ts)
