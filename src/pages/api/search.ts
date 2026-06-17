import type { APIRoute } from 'astro';
import { searchHelpArticles } from '@/lib/search';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const limitParam = Number.parseInt(url.searchParams.get('limit') || '', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  const hits = await searchHelpArticles(query, { limit });

  return new Response(
    JSON.stringify({
      query,
      hits,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
};
