import { useState } from 'react';
import { Icon } from '../ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn, getBasePath } from '@/lib/utils';

interface CopyDropdownProps {
  article: {
    title: string;
    content: string;
    category_id: string | null;
    slug?: string;
  };
  categoryName: string;
  articleUrl: string;
  chatgptLink: string;
  claudeLink: string;
  isDark: boolean;
  primaryColor: string;
  projectId: string;
  allArticles?: Array<{
    id: string;
    title: string;
    content: string;
    category_id: string | null;
    slug: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

type AssistantProvider = 'chatgpt' | 'claude';

const PROMPT_URL_MAX_LENGTH = 3500;
const PROMPT_CLIPBOARD_MAX_LENGTH = 12000;

export function CopyDropdown({
  article,
  categoryName,
  articleUrl,
  chatgptLink,
  claudeLink,
  isDark,
  allArticles = [],
}: CopyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getLiveArticleUrl = () => {
    if (typeof window === 'undefined') {
      return articleUrl;
    }

    return window.location.href;
  };

  const getArticleMarkdownUrl = () => {
    if (typeof window === 'undefined') {
      return article.slug ? `${articleUrl.replace(/\/$/, '')}.txt` : `${articleUrl}.txt`;
    }

    const basePath = getBasePath();
    const slug = article.slug || '';
    return `${window.location.origin}${basePath}/article/${slug}.txt`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const stripHtml = (html: string) =>
    html
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, text) => {
        const prefix = '#'.repeat(Number(level));
        return `\n${prefix} ${text}\n`;
      })
      .replace(/<pre[^>]*data-language="([^"]+)"[^>]*>[\s\S]*?<code>([\s\S]*?)<\/code><\/pre>/gi, (_match, language, code) => {
        const cleanCode = decodeHtmlEntities(
          code
            .replace(/<\/span>/gi, '')
            .replace(/<span[^>]*>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n'),
        ).trim();
        return `\n\`\`\`${language}\n${cleanCode}\n\`\`\`\n`;
      })
      .replace(/<pre[^>]*>[\s\S]*?<code>([\s\S]*?)<\/code><\/pre>/gi, (_match, code) => {
        const cleanCode = decodeHtmlEntities(
          code
            .replace(/<\/span>/gi, '')
            .replace(/<span[^>]*>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n'),
        ).trim();
        return `\n\`\`\`\n${cleanCode}\n\`\`\`\n`;
      })
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_match, code) => `\`${decodeHtmlEntities(code)}\``)
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const decodeHtmlEntities = (value: string) =>
    value
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ');

  const buildMarkdown = () => {
    const currentArticleUrl = getLiveArticleUrl();
    const cleanContent = stripHtml(article.content);
    return `---\nURL: ${currentArticleUrl}\nTitle: ${article.title}\nCategory: ${categoryName}\n---\n\n${cleanContent}`;
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const copyAsMarkdown = async () => {
    await copyText(buildMarkdown());
    setIsOpen(false);
    showToast('Markdown copied');
  };

  const buildAssistantPrompt = (maxLength: number) => {
    const markdown = buildMarkdown();
    const trimmedMarkdown =
      markdown.length > maxLength
        ? `${markdown.slice(0, maxLength).trim()}\n\n[Content truncated for share link]`
        : markdown;

    return [
      'Use this Eidentic documentation page as context.',
      'Answer questions using the page first, and mention the source URL when helpful.',
      '',
      trimmedMarkdown,
    ].join('\n');
  };

  const buildAssistantUrl = (baseUrl: string, provider: AssistantProvider, prompt: string) => {
    const placeholderPattern = /\{\{?\s*prompt\s*\}?\}/i;

    if (placeholderPattern.test(baseUrl)) {
      return baseUrl.replace(placeholderPattern, encodeURIComponent(prompt));
    }

    try {
      const url = new URL(baseUrl);
      const hostname = url.hostname.toLowerCase();

      if (provider === 'chatgpt' && (hostname.includes('chatgpt.com') || hostname.includes('openai.com'))) {
        url.searchParams.set('q', prompt);
      }

      if (provider === 'claude' && hostname.includes('claude.ai')) {
        url.searchParams.set('q', prompt);
      }

      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  const openInAssistant = async (provider: AssistantProvider) => {
    const promptForClipboard = buildAssistantPrompt(PROMPT_CLIPBOARD_MAX_LENGTH);
    const promptForUrl = buildAssistantPrompt(PROMPT_URL_MAX_LENGTH);
    const baseUrl = provider === 'chatgpt' ? chatgptLink : claudeLink;
    const destinationUrl = buildAssistantUrl(baseUrl, provider, promptForUrl);
    const providerLabel = provider === 'chatgpt' ? 'ChatGPT' : 'Claude';

    try {
      await copyText(promptForClipboard);
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      showToast(`${providerLabel} prompt copied`);
    } catch {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      showToast(`${providerLabel} opened`);
    }

    setIsOpen(false);
  };

  const viewFullPageMarkdown = () => {
    window.open(getArticleMarkdownUrl(), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const viewAllArticlesMarkdown = () => {
    const basePath = getBasePath();
    const allArticlesUrl = `${window.location.origin}${basePath}/articles.txt`;
    window.open(allArticlesUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const directButtonStyle =
    isDark
      ? 'border-zinc-800/70 bg-zinc-900/70 text-white hover:bg-zinc-900'
      : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50';

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'group inline-flex h-10 items-center overflow-hidden rounded-xl border text-sm font-medium shadow-sm transition-colors',
              directButtonStyle,
            )}
            aria-label="Copy article options"
          >
            <div
              className="flex h-full items-center gap-2 px-3 transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                void copyAsMarkdown();
              }}
            >
              <Icon
                icon={toastMessage ? 'hugeicons:checkmark-01' : 'hugeicons:copy-01'}
                className={cn('h-3.5 w-3.5', toastMessage && 'text-green-500')}
              />
              <span>{toastMessage ? 'Copied!' : 'Copy as Markdown'}</span>
            </div>

            <div className="flex h-full items-center border-l border-border/50 px-2 transition-colors">
              <Icon icon="hugeicons:arrow-down-01" className="h-3 w-3" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuItem
            onClick={() => {
              void copyAsMarkdown();
            }}
            className="flex cursor-pointer items-center gap-2 p-1.5"
          >
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon icon="hugeicons:copy-01" className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Copy page</p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={viewFullPageMarkdown}
            className="flex cursor-pointer items-center gap-2 p-1.5"
          >
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon icon="hugeicons:file-view" className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">View as Markdown</p>
            </div>
          </DropdownMenuItem>

          {allArticles.length > 0 && (
            <DropdownMenuItem
              onClick={viewAllArticlesMarkdown}
              className="flex cursor-pointer items-center gap-2 p-1.5"
            >
              <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon icon="hugeicons:file-02" className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">View all articles</p>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => {
              void openInAssistant('chatgpt');
            }}
            className="flex cursor-pointer items-center gap-2 p-1.5"
          >
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon icon="simple-icons:openai" className="h-4 w-4" />
            </div>
            <div className="flex flex-1 items-center justify-between text-left">
              <p className="text-sm font-medium">Open in ChatGPT</p>
              <Icon icon="hugeicons:arrow-up-right-01" className="h-3 w-3 opacity-50" />
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              void openInAssistant('claude');
            }}
            className="flex cursor-pointer items-center gap-2 p-1.5"
          >
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon icon="hugeicons:claude" className="h-4 w-4" />
            </div>
            <div className="flex flex-1 items-center justify-between text-left">
              <p className="text-sm font-medium">Open in Claude</p>
              <Icon icon="hugeicons:arrow-up-right-01" className="h-3 w-3 opacity-50" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg',
            isDark ? 'bg-zinc-800 text-white' : 'border border-zinc-200 bg-white text-zinc-900',
          )}
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
