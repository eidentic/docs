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

const UPDATED_AT = '2026-06-26T00:00:00.000Z';

const aiSdk7InstallNote =
  '<p>Eidentic targets <code>ai@^7</code>. AI SDK-backed Eidentic packages are ESM-only, so use ESM <code>import</code> syntax and run on Node.js 22 or newer. For production, prefer Node.js 24 or 26.</p>';

const dataResidencyContent = `<p>Every external dependency - model, embedder, store - is a swappable port. You can run entirely on-device with no data leaving the machine.</p>
<h2>Explicit provider pattern</h2>
<p><code>AgentConfig.model</code> accepts any <code>ModelPort</code>. You control which provider is used, where the data goes, and what is logged. There is no default cloud call.</p>
<pre><code class="language-ts">import { Agent } from "@eidentic/core";
import { AIModel } from "@eidentic/model";

// Any AI SDK 7 provider - hosted or local
const agent = new Agent({
  id: "local-agent",
  model: new AIModel(yourProvider("model-id")),
  store,
});</code></pre>
<h2>Local language models</h2>
<h3>OpenAI-compatible local servers</h3>
<p>Most local model runtimes expose an OpenAI-compatible API. Point the AI SDK OpenAI provider at your local endpoint:</p>
<pre><code class="language-ts">import { createOpenAI } from "@ai-sdk/openai";
import { AIModel } from "@eidentic/model";

const localProvider = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "not-needed",
});

const model = new AIModel(localProvider("llama3.2"));</code></pre>
<h3>Ollama with AI SDK 7</h3>
<p>For new code, install the AI SDK 7-compatible Ollama provider and pass it directly to <code>AIModel</code>. The old <code>createOllamaModel()</code> convenience helper is deprecated and no longer auto-loads <code>ollama-ai-provider</code>.</p>
<pre><code class="language-bash">npm install ai-sdk-ollama</code></pre>
<pre><code class="language-ts">import { AIModel } from "@eidentic/model";
import { ollama, createOllama } from "ai-sdk-ollama";

const model = new AIModel(ollama("llama3.2"));

const remoteOllama = createOllama({
  baseURL: "http://192.168.1.10:11434/api",
});
const remoteModel = new AIModel(remoteOllama("mistral"));</code></pre>
<h2>Local embeddings</h2>
<p><code>@eidentic/transformers</code> runs embedding models on-device using the Transformers.js runtime. No API key is required.</p>
<pre><code class="language-bash">npm install @eidentic/transformers</code></pre>
<pre><code class="language-ts">import { LocalEmbedder } from "@eidentic/transformers";
import { Memory } from "@eidentic/memory";
import { LanceDBVectorStore } from "@eidentic/lancedb";

const embedder = await LocalEmbedder.load();
const memory = new Memory({
  store,
  vector: new LanceDBVectorStore("./vectors"),
  embedder,
});</code></pre>
<h2>Embedded store</h2>
<p>For a fully file-based deployment with no external database, use a local libSQL file or SQLite when native addons are acceptable:</p>
<pre><code class="language-ts">import { LibsqlStore } from "@eidentic/libsql";

const store = new LibsqlStore("file:./eidentic.db");</code></pre>
<p><code>LibsqlStore</code> uses a local <code>file:</code> URL and requires no external libsql server. It is safe in serverless and edge environments.</p>
<h2>Route by data sensitivity</h2>
<p>Use <code>routeModel</code> to keep sensitive requests on a local model and route public queries to a hosted provider:</p>
<pre><code class="language-ts">import { AIModel, routeModel } from "@eidentic/model";
import { anthropic } from "@ai-sdk/anthropic";
import { ollama } from "ai-sdk-ollama";

const model = routeModel(
  (req) => {
    const text = JSON.stringify(req.messages);
    return text.includes("customer_secret") ? "local" : "hosted";
  },
  {
    local: new AIModel(ollama("llama3.2")),
    hosted: new AIModel(anthropic("claude-sonnet-4-5")),
  },
);</code></pre>
<h2>Operational notes</h2>
<ul>
<li>AI SDK 7 packages are ESM-only. Use ESM <code>import</code>, not CommonJS <code>require()</code>.</li>
<li>Run on Node.js 22 or newer. Prefer Node.js 24 or 26 for production services.</li>
<li>Keep secrets in your provider configuration or environment. Eidentic never sends API keys to the model.</li>
</ul>`;

