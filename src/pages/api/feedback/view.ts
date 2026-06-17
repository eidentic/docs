import type { APIRoute } from 'astro';
import { getFeedbackSessionKey, recordArticleView } from '@/lib/feedback-store';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const articleId = typeof body?.articleId === 'string' ? body.articleId.trim() : '';
    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : '';

    if (!articleId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'articleId and projectId are required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      );
    }

    recordArticleView(projectId, articleId, getFeedbackSessionKey(request));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('Feedback view API error:', error);
    return new Response(JSON.stringify({ error: 'Could not record article view.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
