import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

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
