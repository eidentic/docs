import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

const FEATURES = [
  {
    icon: "◈",
    title: "Memory that improves itself",
    body: "Self-editing blocks, lexical + vector recall, a temporal knowledge graph, and sleep-time consolidation. Your agent knows more next session.",
  },
  {
    icon: "⬡",
    title: "Production from day one",
    body: "Durable checkpoint/resume, workflows with human-in-the-loop, enforced cost ceilings, multi-tenant isolation, and one-call GDPR erasure.",
  },
  {
    icon: "◇",
    title: "Composable, runs everywhere",
    body: "Ports-and-adapters across stores, vectors, and models. Node, Bun, Deno, and the edge. MCP host and server, A2A, React hooks.",
  },
  {
    icon: "✓",
    title: "Honest benchmarks",
    body: "Full LoCoMo runs with the full-context baseline included — and the gaps published alongside the wins.",
  },
];

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline} noFooter={false}>
      <main className="eid-hero">
        {/* Mark */}
        <img
          src="/img/mark.svg"
          alt="eidentic mark"
          className="eid-hero__mark"
          width={64}
          height={47}
        />

        {/* Title */}
        <h1 className="eid-hero__title">eidentic</h1>

        {/* Tagline */}
        <p className="eid-hero__tagline">
          The open-source TypeScript SDK for AI agents with self-improving memory and production fundamentals built in.
        </p>

        {/* CTAs */}
        <div className="eid-hero__ctas">
          <Link to="/getting-started" className="eid-hero__cta-primary">
            Get started →
          </Link>
          <a
            href="https://github.com/eidentic/eidentic"
            className="eid-hero__cta-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>

        {/* Feature cards */}
        <div className="eid-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="eid-feature-card">
              <span className="eid-feature-card__icon">{f.icon}</span>
              <h3 className="eid-feature-card__title">{f.title}</h3>
              <p className="eid-feature-card__body">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
