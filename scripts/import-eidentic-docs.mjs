import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createHighlighter } from 'shiki';

const sourceRoot = '/Users/baran/projects/eidentic/docs/docs';
const outputFile = '/Users/baran/projects/eidentic/newdocs/src/data/generated/eidentic.ts';
const searchOutputFile = '/Users/baran/projects/eidentic/newdocs/src/data/generated/eidentic-search.json';

const categorySpecs = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Install Eidentic and build your first memory-enabled agent.',
    icon: 'hugeicons:rocket-01',
    docs: ['introduction', 'getting-started', 'scaffold'],
  },
  {
    id: 'core-concepts',
    name: 'Core Concepts',
    description: 'The runtime model behind sessions, tools, strategies, and durable execution.',
    icon: 'hugeicons:bulb-charging',
    docs: [
      'concepts/agent-loop',
      'concepts/sessions',
      'concepts/tools',
      'concepts/strategies',
      'concepts/durable-execution',
      'concepts/permissions',
      'guides/structured-output',
      'guides/citations',
      'guides/agent-hooks',
    ],
  },
  {
    id: 'memory-skills',
    name: 'Memory & Skills',
    description: 'How recall, governance, graphs, and skills fit together in Eidentic.',
    icon: 'hugeicons:brain-03',
    docs: [
      'guides/memory',
      'memory/knowledge-graph',
      'guides/memory-governance',
      'memory/skills',
    ],
  },
  {
    id: 'models-cost',
    name: 'Models & Cost',
    description: 'Routing, pricing, and prompt lifecycle controls.',
    icon: 'hugeicons:coins-dollar',
    docs: [
      'guides/model-routing',
      'models/cost',
      'guides/prompt-versioning',
    ],
  },
  {
    id: 'adapters',
    name: 'Adapters',
    description: 'Persistence, vector, sandbox, and tracing adapters.',
    icon: 'hugeicons:plug-01',
    docs: [
      'adapters/stores',
      'adapters/vector-stores',
      'adapters/embedders',
      'adapters/sandboxes',
      'adapters/tracing',
    ],
  },
  {
    id: 'tools-integrations',
    name: 'Tools & Integrations',
    description: 'Built-in tools plus MCP, RAG, and A2A interoperability.',
    icon: 'hugeicons:ai-idea',
    docs: [
      'guides/tools',
      'guides/browser-tools',
      'integrations/rag',
      'integrations/mcp',
      'integrations/a2a',
    ],
  },
  {
    id: 'workflows',
    name: 'Workflows',
    description: 'Durable multi-step orchestration with typed pipelines.',
    icon: 'hugeicons:workflow-square-09',
    docs: ['guides/workflows'],
  },
  {
    id: 'server-production',
    name: 'Server & Production',
    description: 'Running Eidentic as a service, with auth, observability, and deployment hardening.',
    icon: 'hugeicons:server-stack-01',
    docs: [
      'guides/server-studio',
      'integrations/auth',
      'guides/server-hardening',
      'guides/observability',
      'guides/deployment',
      'guides/data-residency',
      'guides/runtimes',
    ],
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'Hooks and UI integration paths for React and Next.js.',
    icon: 'hugeicons:web-design-01',
    docs: [
      'guides/react-hooks',
      'guides/building-your-own-ui',
      'guides/nextjs',
    ],
  },
  {
    id: 'quality',
    name: 'Quality',
    description: 'Benchmarking, evals, and release confidence.',
    icon: 'hugeicons:chart-evaluation',
    docs: ['guides/evals-ci', 'guides/benchmarks'],
  },
  {
    id: 'examples',
    name: 'Examples',
    description: 'Runnable examples across the Eidentic monorepo.',
    icon: 'hugeicons:play-circle',
    docs: ['examples'],
  },
  {
    id: 'reference',
    name: 'Reference',
    description: 'Package surface area and versioning contract.',
    icon: 'hugeicons:book-open-02',
    docs: ['reference', 'guides/stability'],
  },
];

const highlighter = await createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: [
    'plaintext',
    'bash',
    'javascript',
    'jsx',
    'typescript',
    'tsx',
    'json',
    'yaml',
    'markdown',
    'html',
    'css',
    'sql',
    'diff',
  ],
});

const languageAliases = new Map([
  ['text', 'plaintext'],
  ['txt', 'plaintext'],
  ['plain', 'plaintext'],
  ['plaintext', 'plaintext'],
  ['sh', 'bash'],
  ['shell', 'bash'],
  ['bash', 'bash'],
  ['zsh', 'bash'],
  ['js', 'javascript'],
  ['javascript', 'javascript'],
  ['jsx', 'jsx'],
  ['ts', 'typescript'],
  ['typescript', 'typescript'],
  ['tsx', 'tsx'],
  ['json', 'json'],
  ['yml', 'yaml'],
  ['yaml', 'yaml'],
  ['md', 'markdown'],
  ['markdown', 'markdown'],
  ['html', 'html'],
  ['css', 'css'],
  ['sql', 'sql'],
  ['diff', 'diff'],
]);

function normalizeLanguage(value) {
  if (!value) return 'plaintext';
  return languageAliases.get(value.toLowerCase()) || 'plaintext';
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return { data: {}, body: raw.trim() };
  }

  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, body: raw.trim() };
  }

  const block = raw.slice(4, end);
  const body = raw.slice(end + 5).trim();
  const data = {};

  for (const line of block.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value;
  }

  return { data, body };
}

