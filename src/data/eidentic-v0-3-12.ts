type EidenticArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category_id: string;
  is_published: boolean;
  display_order: number;
  sidebar_title: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  content: string;
};

const UPDATED_AT = '2026-06-27T00:00:00.000Z';

const releaseNoteArticle = {
  id: 'reference-production-sdk-ergonomics',
  title: 'Production SDK Ergonomics',
  slug: 'reference-production-sdk-ergonomics',
  excerpt:
    'What changed in v0.3.12: principal-aware queries, guardrail metadata, presets, structured-output diagnostics, and batch erasure.',
  category_id: 'reference',
  is_published: true,
  display_order: 4,
  sidebar_title: null,
  icon: null,
  created_at: UPDATED_AT,
  updated_at: UPDATED_AT,
  content: `<p>Eidentic v0.3.12 is an additive production-ergonomics release. It publishes <code>eidentic@0.3.0</code>, <code>@eidentic/core@0.4.0</code>, and <code>@eidentic/types@0.5.0</code>.</p>
<p>Existing calls that use <code>sessionId</code>, <code>userId</code>, and <code>orgId</code> continue to work. The new APIs make multi-tenant ownership, memory scope, permission defaults, and guardrail handling more explicit for production services.</p>
<h2>Install</h2>
<pre><code class="language-bash">npm install eidentic@latest
# or install package-by-package:
npm install @eidentic/core@latest @eidentic/types@latest</code></pre>
<h2>Principal vs memory scope</h2>
<p><code>Agent.query()</code> and <code>Agent.resume()</code> now accept a <code>principal</code> separately from <code>memoryScope</code>. Use <code>principal</code> for authenticated ownership, quotas, and session checks; use <code>memoryScope</code> when the run should read or write a different memory namespace.</p>
<pre><code class="language-ts">import { Agent } from "@eidentic/core";
import { scopes } from "@eidentic/types";

for await (const ev of agent.query("Draft a team reply.", {
  sessionId: "ticket-123",
  principal: { userId: "agent-42", orgId: "acme" },
  memoryScope: scopes.org("support", "acme"),
})) {
  // ...
}</code></pre>
<p>Prefer <code>principal</code> over passing identity only through custom metadata. The session owner is recorded and resume checks prevent a caller from resuming another principal's session by guessing a <code>sessionId</code>.</p>
<h2>Guardrail input and metadata</h2>
<p><code>guardrailInput</code> lets you check the untrusted user text while sending a composed prompt to the model. This is useful when your backend wraps the user's message with routing, policy, or operator context.</p>
<pre><code class="language-ts">const prompt =
  "User message:\\n" + userText + "\\n\\nAnswer using the support playbook.";

await drain(agent.query(
  prompt,
  {
    sessionId: "ticket-123",
    guardrailInput: {
      text: userText,
      channel: "support-chat",
      metadata: { ticketId: "ticket-123" },
    },
  },
));</code></pre>
<p>Guardrail <code>block</code> and <code>redact</code> results can now include machine-readable <code>code</code> and <code>severity</code>. Terminal guardrail results surface that data in <code>result.details</code>.</p>
<h2>Built-in presets</h2>
<p>The release adds small preset helpers for common production defaults:</p>
<pre><code class="language-ts">import {
  Agent,
  eidenticGuardrails,
  permissions,
  policies,
} from "eidentic";

const agent = new Agent({
  id: "support",
  model,
  store,
  tools,
  policy: policies.customerReply({ maxCostUsd: 0.05 }),
  permissions: permissions.askByDefault({ allow: ["search_*"], deny: ["delete_*"] }),
  guardrails: eidenticGuardrails.pii({
    input: "block",
    output: "redact",
    entities: ["email", "phone", "credit_card"],
  }),
});</code></pre>
<p>Available cost presets are <code>policies.shortDraft()</code>, <code>policies.customerReply()</code>, and <code>policies.longResearch()</code>. Permission presets are <code>permissions.denyByDefault()</code>, <code>permissions.askByDefault()</code>, and <code>permissions.plan()</code>.</p>
<h2>Structured-output diagnostics</h2>
<p>When an <code>outputSchema</code> parse or validation fails, the terminal result now includes <code>details.errorKind</code>, <code>details.validationIssues</code>, and <code>details.rawOutput</code> where available. Use these fields for observability and retry routing instead of parsing human-readable error text.</p>
<pre><code class="language-ts">if (ev.type === "result" && ev.subtype === "error") {
  console.log(ev.details?.errorKind);
  console.log(ev.details?.validationIssues);
}</code></pre>
<h2>Batch erasure</h2>
<p><code>Agent.eraseScopes()</code> erases multiple scopes in order and returns one <code>EraseScopeResult</code> per scope. It stops on the first failure so callers can retry idempotently.</p>
<pre><code class="language-ts">import { scopes } from "@eidentic/types";

await agent.eraseScopes([
  scopes.user("support", "user-42"),
  scopes.thread("support", "ticket-123"),
]);</code></pre>
<h2>Migration notes</h2>
<ul>
<li>No migration is required for existing <code>userId</code>, <code>orgId</code>, <code>outputSchema</code>, or <code>regexPiiGuardrail()</code> usage.</li>
<li>For new multi-tenant services, prefer <code>principal</code> and <code>scopes.*</code> helpers so ownership and memory scope are explicit.</li>
<li><code>regexPiiGuardrail()</code> remains available. <code>eidenticGuardrails.pii()</code> is the preset namespace to use in new code.</li>
<li>The AI SDK 7 migration from v0.3.11 still applies: use ESM imports and Node.js 22 or newer.</li>
</ul>`,
} satisfies EidenticArticle;

