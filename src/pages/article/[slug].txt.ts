import type { APIRoute } from 'astro';
import { getArticles, getCategories } from '../../lib/localData';

export const prerender = false;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function collapseBlankLines(value: string) {
  return value
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToPlainText(html: string) {
  let text = html;

  text = text.replace(/<pre[^>]*data-language="([^"]+)"[^>]*>[\s\S]*?<code>([\s\S]*?)<\/code><\/pre>/gi, (_match, language, code) => {
    const codeText = decodeHtmlEntities(
      code
        .replace(/<\/span>/gi, '')
        .replace(/<span[^>]*>/gi, '')
        .replace(/<span class="line">/gi, '')
        .replace(/<br\s*\/?>/gi, '\n'),
    );

    return `\n\`\`\`${language}\n${collapseBlankLines(codeText)}\n\`\`\`\n`;
  });

  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match, content) => {
    const lines = collapseBlankLines(
      content
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ''),
    )
      .split('\n')
      .map((line) => `> ${line.trim()}`)
      .join('\n');

    return `\n${lines}\n`;
  });

  text = text.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_match, table) => {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch) => {
      const cells = [...rowMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cellMatch) =>
        collapseBlankLines(cellMatch[1].replace(/<[^>]*>/g, '')),
      );
      return cells.join(' | ');
    });

    return rows.length ? `\n${rows.join('\n')}\n` : '\n';
  });

  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n')
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<[^>]*>/g, '');

  return collapseBlankLines(decodeHtmlEntities(text));
}

function getPublicOrigin(request: Request, url: URL) {
  const forwardedProto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('x-original-host');

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return url.origin;
}

export const GET: APIRoute = async ({ params, request, url }) => {
  const { slug } = params;
  const [allArticles, categories] = await Promise.all([getArticles(), getCategories()]);
  const article = allArticles.find((item) => item.slug === slug);

  if (!article) {
    return new Response('Article not found', { status: 404 });
  }

  const categoryName = categories.find((item) => item.id === article.category_id)?.name || 'Uncategorized';
  const publicOrigin = getPublicOrigin(request, url);
  const plainText = htmlToPlainText(article.content);

  const markdown = [
    '---',
    `URL: ${publicOrigin}/article/${article.slug}`,
    `Title: ${article.title}`,
    `Category: ${categoryName}`,
    '---',
    '',
    plainText,
    '',
  ].join('\n');

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
