'use client';

/**
 * HirnChatPanel — the public Hirn assistant as a slide-over.
 *
 * The chat is `@bitbaum/chatkit` (fleet rule: every chat is chatkit, fixed
 * there and never here): `ChatScreen` lays the conversation out edge to edge
 * with the title row and the composer floating over it, `ChatThread` draws
 * the turns with Copy · Listen · Share under every answer and the one-tap
 * replies under the latest, and `Composer` is the box — growing textarea,
 * Enter sends, Shift+Enter breaks, a microphone with a server leg, Stop
 * while an answer is on its way. evig supplies only the words (the `chat`
 * and `hirn` namespaces) and the page context from
 * src/config/hirn/page-contexts.ts (description, starters, quick links).
 *
 * Messages go to /api/hirn/chat with the current pathname; history is
 * client-held (nothing persisted). Unauthenticated visitors see a login
 * prompt + the context quick actions.
 */

import '@bitbaum/chatkit/styles.css';
import { useEffect, useRef, useState } from 'react';
import {
  ChatScreen,
  ChatStarters,
  ChatThread,
  Composer,
  type ChatMessageData,
} from '@bitbaum/chatkit/react';
import { useTranslations } from 'next-intl';
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
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  const panelRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  // Lock body scroll while open (same pattern as the admin slide-over).
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const newId = (role: ChatMessageData['role']) => `${role}-${++nextId.current}`;

  /**
   * One request. `thread` already ends with the person's turn; the answer —
   * or the failure, with Retry — is appended to it. A failed turn is never
   * sent back as history.
   */
  const ask = async (thread: ChatMessageData[], message: string) => {
    setMessages(thread);
    setBusy(true);
    setStopped(false);
    const controller = new AbortController();
    abortRef.current = controller;

    const fail = (content: string) =>
      setMessages([
        ...thread,
        { id: newId('assistant'), role: 'assistant', content, failed: true },
      ]);

    try {
      // Direct fetch (not apiFetch) so the 429 status is detectable for a
      // localized rate-limit message; CSRF header comes from the shared SSOT.
      const res = await fetch('/api/hirn/chat', {
        method: 'POST',
        headers: withClientCsrfHeader({ 'Content-Type': 'application/json' }, 'POST'),
        signal: controller.signal,
        body: JSON.stringify({
          message,
          pathname,
          history: thread
            .slice(0, -1)
            .filter((m) => !m.failed)
            .slice(-HISTORY_LIMIT)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        fail(t('rateLimited'));
        return;
      }
      if (!res.ok || !data.success || !data.data?.reply) {
        fail(typeof data.error === 'string' ? data.error : t('error'));
        return;
      }

      setMessages([
        ...thread,
        {
          id: newId('assistant'),
          role: 'assistant',
          content: data.data.reply,
          replies: Array.isArray(data.data.replies) ? data.data.replies : [],
        },
      ]);
    } catch {
      if (controller.signal.aborted) {
        setStopped(true);
        return;
      }
      fail(t('error'));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  };

  /** The composer, a starter and a suggested reply all send through here. */
  const send = (text: string) => {
    const message = text.trim();
    if (!message || busy) return false;
    const base = messages.filter((m) => !m.failed);
    void ask([...base, { id: newId('user'), role: 'user', content: message }], message);
    return true;
  };

  /** Retry the last turn from the same question — nothing to retype. */
  const retry = () => {
    if (busy) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const upTo = messages.slice(0, messages.indexOf(lastUser) + 1).filter((m) => !m.failed);
    void ask(upTo, lastUser.content);
  };

  const stop = () => abortRef.current?.abort();

  if (!isOpen) return null;

  const lastMessage = messages[messages.length - 1];
  const quickActions = context.quickActions ?? [];
  const showQuickActionsAfterReply =
    !busy && !stopped && lastMessage?.role === 'assistant' && !lastMessage.failed;

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
          <ChatScreen
            fill="viewport"
            className="hirn-screen"
            header={
              <>
                <span className="ck-glass hirn-glass-title">
                  <Brain className="w-4 h-4 text-action" aria-hidden="true" />
                  <span className="truncate">{t('title')}</span>
                </span>
                <span className="flex-1" />
                {/* eslint-disable-next-line no-restricted-syntax -- chatkit's ck-glass header pill (fleet chat chrome); Button's variant classes would fight it */}
                <button
                  type="button"
                  className="ck-glass"
                  onClick={onClose}
                  aria-label={tCommon('close')}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </>
            }
            composer={
              <Composer
                onSend={(text) => send(text)}
                placeholder={t('inputPlaceholder')}
                ariaLabel={t('inputPlaceholder')}
                sending={busy}
                onStop={stop}
                voice={{ transcribe: transcribeForHirn }}
                labels={labels.composer}
                autoFocus
              />
            }
            footnote={labels.footnote}
          >
            <ChatThread
              messages={messages}
              live={busy ? { status: t('thinking') } : null}
              stopped={stopped}
              onStop={stop}
              onRetry={retry}
              onReply={send}
              share={{ title: t('title') }}
              labels={labels.thread}
              empty={
                <ChatStarters
                  starters={context.suggestions}
                  onPick={send}
                  title={
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
              }
            >
              {showQuickActionsAfterReply && quickActions.length > 0 && (
                <QuickActions actions={quickActions} label={t('quickActionsLabel')} />
              )}
            </ChatThread>
          </ChatScreen>
        )}
      </div>
    </>
  );
}