export const aiSdk7MigrationArticle = {
  id: 'reference-ai-sdk-7-migration',
  title: 'AI SDK 7 Migration',
  slug: 'reference-ai-sdk-7-migration',
  excerpt: 'What changed in Eidentic for AI SDK 7, including ESM-only packages, Node.js 22+, structured output, usage, and Ollama.',
  category_id: 'reference',
  is_published: true,
  display_order: 3,
  sidebar_title: null,
  icon: null,
  created_at: UPDATED_AT,
  updated_at: UPDATED_AT,
  content: `<p>Eidentic now targets <code>ai@^7</code> for AI SDK-backed packages. This page lists the compatibility changes and the migration steps for existing users.</p>
<p><strong>Published in SDK release <a href="https://github.com/eidentic/eidentic/releases/tag/v0.3.11">v0.3.11</a>.</strong> This release includes <code>@eidentic/model@0.3.0</code>, <code>@eidentic/server@0.4.0</code>, <code>@eidentic/nextjs@0.3.0</code>, <code>@eidentic/studio@0.2.0</code>, <code>eidentic@0.2.0</code>, and <code>create-eidentic@0.2.0</code>.</p>
<h2>What changed</h2>
<ul>
<li><code>@eidentic/model</code> now calls AI SDK with <code>instructions</code>, <code>output</code>, <code>result.output</code>, <code>result.stream</code>, and <code>usage.inputTokenDetails.cacheReadTokens</code>.</li>
<li><code>@eidentic/model</code>, <code>@eidentic/server</code>, <code>@eidentic/nextjs</code>, <code>@eidentic/studio</code>, and the <code>eidentic</code> umbrella package are ESM-only where they touch AI SDK 7.</li>
<li>CommonJS <code>require()</code> consumers must migrate to ESM <code>import</code>.</li>
<li>Node.js 22 or newer is required. For production services, prefer Node.js 24 or 26.</li>
<li>Eidentic's public <code>Usage.cachedInputTokens</code> field remains stable. Internally, AI SDK 7 cache reads are mapped from <code>usage.inputTokenDetails.cacheReadTokens</code>.</li>
</ul>
<h2>Dependency versions</h2>
<pre><code class="language-bash">npm install eidentic ai@^7 @ai-sdk/anthropic@^4
# React UI users:
npm install @ai-sdk/react@^4</code></pre>
<p>Provider package majors moved with AI SDK 7. Anthropic, OpenAI, Google, and Mistral use v4-compatible provider packages; DeepSeek uses v3-compatible packages.</p>
<h2>Structured output</h2>
<p>If you call Eidentic through <code>outputSchema</code>, no app-level API changes are required. Eidentic now maps that to AI SDK 7 <code>output: Output.object(...)</code> and reads the parsed value from <code>result.output</code>.</p>
<h2>Ollama</h2>
<p><code>createOllamaModel()</code> is deprecated. For AI SDK 7, install <code>ai-sdk-ollama</code> and pass the provider model directly to <code>AIModel</code>:</p>
<pre><code class="language-ts">import { AIModel } from "@eidentic/model";
import { ollama } from "ai-sdk-ollama";

const model = new AIModel(ollama("llama3.2"));</code></pre>
<h2>Checklist</h2>
<ol>
<li>Use ESM imports in your app and remove CommonJS <code>require()</code> usage for Eidentic AI SDK-backed packages.</li>
<li>Run on Node.js 22 or newer.</li>
<li>Upgrade <code>ai</code>, <code>@ai-sdk/react</code>, and provider packages to AI SDK 7-compatible majors.</li>
<li>Replace <code>createOllamaModel()</code> with <code>ai-sdk-ollama</code> provider imports.</li>
<li>Run your tests against the new package versions before publishing.</li>
</ol>
<p>For the upstream breaking-change details, see the official <a href="https://ai-sdk.dev/v7/docs/migration-guides/migration-guide-7-0">AI SDK 7 migration guide</a>.</p>`,
} satisfies EidenticArticle;

function updateGettingStarted(article: EidenticArticle): EidenticArticle {
  if (article.content.includes(aiSdk7InstallNote)) return article;
  return {
    ...article,
    updated_at: UPDATED_AT,
    content: article.content.replace(
      '<p><code>eidentic</code> is the umbrella package',
      `${aiSdk7InstallNote}\n<p><code>eidentic</code> is the umbrella package`,
    ),
  };
}

function updateRuntimes(article: EidenticArticle): EidenticArticle {
  let content = article.content
    .replace(
      '<p>Eidentic is verified on Node, Bun, Deno, and edge runtimes.',
      '<p>Eidentic is verified on Node.js 22+, Bun, Deno, and edge runtimes.',
    )
    .replace('<strong>Node 22 / 24</strong>', '<strong>Node 22 / 24 / 26</strong>');

  if (!content.includes('AI SDK 7 and ESM-only packages')) {
    content = content.replace(
      '<h2>Safe import rule</h2>',
      '<h2>AI SDK 7 and ESM-only packages</h2>\n<p>Packages that bridge to AI SDK 7 are ESM-only. Use ESM <code>import</code> syntax and run Node.js 22 or newer. Node.js 24 or 26 is recommended for production services.</p>\n<h2>Safe import rule</h2>',
    );
  }

  return { ...article, updated_at: UPDATED_AT, content };
}

function updateEmbedders(article: EidenticArticle): EidenticArticle {
  return {
    ...article,
    updated_at: UPDATED_AT,
    content: article.content.replace('AI SDK v6 embedding model', 'AI SDK 7 embedding model'),
  };
}

export function applyAiSdk7DocUpdates(input: readonly EidenticArticle[]): EidenticArticle[] {
  const articles = input.map((article) => {
    if (article.id === 'getting-started') return updateGettingStarted(article);
    if (article.id === 'guides-runtimes') return updateRuntimes(article);
    if (article.id === 'adapters-embedders') return updateEmbedders(article);
    if (article.id === 'guides-data-residency') {
      return { ...article, updated_at: UPDATED_AT, content: dataResidencyContent };
    }
    return article;
  });

  const withoutExisting = articles.filter((article) => article.id !== aiSdk7MigrationArticle.id);
  return [...withoutExisting, aiSdk7MigrationArticle];
}
