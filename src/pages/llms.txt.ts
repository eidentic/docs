import type { APIRoute } from 'astro';
import { getArticles, getHelpCenterConfig } from '../lib/localData';
import { buildPublicUrl, getPublicBaseUrl } from '../lib/site-url';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const [articles, config] = await Promise.all([
    getArticles(),
    getHelpCenterConfig(),
  ]);

  const baseUrl = getPublicBaseUrl(request, url, config);
  const topArticles = articles.slice(0, 20);

  const body = [
    `# ${config.portal_name || 'Eidentic Docs'}`,
    '',
    config.meta_description || config.welcome_subtitle || 'Product documentation and API reference.',
    '',
    `Base URL: ${baseUrl}`,
    `Sitemap: ${buildPublicUrl(request, url, '/sitemap.xml', config)}`,
    `All Articles Markdown: ${buildPublicUrl(request, url, '/articles.txt', config)}`,
    `Extended LLM Listing: ${buildPublicUrl(request, url, '/llms-full.txt', config)}`,
    '',
    '## Priority Articles',
    '',
    ...topArticles.map((article) => `- ${article.title}: ${buildPublicUrl(request, url, `/article/${article.slug}.txt`, config)}`),
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
