import { useEffect, useMemo, useRef, useState } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { Icon } from './ui/icon';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface SearchHit {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category_id: string | null;
  category_name: string;
  content_preview: string;
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  categories: Category[];
  isDark: boolean;
  primaryColor: string;
  aiEnabled?: boolean;
  onAskAI?: (query: string) => void;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function localFallback(query: string, articles: Article[], categories: Category[]): SearchHit[] {
  const lowered = query.toLowerCase();

  return articles
    .filter((article) => {
      const haystack = `${article.title} ${article.content}`.toLowerCase();
      return haystack.includes(lowered);
    })
    .slice(0, 8)
    .map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: '',
      category_id: article.category_id,
      category_name: categories.find((category) => category.id === article.category_id)?.name || 'General',
      content_preview: stripHtml(article.content).slice(0, 220),
      url: `/article/${article.slug}`,
    }));
}

export function SearchModal({
  isOpen,
  onClose,
  articles,
  categories,
  isDark,
  primaryColor,
  aiEnabled,
  onAskAI,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }

    if (!isOpen) {
      setQuery('');
      setResults([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=8`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`);
        }

        const payload = await response.json();
        setResults(Array.isArray(payload.hits) ? payload.hits : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn('Search endpoint unavailable, falling back to local search:', error);
        setResults(localFallback(trimmed, articles, categories));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [articles, categories, isOpen, query]);

  const showAiButton = useMemo(() => aiEnabled && query.trim(), [aiEnabled, query]);

  const handleAskAI = () => {
    if (!query.trim() || !onAskAI) return;

    const url = new URL(window.location.href);
    url.searchParams.set('ai_query', query.trim());
    window.history.pushState({}, '', url.toString());

    onAskAI(query);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          'relative w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl',
          isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white',
        )}
      >
        <div className={cn('flex items-center gap-3 border-b px-4', isDark ? 'border-zinc-800' : 'border-zinc-100')}>
          <Icon icon="hugeicons:search-01" className={cn('h-5 w-5', isDark ? 'text-zinc-500' : 'text-zinc-400')} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles or ask AI..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.shiftKey && aiEnabled && query.trim()) {
                event.preventDefault();
                handleAskAI();
              }
            }}
            className={cn(
              'flex-1 border-0 bg-transparent py-4 text-base outline-none',
              isDark ? 'text-white placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400',
            )}
          />

          {aiEnabled && (
            <button
              onClick={handleAskAI}
              disabled={!query.trim()}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium',
                query.trim()
                  ? 'text-white'
                  : isDark
                    ? 'bg-zinc-800 text-zinc-500'
                    : 'bg-zinc-100 text-zinc-400',
              )}
              style={query.trim() ? { backgroundColor: primaryColor } : {}}
            >
              <Icon icon="hugeicons:magic-wand-01" width={14} height={14} />
              Ask AI
            </button>
          )}

          <kbd
            className={cn(
              'hidden items-center gap-1 rounded px-2 py-1 text-xs font-medium sm:inline-flex',
              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500',
            )}
          >
            ESC
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-auto p-2">
          {!query.trim() ? (
            <div className={cn('px-3 py-8 text-center', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
              <Icon icon="hugeicons:search-01" className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p className="text-sm">Start typing to search articles</p>
              {aiEnabled && <p className="mt-2 text-xs">or ask AI for help</p>}
            </div>
          ) : isLoading ? (
            <div className={cn('px-3 py-8 text-center', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
              <p className="text-sm">Searching…</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {showAiButton && (
                <button
                  onClick={handleAskAI}
                  className={cn(
                    'mb-2 flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-3 py-3 text-left',
                    isDark
                      ? 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  <div className="rounded-lg p-1.5" style={{ backgroundColor: `${primaryColor}20` }}>
                    <Icon icon="hugeicons:magic-wand-01" width={16} height={16} style={{ color: primaryColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium', isDark ? 'text-white' : 'text-zinc-900')}>Ask AI: "{query}"</p>
                    <p className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-400')}>Get an AI-powered answer</p>
                  </div>
                  <Icon icon="hugeicons:arrow-right-01" className={cn('h-4 w-4 flex-shrink-0', isDark ? 'text-zinc-600' : 'text-zinc-300')} />
                </button>
              )}

              {results.map((article) => (
                <a
                  key={article.id}
                  href={`${getBasePath()}${article.url}`}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left',
                    isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50',
                  )}
                >
                  <Icon
                    icon="hugeicons:file-02"
                    width={16}
                    height={16}
                    className={cn('mt-0.5 flex-shrink-0', isDark ? 'text-zinc-500' : 'text-zinc-400')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium', isDark ? 'text-white' : 'text-zinc-900')}>{article.title}</p>
                    <p className={cn('mt-1 text-xs', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
                      {article.category_name}
                    </p>
                    {(article.excerpt || article.content_preview) && (
                      <p className={cn('mt-1 line-clamp-2 text-sm', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
                        {article.excerpt || article.content_preview}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className={cn('px-3 py-8 text-center', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
              <p className="text-sm">No results found</p>
              {aiEnabled && <p className="mt-2 text-xs">Shift + Enter sends it to AI</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