const docEntries = fs
  .readdirSync(sourceRoot, { recursive: true })
  .filter((file) => file.endsWith('.md'))
  .map((relativePath) => {
    const relativeDocPath = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
    return {
      relativePath: relativeDocPath,
      fullPath: path.join(sourceRoot, relativePath),
      slug: relativeDocPath.replace(/\//g, '-'),
    };
  });

const docsByPath = new Map(docEntries.map((entry) => [entry.relativePath, entry]));

function mapDocHref(currentRelativePath, href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  if (/^[a-z]+:/i.test(href)) {
    return href;
  }

  if (href.startsWith('/img/') || href.startsWith('/.well-known/')) {
    return href;
  }

  if (href === '/') {
    return '/';
  }

  let pathname = href;
  let hash = '';
  const hashIndex = href.indexOf('#');
  if (hashIndex >= 0) {
    pathname = href.slice(0, hashIndex);
    hash = href.slice(hashIndex);
  }

  let normalizedPath;
  if (pathname.startsWith('/')) {
    normalizedPath = pathname.slice(1);
  } else {
    const currentDir = path.posix.dirname(currentRelativePath);
    normalizedPath = path.posix.normalize(path.posix.join(currentDir, pathname));
  }

  normalizedPath = normalizedPath.replace(/^\.\//, '').replace(/\.md$/, '');
  const linkedDoc = docsByPath.get(normalizedPath);

  if (linkedDoc) {
    return `/article/${linkedDoc.slug}${hash}`;
  }

  if (pathname.startsWith('/')) {
    return `${pathname}${hash}`;
  }

  return href;
}

function rewriteMarkdownLinks(markdown, currentRelativePath) {
  return markdown.replace(/(!?\[[^\]]*])\(([^)\s]+)([^)]*)\)/g, (_match, label, href, suffix) => {
    const nextHref = mapDocHref(currentRelativePath, href.trim());
    return `${label}(${nextHref}${suffix})`;
  });
}

function renderCodeBlock(source, language) {
  const normalizedLanguage = normalizeLanguage(language);
  const highlighted = highlighter.codeToHtml(source, {
    lang: normalizedLanguage,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  });

  return highlighted.replace(
    '<pre class="shiki ',
    `<pre data-language="${normalizedLanguage}" class="shiki `,
  );
}

function renderMarkdown(markdown) {
  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm],
      components: {
        a: ({ href, children }) => React.createElement('a', { href }, children),
        pre: ({ children }) => React.createElement(React.Fragment, null, children),
        code: ({ className, children }) => {
          const source = String(children ?? '').replace(/\n$/, '');

          if (!className && !source.includes('\n')) {
            return React.createElement('code', { className }, source);
          }

          const language = className?.match(/language-([a-z0-9#+-]+)/i)?.[1];
          return React.createElement('div', {
            dangerouslySetInnerHTML: {
              __html: renderCodeBlock(source, language),
            },
          });
        },
      },
      children: markdown,
    }),
  ).replace(/ node="\[object Object\]"/g, '');
}

function titleToId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function decodeEntities(value) {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

const allAssignedDocs = new Set(categorySpecs.flatMap((category) => category.docs));
const unassignedDocs = docEntries
  .map((entry) => entry.relativePath)
  .filter((relativePath) => !allAssignedDocs.has(relativePath));

if (unassignedDocs.length > 0) {
  throw new Error(`Unassigned docs detected: ${unassignedDocs.join(', ')}`);
}

const categories = categorySpecs.map((category, index) => ({
  id: category.id,
  name: category.name,
  description: category.description,
  icon: category.icon,
  display_order: index + 1,
  folder_id: 'docs',
  parent_category_id: null,
}));

const articles = [];
const searchDocuments = [];

for (const category of categorySpecs) {
  for (const [articleIndex, docPath] of category.docs.entries()) {
    const entry = docsByPath.get(docPath);
    if (!entry) {
      throw new Error(`Missing source markdown: ${docPath}`);
    }

    const raw = fs.readFileSync(entry.fullPath, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const html = renderMarkdown(rewriteMarkdownLinks(body, entry.relativePath));
    const title = data.title || entry.relativePath.split('/').pop();
    const article = {
      id: titleToId(entry.relativePath),
      title,
      slug: entry.slug,
      excerpt: data.description || '',
      category_id: category.id,
      is_published: true,
      display_order: articleIndex + 1,
      sidebar_title: null,
      icon: null,
      created_at: '2026-06-17T00:00:00.000Z',
      updated_at: '2026-06-17T00:00:00.000Z',
      content: html,
    };

    const contentText = stripHtml(html);

    articles.push(article);
    searchDocuments.push({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category_id: article.category_id,
      category_name: category.name,
      content_text: contentText,
      content_preview: contentText.slice(0, 420),
      url: `/article/${article.slug}`,
    });
  }
}

const fileContents = `export const generatedCategories = ${JSON.stringify(categories, null, 2)} as const;\n\nexport const generatedArticles = ${JSON.stringify(articles, null, 2)} as const;\n`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, fileContents);
fs.writeFileSync(searchOutputFile, `${JSON.stringify(searchDocuments, null, 2)}\n`);

console.log(`Imported ${articles.length} docs into ${outputFile}`);
console.log(`Wrote ${searchDocuments.length} search documents into ${searchOutputFile}`);
