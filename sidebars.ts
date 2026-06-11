import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: "doc",
      id: "getting-started",
      label: "Getting Started",
    },
    {
      type: "category",
      label: "Guides",
      collapsible: false,
      items: [
        {
          type: "category",
          label: "Integrations",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/nextjs", label: "Next.js" },
            { type: "doc", id: "guides/building-your-own-ui", label: "Custom UI" },
            { type: "doc", id: "guides/runtimes", label: "Runtimes" },
            { type: "doc", id: "guides/deployment", label: "Deployment" },
          ],
        },
        {
          type: "category",
          label: "Agent",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/memory", label: "Memory" },
            { type: "doc", id: "guides/memory-governance", label: "Memory Governance" },
            { type: "doc", id: "guides/structured-output", label: "Structured Output" },
            { type: "doc", id: "guides/tools", label: "Tools & Web Search" },
            { type: "doc", id: "guides/agent-hooks", label: "Agent Hooks" },
            { type: "doc", id: "guides/citations", label: "Citations & Grounded Output" },
          ],
        },
        {
          type: "category",
          label: "Workflows",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/workflows", label: "Workflows" },
          ],
        },
        {
          type: "category",
          label: "Server",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/server-studio", label: "Server & Studio" },
            { type: "doc", id: "guides/server-hardening", label: "Production Hardening" },
          ],
        },
        {
          type: "category",
          label: "Frontend",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/react-hooks", label: "React Hooks" },
          ],
        },
        {
          type: "category",
          label: "Models & Cost",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/model-routing", label: "Model Routing" },
            { type: "doc", id: "guides/prompt-versioning", label: "Prompt Versioning" },
          ],
        },
        {
          type: "category",
          label: "Quality & Operations",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/observability", label: "Observability" },
            { type: "doc", id: "guides/evals-ci", label: "Evals in CI" },
            { type: "doc", id: "guides/benchmarks", label: "Benchmarks" },
            { type: "doc", id: "guides/browser-tools", label: "Browser Tools" },
          ],
        },
        {
          type: "category",
          label: "Data & Compliance",
          collapsible: true,
          collapsed: false,
          items: [
            { type: "doc", id: "guides/data-residency", label: "Data Residency & Local Models" },
            { type: "doc", id: "guides/stability", label: "Stability & Versioning" },
          ],
        },
      ],
    },
    {
      type: "doc",
      id: "reference",
      label: "API Reference",
    },
  ],
};

export default sidebars;
