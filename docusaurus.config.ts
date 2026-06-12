import { createRequire } from "node:module";
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// The config is an ES module, so there is no global `require`; derive one to resolve the
// local-search theme by package path (the recommended way to register it).
const require = createRequire(import.meta.url);

const positioningSentence =
  "The open-source TypeScript SDK for AI agents with self-improving memory and production fundamentals built in.";

const config: Config = {
  title: "Eidentic",
  tagline: positioningSentence,
  favicon: "img/favicon-32.png",

  url: "https://docs.eidentic.dev",
  baseUrl: "/",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "anonymous",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    },
    {
      // Context7 chat widget: floating "Ask about Eidentic" button that answers from the
      // indexed docs snippets. Branded with the ember accent; only renders on allowed domains.
      tagName: "script",
      attributes: {
        src: "https://context7.com/widget.js",
        "data-library": "/eidentic/docs",
        "data-color": "#f5a524",
        "data-position": "bottom-right",
        "data-placeholder": "Ask about Eidentic…",
        defer: "true",
      },
    },
    {
      // schema.org JSON-LD: entity resolution for AI assistants + Google AI Overviews.
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://eidentic.dev/#org",
            name: "Eidentic",
            alternateName: "Eidentic SDK",
            disambiguatingDescription:
              "Eidentic (pronounced e-IDENT-ic) is a brand name — an open-source TypeScript SDK for AI agents. It is spelled Eidentic, not 'eidetic'.",
            url: "https://eidentic.dev",
            sameAs: [
              "https://github.com/eidentic",
              "https://www.npmjs.com/package/eidentic",
              "https://x.com/eidentic",
              "https://www.producthunt.com/products/eidentic",
            ],
          },
          {
            "@type": "SoftwareApplication",
            "@id": "https://eidentic.dev/#sdk",
            name: "Eidentic",
            alternateName: "Eidentic SDK",
            disambiguatingDescription:
              "Eidentic — the agent SDK, spelled Eidentic (e-IDENT-ic), not 'eidetic'.",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Node.js, Bun, Deno, Edge",
            keywords:
              "Eidentic, AI agents, agent memory, TypeScript SDK, temporal knowledge graph",
            description:
              "The open-source TypeScript SDK for AI agents with self-improving memory and production fundamentals built in.",
            url: "https://eidentic.dev",
            codeRepository: "https://github.com/eidentic/eidentic",
            programmingLanguage: "TypeScript",
            license: "https://www.apache.org/licenses/LICENSE-2.0",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@id": "https://eidentic.dev/#org" },
          },
        ],
      }),
    },
  ],

  themes: [
    [
      // Offline full-text search (no external service / no Algolia approval needed).
      // Adds a search bar to the navbar and indexes all docs at build time.
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: "/",
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  plugins: [
    [
      "docusaurus-plugin-llms",
      {
        // Generates /llms.txt (curated index) + /llms-full.txt (full content) + per-page .md
        // at build time, so IDE agents (Cursor, Claude Code) can consume the docs directly.
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        generateMarkdownFiles: true,
        docsDir: "docs",
        title: "Eidentic",
        description:
          "The open-source TypeScript SDK for AI agents with self-improving memory and production fundamentals built in.",
      },
    ],
    [
      // Per-page "Copy page / View as Markdown / Open in ChatGPT / Claude / Perplexity" actions.
      "docusaurus-plugin-copy-page-button",
      {
        enabledActions: ["copy", "view", "chatgpt", "claude", "perplexity"],
        generateMarkdownRoutes: true,
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl: "https://github.com/eidentic/eidentic/edit/main/docs-site/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/og-1200x630.png",

    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },

    navbar: {
      title: "eidentic",
      logo: {
        alt: "eidentic mark",
        src: "img/mark-on-light.svg",
        srcDark: "img/mark.svg",
        href: "/",
        width: 28,
        height: 21,
      },
      hideOnScroll: false,
      items: [
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://www.npmjs.com/package/eidentic",
          label: "npm",
          position: "right",
        },
        {
          href: "https://github.com/eidentic/eidentic",
          label: "GitHub",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting Started", to: "/getting-started" },
            { label: "API Reference", to: "/reference" },
            { label: "Benchmarks", to: "/guides/benchmarks" },
          ],
        },
        {
          title: "Project",
          items: [
            { label: "GitHub", href: "https://github.com/eidentic/eidentic" },
            { label: "npm", href: "https://www.npmjs.com/package/eidentic" },
            { label: "eidentic.dev", href: "https://eidentic.dev" },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Eidentic`,
    },

    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ["bash", "typescript", "javascript", "json", "toml", "docker"],
    },

    docs: {
      sidebar: {
        hideable: false,
        autoCollapseCategories: false,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
