import type { APIRoute } from 'astro';
import { getArticles, getCategories, getHelpCenterConfig } from '../lib/localData';
import { buildPublicUrl, getPublicBaseUrl } from '../lib/site-url';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const [articles, categories, config] = await Promise.all([
    getArticles(),
    getCategories(),
    getHelpCenterConfig(),
  ]);

  const baseUrl = getPublicBaseUrl(request, url, config);
  const getCategoryName = (categoryId: string | null) =>
    categories.find((category) => category.id === categoryId)?.name || 'Uncategorized';

  const body = [
    `# ${config.portal_name || 'Eidentic Docs'} Full Index`,
    '',
    `Base URL: ${baseUrl}`,
    '',
    ...articles.flatMap((article) => [
      `## ${article.title}`,
      `Category: ${getCategoryName(article.category_id)}`,
      `Page: ${buildPublicUrl(request, url, `/article/${article.slug}`, config)}`,
      `Markdown: ${buildPublicUrl(request, url, `/article/${article.slug}.txt`, config)}`,
      '',
    ]),
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
