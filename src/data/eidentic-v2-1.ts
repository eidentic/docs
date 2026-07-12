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

const UPDATED_AT = '2026-07-12T00:00:00.000Z';

const scaffoldContent = `<p>The recommended Eidentic project is a small, readable agent directory. The prompt, runtime wiring, and tools live in separate files, while existing <code>eidentic.config.*</code> projects continue to work unchanged.</p>
<h2>Create a project</h2>
<pre><code class="language-bash">npm create eidentic@latest my-agent
cd my-agent
npm install</code></pre>
<p>The setup asks for a model provider and creates a local <code>.env</code>. Add your provider key there; the file is gitignored and created with owner-only permissions.</p>
<h2>Project layout</h2>
<pre><code class="language-text">agent/
  instructions.md
  agent.ts
  tools/
    get-time.ts
.env
.env.example
package.json</code></pre>
<table><thead><tr><th>File</th><th>Purpose</th></tr></thead><tbody><tr><td><code>agent/instructions.md</code></td><td>The agent prompt. Directory mode always reads instructions from this file.</td></tr><tr><td><code>agent/agent.ts</code></td><td>The model, store, agent id, pricing, and other typed runtime options.</td></tr><tr><td><code>agent/tools/*.ts</code></td><td>One default-exported Eidentic tool per file. Files are loaded in deterministic filename order.</td></tr></tbody></table>
<h2>Start local development</h2>
<pre><code class="language-bash">npm run dev</code></pre>
<p>The dev command starts a localhost-only HTTP server and, in an interactive terminal, opens a chat prompt. Changes under <code>agent/</code> reload the agent after the active turn finishes.</p>
<pre><code class="language-text">you › What time is it?
● model  claude-sonnet-4-5
● tools  get_time
● tool   get_time
✓ tool   get_time
It is 10:42 AM.
✓ done   2 turns · $0.000123</code></pre>
<h2>Terminal commands</h2>
<table><thead><tr><th>Command</th><th>Effect</th></tr></thead><tbody><tr><td><code>/help</code></td><td>Show available commands.</td></tr><tr><td><code>/new</code></td><td>Start a fresh session.</td></tr><tr><td><code>/agent &lt;id&gt;</code></td><td>Switch agent when the loaded config contains more than one.</td></tr><tr><td><code>/exit</code></td><td>Drain the local server, close the store, and exit.</td></tr></tbody></table>
<p>Tool inputs and raw tool outputs are deliberately not printed. Model text is stripped of terminal control sequences before display.</p>
<h2>Add a tool</h2>
<pre><code class="language-ts">// agent/tools/weather.ts
import { createTool } from "eidentic";
import { z } from "zod";

export default createTool({
  id: "weather",
  description: "Read the weather for a city",
  inputSchema: z.object({ city: z.string() }),
  sideEffect: "read-only",
  execute: async ({ city }) =&gt; ({ city, temperatureC: 21 }),
});</code></pre>
<p>Save the file and the dev process reloads it automatically. Duplicate tool ids, malformed exports, excessive discovery, and symlinks escaping the project root are rejected.</p>
<h2>Initialize an existing project</h2>
<pre><code class="language-bash">npm install eidentic ai @ai-sdk/anthropic zod
npx eidentic init
npx eidentic dev</code></pre>
<h2>Legacy config compatibility</h2>
<p>A root <code>eidentic.config.ts</code>, <code>.js</code>, or <code>.mjs</code> remains fully supported and takes precedence during automatic discovery. Keep it for advanced multi-agent or server configuration; migration is optional.</p>`;

const localDevelopmentArticle: EidenticArticle = {
  id: 'guides-local-development',
  title: 'Local agent development',
  slug: 'guides-local-development',
  excerpt: 'Chat with a directory agent locally, add tools, and use safe live reload.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 4,
  sidebar_title: 'Local development',
  icon: null,
  created_at: UPDATED_AT,
  updated_at: UPDATED_AT,
  content: scaffoldContent,
};

const releaseArticle: EidenticArticle = {
  id: 'reference-directory-agent-release',
  title: 'Directory-first agent development release',
  slug: 'reference-directory-agent-release',
  excerpt: 'What shipped in v2.1.0 and the published package versions.',
  category_id: 'reference',
  is_published: true,
  display_order: 5,
  sidebar_title: null,
  icon: null,
  created_at: UPDATED_AT,
  updated_at: UPDATED_AT,
  content: `<p>Eidentic v2.1.0 introduces the directory-first local development workflow. The published packages are <code>eidentic@1.0.1</code>, <code>@eidentic/cli@0.3.0</code>, and <code>create-eidentic@0.3.0</code>.</p>
<h2>Highlights</h2><ul><li>Readable <code>agent/</code> projects with Markdown instructions and automatic tool discovery.</li><li>Interactive terminal chat with safe, concise model and tool events.</li><li>Lifecycle-aware live reload that drains the server and closes the previous store.</li><li>Local servers bind to <code>127.0.0.1</code>.</li><li>Legacy <code>eidentic.config.*</code> projects remain authoritative and compatible.</li></ul>
<h2>Install</h2><pre><code class="language-bash">npm create eidentic@latest my-agent
# or update an existing installation
npm install eidentic@latest</code></pre>
<p>See <a href="/article/scaffold">Scaffold a project</a> for the complete workflow.</p>`,
};

export function applyV21DocUpdates(articles: EidenticArticle[]): EidenticArticle[] {
  const updated = articles.map((article) => article.id === 'scaffold'
    ? {
        ...article,
        title: 'Scaffold a directory agent',
        excerpt: 'Create a readable agent project and start a safe local development loop.',
        updated_at: UPDATED_AT,
        content: scaffoldContent,
      }
    : article);

  const withoutManagedArticles = updated.filter((article) =>
    article.id !== localDevelopmentArticle.id && article.id !== releaseArticle.id);
  return [...withoutManagedArticles, localDevelopmentArticle, releaseArticle];
}
