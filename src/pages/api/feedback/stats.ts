import type { APIRoute } from 'astro';
import { getArticleFeedbackStats } from '@/lib/feedback-store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const articleId = url.searchParams.get('articleId')?.trim() || '';
  const projectId = url.searchParams.get('projectId')?.trim() || '';

  if (!articleId || !projectId) {
    return new Response(JSON.stringify({ error: 'articleId and projectId are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const stats = getArticleFeedbackStats(projectId, articleId);
  return new Response(JSON.stringify({ ok: true, stats }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
