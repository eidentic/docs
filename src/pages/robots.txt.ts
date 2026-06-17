import type { APIRoute } from 'astro';
import { getHelpCenterConfig } from '../lib/localData';
import { getPublicBaseUrl } from '../lib/site-url';

export const GET: APIRoute = async ({ request, url }) => {
  const config = await getHelpCenterConfig();
  const baseUrl = getPublicBaseUrl(request, url, config);
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
LLM-Content: ${baseUrl}/llms.txt
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
