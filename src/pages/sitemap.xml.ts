import type { APIRoute } from 'astro';
import { getArticles, getCategories, getHelpCenterConfig } from '../lib/localData';
import { buildPublicUrl } from '../lib/site-url';

export const GET: APIRoute = async ({ request, url }) => {
  const [articles, categories, config] = await Promise.all([
    getArticles(),
    getCategories(),
    getHelpCenterConfig(),
  ]);

  const now = new Date().toISOString();
  const urls: string[] = [];

  urls.push(`  <url>
    <loc>${buildPublicUrl(request, url, '/', config)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  for (const category of categories) {
    const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    urls.push(`  <url>
    <loc>${buildPublicUrl(request, url, `/category/${slug}`, config)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  for (const article of articles) {
    const lastmod = new Date(article.updated_at || article.created_at).toISOString();
    urls.push(`  <url>
    <loc>${buildPublicUrl(request, url, `/article/${article.slug}`, config)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
