import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const forwardedHost =
    request.headers.get('X-Forwarded-Host') || request.headers.get('X-Original-Host');
  const baseUrl = forwardedHost ? `${url.protocol}//${forwardedHost}` : url.origin;

  const robots = `# Eidentic docs
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: Google-CloudVertexBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: *
Allow: /

Content-Signal: search=yes, ai-train=yes, ai-input=yes
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
