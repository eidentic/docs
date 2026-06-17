import type { APIRoute } from 'astro';
import { getArticleFeedbackStats } from '@/lib/feedback-store';
import { getArticles } from '@/lib/localData';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const articleLookup = url.searchParams.get('articleId')?.trim() || '';
  const projectId = url.searchParams.get('projectId')?.trim() || '';

  if (!articleLookup || !projectId) {
    return new Response(JSON.stringify({ error: 'articleId and projectId are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const articles = await getArticles(projectId);
  const matchedArticle = articles.find(
    (article) => article.id === articleLookup || article.slug === articleLookup,
  );
  const resolvedArticleId = matchedArticle?.id || articleLookup;
  const stats = getArticleFeedbackStats(projectId, resolvedArticleId);

  return new Response(JSON.stringify({
    ok: true,
    articleId: resolvedArticleId,
    slug: matchedArticle?.slug || null,
    stats,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
