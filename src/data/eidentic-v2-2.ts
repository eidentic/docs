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

const UPDATED_AT = '2026-07-12T01:00:00.000Z';

const secretCapabilitiesArticle: EidenticArticle = {
  id: 'guides-secret-capabilities',
  title: 'Tool secrets and least privilege',
  slug: 'guides-secret-capabilities',
  excerpt: 'Give each tool only the credentials it declares, without exposing values to the model or event log.',
  category_id: 'tools-integrations',
  is_published: true,
  display_order: 9,
  sidebar_title: 'Tool secrets',
  icon: null,
  created_at: UPDATED_AT,
  updated_at: UPDATED_AT,
  content: `<p>Eidentic keeps tool credentials out of prompts and gives each tool a small capability containing only the secret names it declares. Values are resolved lazily when the tool runs.</p>
<h2>Directory projects</h2>
<p>Add the environment variable to your local <code>.env</code>, then declare the name on the tool. Directory mode automatically creates an environment-backed capability from all discovered tool declarations.</p>
<pre><code class="language-bash">BILLING_API_KEY=replace-me</code></pre>
<pre><code class="language-ts">// agent/tools/billing-lookup.ts
import { createTool } from "eidentic";
import { z } from "zod";

export default createTool({
  id: "billing_lookup",
  description: "Look up a billing record",
  inputSchema: z.object({ id: z.string() }),
  sideEffect: "read-only",
  requiredSecrets: ["BILLING_API_KEY"],
  execute: async ({ input, ctx }) =&gt; {
    const apiKey = await ctx!.secrets!.require("BILLING_API_KEY");
    const response = await billingClient.lookup(input.id, { apiKey });
    return { status: response.status };
  },
});</code></pre>
<p>Use <code>require()</code> when the tool cannot run without the credential. It returns a string or fails with a clear missing-secret error. <code>get()</code> remains available for genuinely optional credentials.</p>
<h2>Check configuration</h2>
<pre><code class="language-bash">npx eidentic doctor</code></pre>
<p>For the automatic directory environment provider, Doctor lists declared names as <code>set</code> or <code>missing</code>. It never prints values. Custom vault adapters own their diagnostics and are not probed by the CLI.</p>
<h2>Programmatic configuration</h2>
<p>Legacy <code>eidentic.config.*</code> and direct <code>Agent</code> construction stay explicit:</p>
<pre><code class="language-ts">import { Agent, EnvSecrets } from "eidentic";

const agent = new Agent({
  id: "assistant",
  model,
  store,
  tools: [billingLookup],
  secrets: new EnvSecrets(["BILLING_API_KEY"]),
});</code></pre>
<p>For production, implement <code>SecretsPort</code> with your existing vault. The optional context contains immutable agent, session, tool, and tenant scope information, so an adapter can enforce tenant-aware policy:</p>
<pre><code class="language-ts">import type { SecretsPort } from "@eidentic/types";

const secrets: SecretsPort = {
  async get(ref, context) {
    return companyVault.read({
      name: ref,
      tenant: context?.scope?.orgId,
      workload: context?.toolId,
    });
  },
};</code></pre>
<p>Existing adapters that implement only <code>get(ref)</code> remain compatible.</p>
<h2>What is protected</h2>
<ul><li>Undeclared access fails closed.</li><li>Secret declaration names are validated and frozen.</li><li>Resolved values are removed before tool output or errors reach hooks, durable state, stream events, subsequent model messages, or replay.</li><li>Boundary sanitation is depth- and size-bounded and does not invoke getters or Proxy reflection traps.</li></ul>
<h2>Important limits</h2>
<p>Redaction is a final safety boundary, not permission to return credentials. Never log, persist, preview, slice, hash, or intentionally return a secret. Eidentic can exactly redact values resolved through its capability; it cannot discover arbitrary credentials obtained behind its back. Keep production values in a real secret manager and rotate them through that system.</p>`,
};

const releaseArticle: EidenticArticle = {
  id: 'reference-secret-capabilities-release',
  title: 'Least-privilege secret capabilities release',
  slug: 'reference-secret-capabilities-release',
  excerpt: 'What shipped in v2.2.0 and which package versions contain the new secret boundary.',
  category_id: 'reference',
  is_published: true,
  display_order: 6,
  sidebar_title: null,
  icon: null,
  created_at: UPDATED_AT,
  updated_at: UPDATED_AT,
  content: `<p>Eidentic v2.2.0 ships least-privilege tool secret capabilities. The primary published packages are <code>eidentic@1.1.0</code>, <code>@eidentic/core@1.1.0</code>, <code>@eidentic/types@1.1.0</code>, and <code>@eidentic/cli@0.4.0</code>.</p>
<h2>Highlights</h2><ul><li>Per-tool <code>requiredSecrets</code> capabilities with <code>get()</code> and <code>require()</code>.</li><li>Immutable resolution context for tenant-aware custom vaults.</li><li>Resolved-value containment across output, errors, hooks, durable state, replay, events, and model context.</li><li>Automatic least-privilege environment wiring for directory projects.</li><li>Name-only <code>eidentic doctor</code> diagnostics.</li><li>Source-compatible one-argument <code>SecretsPort</code> adapters.</li></ul>
<h2>Install</h2><pre><code class="language-bash">npm install eidentic@latest
# or package-by-package
npm install @eidentic/core@latest @eidentic/types@latest @eidentic/cli@latest</code></pre>
<p>See <a href="/article/guides-secret-capabilities">Tool secrets and least privilege</a> for the complete setup and production-vault pattern.</p>`,
};

export function applyV22DocUpdates(articles: EidenticArticle[]): EidenticArticle[] {
  const withoutManagedArticles = articles.filter((article) =>
    article.id !== secretCapabilitiesArticle.id && article.id !== releaseArticle.id);
  return [...withoutManagedArticles, secretCapabilitiesArticle, releaseArticle];
}
