import { useEffect, useState } from 'react';
import { Icon } from '../ui/icon';
import { cn } from '@/lib/utils';

interface ArticleFeedbackProps {
  articleId: string;
  projectId: string;
  isDark?: boolean;
  compact?: boolean;
  horizontal?: boolean;
}

type FeedbackValue = 'helpful' | 'not_helpful';

const FEEDBACK_API_BASE = '/api/feedback';

export function ArticleFeedback({
  articleId,
  projectId,
  isDark = false,
  compact = false,
  horizontal = false,
}: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFeedback(null);
    setSubmitted(false);
    setIsSubmitting(false);
    setErrorMessage(null);

    const storedFeedback = localStorage.getItem(`article_feedback_${articleId}`);
    if (storedFeedback === 'helpful' || storedFeedback === 'not_helpful') {
      setFeedback(storedFeedback);
      setSubmitted(true);
    }
  }, [articleId]);

  useEffect(() => {
    if (!articleId || !projectId) {
      return;
    }

    const viewKey = `article_view_${articleId}`;
    if (sessionStorage.getItem(viewKey)) {
      return;
    }

    fetch(`${FEEDBACK_API_BASE}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, projectId }),
    }).catch((error) => {
      console.error('Failed to record article view:', error);
    });

    sessionStorage.setItem(viewKey, 'true');
  }, [articleId, projectId]);

  const handleFeedback = async (isHelpful: boolean) => {
    if (submitted || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const feedbackType: FeedbackValue = isHelpful ? 'helpful' : 'not_helpful';

    try {
      const response = await fetch(`${FEEDBACK_API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          projectId,
          helpful: isHelpful,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Feedback could not be saved.');
      }

      const storedValue = payload?.vote === 'not_helpful' ? 'not_helpful' : feedbackType;
      setFeedback(storedValue);
      setSubmitted(true);
      localStorage.setItem(`article_feedback_${articleId}`, storedValue);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setErrorMessage('Could not save feedback right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonClassName = cn(
    'flex items-center gap-1.5 rounded-lg border text-xs transition-colors',
    compact ? 'px-3 py-1.5' : 'px-4 py-2',
    isDark
      ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
    isSubmitting && 'cursor-not-allowed opacity-50',
  );

  const renderSubmittedState = (message: string) => (
    <div className="flex items-center gap-1.5">
      <Icon icon="hugeicons:checkmark-01" className="h-3.5 w-3.5 text-green-500" />
      <span className={cn(compact ? 'text-xs' : 'text-sm', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
        {message}
      </span>
    </div>
  );

  const renderButtons = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleFeedback(true)}
        disabled={isSubmitting}
        className={buttonClassName}
        type="button"
      >
        <Icon icon="hugeicons:thumbs-up" className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span className={compact ? 'text-xs' : 'text-sm'}>Yes</span>
      </button>
      <button
        onClick={() => handleFeedback(false)}
        disabled={isSubmitting}
        className={buttonClassName}
        type="button"
      >
        <Icon icon="hugeicons:thumbs-down" className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span className={compact ? 'text-xs' : 'text-sm'}>No</span>
      </button>
    </div>
  );

  if (compact) {
    if (horizontal) {
      return (
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={cn('text-xs font-medium whitespace-nowrap', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
              Was this helpful?
            </p>
            {errorMessage && (
              <p className="mt-1 text-[11px] text-red-500">
                {errorMessage}
              </p>
            )}
          </div>
          {submitted ? renderSubmittedState('Thanks!') : renderButtons()}
        </div>
      );
    }

    return (
      <div>
        <p className={cn('mb-3 text-xs font-medium', isDark ? 'text-zinc-400' : 'text-zinc-500')}>
          Was this helpful?
        </p>
        {submitted ? renderSubmittedState('Thanks!') : renderButtons()}
        {errorMessage && <p className="mt-2 text-[11px] text-red-500">{errorMessage}</p>}
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className={cn('mt-8 border-t pt-6', isDark ? 'border-zinc-700' : 'border-zinc-200')}>
        <div className="flex w-full items-center justify-between gap-3">
          {submitted ? (
            renderSubmittedState('Thanks for your feedback!')
          ) : (
            <>
              <div>
                <p className={cn('text-sm font-medium', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
                  Was this article helpful?
                </p>
                {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
              </div>
              {renderButtons()}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mt-8 border-t pt-6', isDark ? 'border-zinc-700' : 'border-zinc-200')}>
      <div className="flex flex-col gap-3">
        {submitted ? (
          renderSubmittedState('Thanks for your feedback!')
        ) : (
          <>
            <p className={cn('text-sm font-medium', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
              Was this article helpful?
            </p>
            {renderButtons()}
            {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
          </>
        )}
      </div>
    </div>
  );
}