function insertBefore(content: string, marker: string, addition: string): string {
  if (content.includes(addition)) return content;
  if (!content.includes(marker)) return `${content}\n${addition}`;
  return content.replace(marker, `${addition}\n${marker}`);
}

function updateAgentLoop(article: EidenticArticle): EidenticArticle {
  const addition = `<h2>Production query options</h2>
<p>In v0.3.12, <code>QueryOptions</code> adds <code>principal</code>, <code>memoryScope</code>, and <code>guardrailInput</code>.</p>
<table><thead><tr><th>Field</th><th>Use it for</th></tr></thead><tbody><tr><td><code>principal</code></td><td>Authenticated ownership for session access, quotas, rate limits, and permission selection.</td></tr><tr><td><code>memoryScope</code></td><td>The memory namespace to read/write for this run. Defaults from <code>principal</code>, <code>userId</code>, <code>orgId</code>, or <code>sessionId</code>.</td></tr><tr><td><code>guardrailInput</code></td><td>The raw untrusted text to inspect when the model prompt is composed by your backend.</td></tr></tbody></table>
<pre><code class="language-ts">import { scopes } from "@eidentic/types";

for await (const ev of agent.query(composedPrompt, {
  sessionId: "ticket-123",
  principal: { userId: "agent-42", orgId: "acme" },
  memoryScope: scopes.org("support", "acme"),
  guardrailInput: { text: rawUserText, channel: "support-chat" },
})) {
  // consume StreamEvent values
}</code></pre>`;

  return {
    ...article,
    updated_at: UPDATED_AT,
    content: insertBefore(article.content, '<h2>Stream events</h2>', addition),
  };
}

function updatePermissions(article: EidenticArticle): EidenticArticle {
  let content = article.content;

  const presets = `<h2>Preset helpers</h2>
<p>v0.3.12 adds helper presets so production services do not have to hand-roll common permission and guardrail defaults.</p>
<pre><code class="language-ts">import { eidenticGuardrails, permissions } from "eidentic";

const agent = new Agent({
  id: "support",
  model,
  store,
  tools,
  permissions: permissions.askByDefault({
    allow: ["search_*", "read_*"],
    deny: ["delete_*"],
  }),
  guardrails: eidenticGuardrails.pii({
    input: "block",
    output: "redact",
  }),
});</code></pre>
<p><code>permissions.denyByDefault()</code> hides and denies everything unless explicitly allowed or asked. <code>permissions.askByDefault()</code> keeps tools visible but requires dynamic approval by default. <code>permissions.plan()</code> starts from read-only planning mode.</p>`;
  content = insertBefore(content, '<h2>Deny globs</h2>', presets);

  const metadata = `<h2>Guardrail metadata</h2>
<p>Guardrail <code>block</code> and <code>redact</code> decisions can include <code>code</code> and <code>severity</code>. Built-in PII presets use <code>code: "pii_sensitive"</code> and <code>severity: "medium"</code>. When a run terminates with <code>result.subtype === "guardrail"</code>, this metadata is available on <code>result.details</code>.</p>`;
  content = insertBefore(content, '<h3>Built-in PII guardrail</h3>', metadata);

  content = content.replace(
    '<p><code>regexPiiGuardrail()</code> from <code>@eidentic/core</code> covers emails, phone numbers, credit-card numbers, and SSNs with a pure-JS regex implementation:</p>',
    '<p><code>eidenticGuardrails.pii()</code> is the recommended preset for new code. <code>regexPiiGuardrail()</code> remains available for existing integrations and lower-level customization. Both cover emails, phone numbers, credit-card numbers, and SSNs with a pure-JS regex implementation:</p>',
  );

  return { ...article, updated_at: UPDATED_AT, content };
}

