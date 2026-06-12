---
title: Authentication (better-auth)
description: Verify better-auth sessions with @eidentic/better-auth and wire them into createServer via an AuthPort.
---

`@eidentic/better-auth` adapts a [better-auth](https://www.better-auth.com/) instance into an Eidentic `AuthPort` — the interface `createServer` uses to authenticate requests. You configure better-auth yourself (database, providers, schema); the adapter only calls `auth.api.getSession()`.

## Install

```bash
npm install @eidentic/better-auth better-auth
```

## `betterAuthPort(auth, opts?)`

```ts
import { betterAuthPort } from "@eidentic/better-auth";
import { createServer } from "@eidentic/server";
import { auth } from "./lib/auth"; // your better-auth instance

const app = createServer({
  agents: { support: myAgent },
  auth: betterAuthPort(auth),
});
```

`betterAuthPort` accepts either `auth` (a better-auth instance whose `api.getSession` it calls) or a bare object with a `getSession` method (`BetterAuthLike`). It returns an `AuthPort`.

**Fail-closed:** if `getSession` throws for any reason, `authenticate` returns `null` (→ 401). Errors never propagate to the server layer.

### Deriving extra principal fields

Use `principalFrom` to map session data into additional `AuthPrincipal` fields. The result is shallow-merged on top of the base principal:

```ts
const authPort = betterAuthPort(auth, {
  principalFrom: ({ session, user }) => ({
    orgId: session?.activeOrganizationId ?? undefined,
  }),
});
```

By default `betterAuthPort` already maps `user.id` → `userId` and `session.activeOrganizationId` → `orgId`. Use `principalFrom` when you need to derive values from custom session fields or plugin claims.

## AuthPort and AuthPrincipal

`AuthPort` is the interface that `createServer` calls for every request:

```ts
interface AuthPort {
  authenticate(req: AuthRequest): Promise<AuthPrincipal | null> | AuthPrincipal | null;
}
```

A successful authentication returns an `AuthPrincipal`:

```ts
interface AuthPrincipal {
  userId?: string;
  orgId?: string;
  apiKey?: string;
}
```

`AuthRequest` carries the HTTP method, path, and a lowercased headers record — framework-agnostic, no dependency on Hono or Node's `IncomingMessage`.

## Multi-tenant principal scoping

The `userId` and `orgId` fields on `AuthPrincipal` map directly to Eidentic's `Scope` system. When the server creates or accesses sessions, it records the principal's `userId`/`orgId` and enforces ownership on every subsequent request to that session.

```
AuthPrincipal { userId: "u-42", orgId: "org-acme" }
         ↓
Scope { kind: "user", agentId: "support", userId: "u-42" }
         ↓
Memory reads / writes scoped to this user only
```

This means memory recall, session events, and knowledge-graph facts are isolated by tenant automatically — no extra filtering is needed in your agent code.

## Wiring into `createServer`

```ts
import { createServer } from "@eidentic/server";
import { betterAuthPort } from "@eidentic/better-auth";
import { auth } from "./lib/auth";

const app = createServer({
  agents: { support: myAgent },
  auth: betterAuthPort(auth, {
    principalFrom: ({ session }) => ({
      orgId: session?.activeOrganizationId ?? undefined,
    }),
  }),
  cors: { origin: "https://app.example.com", credentials: true },
});
```

The `auth` option accepts any `AuthPort`, not just `betterAuthPort`. See the [Server guide](/guides/server-hardening) for the built-in `NoAuth` and `ApiKeyAuth` adapters and for route/middleware details.

## Runnable example

[`examples/hello-better-auth.ts`](https://github.com/eidentic/eidentic/blob/main/examples/hello-better-auth.ts) — uses a fake `BetterAuthLike` verifier (no real DB required); shows a 200 for a valid session and a 401 for an unauthenticated request.
