// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://docs.eidentic.dev",
  integrations: [
    starlight({
      title: "Eidentic",
      favicon: "/favicon.svg",
      logo: {
        light: "./src/assets/mark-light.svg",
        dark: "./src/assets/mark-dark.svg",
        alt: "eidentic",
      },
      description:
        "Agents that remember. An open-source TypeScript SDK with self-improving memory and production fundamentals built in.",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/eidentic/eidentic" }],
      customCss: ["./src/custom.css"],
      sidebar: [
        {
          label: "Getting Started",
          link: "/getting-started",
        },
        {
          label: "Guides",
          items: [
            {
              label: "Integrations",
              items: [
                { label: "Next.js", link: "/guides/nextjs" },
                { label: "Custom UI", link: "/guides/building-your-own-ui" },
                { label: "Runtimes", link: "/guides/runtimes" },
                { label: "Deployment", link: "/guides/deployment" },
              ],
            },
            {
              label: "Agent",
              items: [
                { label: "Memory", link: "/guides/memory" },
                { label: "Memory Governance", link: "/guides/memory-governance" },
                { label: "Structured Output", link: "/guides/structured-output" },
                { label: "Tools & Web Search", link: "/guides/tools" },
                { label: "Agent Hooks", link: "/guides/agent-hooks" },
                { label: "Citations & Grounded Output", link: "/guides/citations" },
              ],
            },
            {
              label: "Workflows",
              items: [
                { label: "Workflows", link: "/guides/workflows" },
              ],
            },
            {
              label: "Server",
              items: [
                { label: "Server & Studio", link: "/guides/server-studio" },
                { label: "Production Hardening", link: "/guides/server-hardening" },
              ],
            },
            {
              label: "Frontend",
              items: [
                { label: "React Hooks", link: "/guides/react-hooks" },
              ],
            },
            {
              label: "Models & Cost",
              items: [
                { label: "Model Routing", link: "/guides/model-routing" },
                { label: "Prompt Versioning", link: "/guides/prompt-versioning" },
              ],
            },
            {
              label: "Quality & Operations",
              items: [
                { label: "Observability", link: "/guides/observability" },
                { label: "Evals in CI", link: "/guides/evals-ci" },
                { label: "Benchmarks", link: "/guides/benchmarks" },
                { label: "Browser Tools", link: "/guides/browser-tools" },
              ],
            },
            {
              label: "Data & Compliance",
              items: [
                { label: "Data Residency & Local Models", link: "/guides/data-residency" },
                { label: "Stability & Versioning", link: "/guides/stability" },
              ],
            },
          ],
        },
        {
          label: "API Reference",
          link: "/reference",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/eidentic/eidentic/edit/main/docs-site/",
      },
    }),
  ],
});