function updateStructuredOutput(article: EidenticArticle): EidenticArticle {
  const addition = `<h2>Diagnostics on validation failure</h2>
<p>v0.3.12 adds structured failure metadata for <code>outputSchema</code> runs. When parsing or Zod validation fails, the terminal <code>result</code> includes <code>details.errorKind</code>, <code>details.validationIssues</code>, and <code>details.rawOutput</code> when available.</p>
<pre><code class="language-ts">for await (const ev of agent.query(input, { sessionId, outputSchema: schema })) {
  if (ev.type === "result" && ev.subtype === "error") {
    logger.warn("structured output failed", {
      kind: ev.details?.errorKind,
      issues: ev.details?.validationIssues,
      raw: ev.details?.rawOutput,
    });
  }
}</code></pre>
<p>These fields are intended for logging, retry policies, and test assertions. Avoid scraping <code>ev.output</code>, which is still a human-readable summary.</p>`;

  return {
    ...article,
    updated_at: UPDATED_AT,
    content: insertBefore(article.content, '<h2>Schema tips</h2>', addition),
  };
}

function updateModelRouting(article: EidenticArticle): EidenticArticle {
  const addition = `<h2>Cost policy presets</h2>
<p><code>@eidentic/core</code> now exports <code>policies</code> for common production envelopes. Each preset accepts overrides, so you can start from a named recipe and tune the hard limits.</p>
<pre><code class="language-ts">import { policies } from "eidentic";

const supportAgent = new Agent({
  id: "support",
  model,
  store,
  policy: policies.customerReply({ maxCostUsd: 0.05 }),
});

const classifier = new Agent({
  id: "classifier",
  model,
  store,
  policy: policies.shortDraft(),
});</code></pre>
<p>Use <code>policies.shortDraft()</code> for small classification or label-style tasks, <code>policies.customerReply()</code> for normal customer-facing replies, and <code>policies.longResearch()</code> only for explicit research workflows.</p>`;

  return {
    ...article,
    updated_at: UPDATED_AT,
    content: insertBefore(article.content, '<h2>withFallback', addition),
  };
}

function updateMemoryGovernance(article: EidenticArticle): EidenticArticle {
  const addition = `<h2>Batch erasure scopes</h2>
<p><code>Agent.eraseScopes()</code> erases multiple scopes in order and returns one result per scope. It stops on the first failure, making retry behavior deterministic for GDPR or internal retention workflows.</p>
<pre><code class="language-ts">import { scopes } from "@eidentic/types";

await agent.eraseScopes([
  scopes.user("support", "user-42"),
  scopes.thread("support", "ticket-123"),
  scopes.org("support", "acme"),
]);</code></pre>
<p>The <code>scopes</code> helpers also make erasure and memory routing less error-prone than hand-writing scope objects.</p>`;

  return {
    ...article,
    updated_at: UPDATED_AT,
    content: insertBefore(article.content, '<h2>State-transition timelines</h2>', addition),
  };
}

function updateReference(article: EidenticArticle): EidenticArticle {
  const addition = `<h2>v0.3.12 production helpers</h2>
<table><thead><tr><th>Symbol</th><th>Package</th><th>Description</th></tr></thead><tbody><tr><td><code>QueryOptions.principal</code></td><td><code>@eidentic/core</code></td><td>Authenticated caller identity for ownership, quotas, and permissions.</td></tr><tr><td><code>QueryOptions.memoryScope</code></td><td><code>@eidentic/core</code></td><td>Explicit memory namespace for a run.</td></tr><tr><td><code>QueryOptions.guardrailInput</code></td><td><code>@eidentic/core</code></td><td>Raw text/channel/metadata to inspect before the model sees a composed prompt.</td></tr><tr><td><code>permissions.*</code></td><td><code>@eidentic/core</code></td><td><code>denyByDefault</code>, <code>askByDefault</code>, and <code>plan</code> permission presets.</td></tr><tr><td><code>policies.*</code></td><td><code>@eidentic/core</code></td><td><code>shortDraft</code>, <code>customerReply</code>, and <code>longResearch</code> cost presets.</td></tr><tr><td><code>eidenticGuardrails.pii()</code></td><td><code>@eidentic/core</code></td><td>Named PII guardrail preset with input/output actions and entity selection.</td></tr><tr><td><code>scopes.*</code></td><td><code>@eidentic/types</code></td><td>Stable constructors for agent, user, thread, org, and shared scopes.</td></tr><tr><td><code>Agent.eraseScopes()</code></td><td><code>@eidentic/core</code></td><td>Ordered batch erasure helper.</td></tr></tbody></table>`;

  return {
    ...article,
    updated_at: UPDATED_AT,
    content: insertBefore(article.content, '<h2>Key types</h2>', addition),
  };
}

export function applyV0312DocUpdates(input: readonly EidenticArticle[]): EidenticArticle[] {
  const articles = input.map((article) => {
    if (article.id === 'concepts-agent-loop') return updateAgentLoop(article);
    if (article.id === 'concepts-permissions') return updatePermissions(article);
    if (article.id === 'guides-structured-output') return updateStructuredOutput(article);
    if (article.id === 'guides-model-routing') return updateModelRouting(article);
    if (article.id === 'guides-memory-governance') return updateMemoryGovernance(article);
    if (article.id === 'reference') return updateReference(article);
    return article;
  });

  const withoutExisting = articles.filter((article) => article.id !== releaseNoteArticle.id);
  return [...withoutExisting, releaseNoteArticle];
}
