/**
 * HirnChatPanel — the public Hirn assistant as a slide-over.
 *
 * The whole chat is `@bitbaum/chatkit`'s `ChatApp` (fleet rule: every chat is
 * chatkit, fixed there and never here): header, chat list, New chat,
 * Temporary chat, rename and delete, the thread and the composer. evig
 * supplies the transport to /api/hirn/chat (current pathname, the newest
 * turns as history), the words (the `chat` and `hirn` namespaces) and the
 * page context from src/config/hirn/page-contexts.ts (description, starters,
 * quick links). Unauthenticated visitors see a login prompt + the context
 * quick actions instead.
 *
 * The server keeps no history for this route, so the chats live on this
 * device (`localConversationStore`) and a temporary chat is simply one that
 * is not written. Attachments are off: the route takes a message and nothing
 * else.
 */

import '@bitbaum/chatkit/styles.css';
import { useEffect } from 'react';
import { ChatApp, ChatTurnError, type ChatTransport } from '@bitbaum/chatkit/react';
import { localConversationStore } from '@bitbaum/chatkit';
import { useLocale, useTranslations } from 'next-intl';
import { Brain, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Heading from '@/components/ui/Heading';
import { Button } from '@/components/ui/button';
import { useChatLabels } from '@/components/chat/useChatLabels';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { withClientCsrfHeader } from '@/lib/api/csrf-client';
import { transcribeForHirn } from '@/lib/hirn/transcribe-client';
import { ORG } from '@/config/org';
import { ROUTES } from '@/config/routes';
import type { HirnPageContext } from '@/config/hirn/page-contexts';

interface HirnChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: HirnPageContext;
  pathname: string;
  isAuthenticated: boolean;
}

/** Only the newest turns travel; the page context re-anchors every call. */
const HISTORY_LIMIT = 10;

/** The context's links, as one row of equal pills (44px targets). */
function QuickActions({
  actions,
  label,
}: {
  actions: NonNullable<HirnPageContext['quickActions']>;
  label: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label={label}>
      {actions.map((action) => (
        <Button
          key={action.href}
          as={Link}
          href={action.href}
          variant="outline"
          size="sm"
          className="min-h-11 rounded-full"
        >
          {action.label}
        </Button>
      ))}
    </nav>
  );
}

const store = localConversationStore({ key: 'evig-hirn-public' });

export function HirnChatPanel({
  isOpen,
  onClose,
  context,
  pathname,
  isAuthenticated,
}: HirnChatPanelProps) {
  const t = useTranslations('hirn');
  const tCommon = useTranslations('common');
  const labels = useChatLabels();
  const locale = useLocale();

  // Escape closes the panel — except when it is closing the chat list, which
  // is a native dialog inside the panel and takes the same key.
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen, () => {
    if (panelRef.current?.querySelector('dialog[open]')) return;
    onClose();
  });

  // Lock body scroll while open (same pattern as the admin slide-over).
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const transport: ChatTransport = async (turn) => {
    // Direct fetch (not apiFetch) so the 429 status is detectable for a
    // localized rate-limit message; CSRF header comes from the shared SSOT.
    const res = await fetch('/api/hirn/chat', {
      method: 'POST',
      headers: withClientCsrfHeader({ 'Content-Type': 'application/json' }, 'POST'),
      signal: turn.signal,
      body: JSON.stringify({
        message: turn.text,
        pathname,
        history: turn.history.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 429) throw new ChatTurnError(t('rateLimited'), { kind: 'rate-limit' });
    if (!res.ok || !data.success || !data.data?.reply) {
      throw new ChatTurnError(typeof data.error === 'string' ? data.error : t('error'));
    }
    return {
      content: data.data.reply,
      replies: Array.isArray(data.data.replies) ? data.data.replies : [],
    };
  };

  if (!isOpen) return null;

  const quickActions = context.quickActions ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-surface-page flex flex-col focus:outline-none"
      >
        {!isAuthenticated ? (
          <>
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <span className="ck-glass hirn-glass-title">
                <Brain className="w-4 h-4 text-action" aria-hidden="true" />
                {t('title')}
              </span>
              {/* eslint-disable-next-line no-restricted-syntax -- chatkit's ck-glass header pill (fleet chat chrome); Button's variant classes would fight it */}
              <button
                type="button"
                className="ck-glass"
                onClick={onClose}
                aria-label={tCommon('close')}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <Brain className="w-10 h-10 text-action" aria-hidden="true" />
              <p className="text-sm text-text-secondary max-w-xs">
                {t('loginPrompt', { orgName: ORG.name })}
              </p>
              <Button as={Link} href={ROUTES.public.login} variant="primary">
                {t('loginCta')}
              </Button>
              {quickActions.length > 0 && (
                <QuickActions actions={quickActions} label={t('quickActionsLabel')} />
              )}
            </div>
          </>
        ) : (
          // The visual viewport, not the panel: on a phone the keyboard
          // shrinks it, and the composer rides on top of the keyboard.
          <ChatApp
            fill="viewport"
            className="hirn-screen"
            name={t('title')}
            store={store}
            transport={transport}
            rememberKey="evig-hirn-public-open"
            // The panel is 28rem wide: the list is its drawer, never a rail.
            railQuery="not all"
            placeholder={t('inputPlaceholder')}
            labels={labels.app}
            locale={locale}
            footnote={labels.footnote}
            // Anything that is not a ChatTurnError (offline, a dropped
            // connection) says the same thing it always did.
            failureMessage={() => t('error')}
            headerEnd={
              // eslint-disable-next-line no-restricted-syntax -- chatkit's ck-glass header pill (fleet chat chrome); Button's variant classes would fight it
              <button
                type="button"
                className="ck-glass"
                onClick={onClose}
                aria-label={tCommon('close')}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            }
            composer={{
              ariaLabel: t('inputPlaceholder'),
              // /api/hirn/chat takes a message and no files.
              attach: false,
              voice: { transcribe: transcribeForHirn },
              labels: labels.composer,
              autoFocus: true,
            }}
            thread={{
              labels: labels.thread,
              share: { title: t('title') },
              // The context's links follow the newest answer, not every one.
              renderFooter: (m, { isLatest }) =>
                isLatest && !m.failed && quickActions.length > 0 ? (
                  <QuickActions actions={quickActions} label={t('quickActionsLabel')} />
                ) : null,
            }}
            starters={context.suggestions}
            startersTitle={
              <div className="flex flex-col items-center gap-3 text-center">
                <Brain className="w-10 h-10 text-action" aria-hidden="true" />
                <div>
                  <Heading level={3} className="text-base font-medium text-text-primary">
                    {t('emptyTitle')}
                  </Heading>
                  <p className="text-sm text-text-tertiary mt-1">{t('emptyHint')}</p>
                </div>
                {quickActions.length > 0 && (
                  <QuickActions actions={quickActions} label={t('quickActionsLabel')} />
                )}
              </div>
            }
          />
        )}
      </div>
    </>
  );
}
