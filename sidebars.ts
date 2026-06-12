import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: "category",
      label: "Getting Started",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "introduction", label: "Introduction" },
        { type: "doc", id: "getting-started", label: "Quickstart" },
        { type: "doc", id: "scaffold", label: "Scaffold a project" },
      ],
    },
    {
      type: "category",
      label: "Core Concepts",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "concepts/agent-loop", label: "The agent loop" },
        { type: "doc", id: "concepts/sessions", label: "Sessions & event sourcing" },
        { type: "doc", id: "concepts/tools", label: "Tools" },
        { type: "doc", id: "concepts/strategies", label: "Strategies" },
        { type: "doc", id: "concepts/durable-execution", label: "Durable execution" },
        { type: "doc", id: "concepts/permissions", label: "Permissions & guardrails" },
        { type: "doc", id: "guides/structured-output", label: "Structured output" },
        { type: "doc", id: "guides/citations", label: "Citations" },
        { type: "doc", id: "guides/agent-hooks", label: "Agent hooks" },
      ],
    },
    {
      type: "category",
      label: "Memory & Skills",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "guides/memory", label: "Memory engine" },
        { type: "doc", id: "memory/knowledge-graph", label: "Knowledge graph" },
        { type: "doc", id: "guides/memory-governance", label: "Memory governance" },
        { type: "doc", id: "memory/skills", label: "Skills" },
      ],
    },
    {
      type: "category",
      label: "Models & Cost",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "guides/model-routing", label: "Models & routing" },
        { type: "doc", id: "models/cost", label: "Cost & pricing" },
        { type: "doc", id: "guides/prompt-versioning", label: "Prompt versioning" },
      ],
    },
    {
      type: "category",
      label: "Adapters",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "adapters/stores", label: "Stores" },
        { type: "doc", id: "adapters/vector-stores", label: "Vector stores" },
        { type: "doc", id: "adapters/embedders", label: "Embedders & rerankers" },
        { type: "doc", id: "adapters/sandboxes", label: "Sandboxes" },
        { type: "doc", id: "adapters/tracing", label: "Tracing" },
      ],
    },
    {
      type: "category",
      label: "Tools & Integrations",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "guides/tools", label: "Built-in tools" },
        { type: "doc", id: "guides/browser-tools", label: "Browser automation" },
        { type: "doc", id: "integrations/rag", label: "RAG" },
        { type: "doc", id: "integrations/mcp", label: "MCP" },
        { type: "doc", id: "integrations/a2a", label: "A2A" },
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
      label: "Server & Production",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "guides/server-studio", label: "Server & Studio" },
        { type: "doc", id: "integrations/auth", label: "Authentication" },
        { type: "doc", id: "guides/server-hardening", label: "Production hardening" },
        { type: "doc", id: "guides/observability", label: "Observability" },
        { type: "doc", id: "guides/deployment", label: "Deployment" },
        { type: "doc", id: "guides/data-residency", label: "Data residency" },
        { type: "doc", id: "guides/runtimes", label: "Runtimes" },
      ],
    },
    {
      type: "category",
      label: "Frontend",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "guides/react-hooks", label: "React hooks" },
        { type: "doc", id: "guides/building-your-own-ui", label: "Building your own UI" },
        { type: "doc", id: "guides/nextjs", label: "Next.js" },
      ],
    },
    {
      type: "category",
      label: "Quality",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "guides/evals-ci", label: "Evals in CI" },
        { type: "doc", id: "guides/benchmarks", label: "Benchmarks" },
      ],
    },
    {
      type: "doc",
      id: "examples",
      label: "Examples",
    },
    {
      type: "category",
      label: "Reference",
      collapsible: true,
      collapsed: false,
      items: [
        { type: "doc", id: "reference", label: "API Reference" },
        { type: "doc", id: "guides/stability", label: "Stability & versioning" },
      ],
    },
  ],
};

export default sidebars;
