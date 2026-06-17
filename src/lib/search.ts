import { Meilisearch } from 'meilisearch';
import { articles, categories } from '@/data/index';
import searchDocuments from '@/data/generated/eidentic-search.json';

export interface SearchHit {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category_id: string | null;
  category_name: string;
  content_preview: string;
  url: string;
}

interface SearchOptions {
  limit?: number;
}

interface SearchDocument extends SearchHit {
  content_text: string;
}

const fallbackDocuments: SearchDocument[] =
  Array.isArray(searchDocuments) && searchDocuments.length > 0
    ? (searchDocuments as SearchDocument[])
    : articles
        .filter((article) => article.is_published)
        .map((article) => {
          const category = categories.find((item) => item.id === article.category_id);
          const contentText = stripHtml(article.content);
          return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || '',
            category_id: article.category_id,
            category_name: category?.name || 'General',
            content_text: contentText,
            content_preview: contentText.slice(0, 420),
            url: `/article/${article.slug}`,
          };
        });

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMeiliConfig() {
  const host = import.meta.env.MEILISEARCH_HOST;
  const apiKey = import.meta.env.MEILISEARCH_SEARCH_API_KEY || import.meta.env.MEILISEARCH_ADMIN_API_KEY;
  const index = import.meta.env.MEILISEARCH_INDEX || 'eidentic_docs';

  if (!host || !apiKey) {
    return null;
  }

  return { host, apiKey, index };
}

function toSearchHit(document: SearchDocument): SearchHit {
  return {
    id: document.id,
    title: document.title,
    slug: document.slug,
    excerpt: document.excerpt,
    category_id: document.category_id,
    category_name: document.category_name,
    content_preview: document.content_preview,
    url: document.url,
  };
}

function localSearch(query: string, options: SearchOptions = {}) {
  const limit = options.limit ?? 8;
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);

  const scored = fallbackDocuments
    .map((document) => {
      const haystack = `${document.title} ${document.excerpt} ${document.category_name} ${document.content_text}`.toLowerCase();
      const score = words.reduce((sum, word) => {
        if (document.title.toLowerCase().includes(word)) return sum + 8;
        if (document.excerpt.toLowerCase().includes(word)) return sum + 4;
        return sum + (haystack.split(word).length - 1);
      }, 0);

      return { document, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => toSearchHit(item.document));
}

export async function searchHelpArticles(query: string, options: SearchOptions = {}): Promise<SearchHit[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const limit = options.limit ?? 8;
  const meili = getMeiliConfig();

  if (!meili) {
    return localSearch(trimmedQuery, { limit });
  }

  try {
    const client = new Meilisearch({
      host: meili.host,
      apiKey: meili.apiKey,
    });

    const result = await client.index<SearchDocument>(meili.index).search(trimmedQuery, {
      limit,
      attributesToRetrieve: [
        'id',
        'title',
        'slug',
        'excerpt',
        'category_id',
        'category_name',
        'content_preview',
        'url',
      ],
    });

    return result.hits.map((hit: Partial<SearchDocument> & Pick<SearchDocument, 'id' | 'title' | 'slug'>) =>
      toSearchHit({
        id: hit.id,
        title: hit.title,
        slug: hit.slug,
        excerpt: hit.excerpt || '',
        category_id: hit.category_id ?? null,
        category_name: hit.category_name || 'General',
        content_preview: hit.content_preview || '',
        url: hit.url || `/article/${hit.slug}`,
        content_text: '',
      }),
    );
  } catch (error) {
    console.warn('Meilisearch unavailable, falling back to local search:', error);
    return localSearch(trimmedQuery, { limit });
  }
}
