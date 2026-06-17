import type { APIRoute } from 'astro';
import {
  getArticleFeedbackStats,
  getFeedbackSessionKey,
  recordArticleVote,
} from '@/lib/feedback-store';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const articleId = typeof body?.articleId === 'string' ? body.articleId.trim() : '';
    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : '';
    const helpful = typeof body?.helpful === 'boolean' ? body.helpful : null;

    if (!articleId || !projectId || helpful === null) {
      return new Response(
        JSON.stringify({ error: 'articleId, projectId, and helpful are required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      );
    }

    const vote = helpful ? 'helpful' : 'not_helpful';
    recordArticleVote(projectId, articleId, getFeedbackSessionKey(request), vote);
    const stats = getArticleFeedbackStats(projectId, articleId);

    return new Response(
      JSON.stringify({
        ok: true,
        vote,
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  } catch (error) {
    console.error('Feedback vote API error:', error);
    return new Response(JSON.stringify({ error: 'Could not record feedback.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
