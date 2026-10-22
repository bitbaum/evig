'use client';

/**
 * HirnChat — the staff Hirn chat (full page at /admin/hirn, compact in the
 * slide-over). The chat is `@bitbaum/chatkit`: `ChatScreen` + `ChatThread` +
 * `Composer`, the fleet's one chat. evig adds what is evig's through chatkit's
 * slots: the action cards Hirn proposes (`renderFooter`), the provider line,
 * the page-context starters, and the translated words.
 */

import '@bitbaum/chatkit/styles.css';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChatScreen,
  ChatStarters,
  ChatThread,
  Composer,
  type ChatMessageData,
} from '@bitbaum/chatkit/react';
import { useTranslations } from 'next-intl';
import { Bot, Sparkles, Trash2, Rocket, TriangleAlert } from 'lucide-react';
import Heading from '@/components/admin/AdminHeading';
import { Button } from '@/components/ui/button';
import { useChatLabels } from '@/components/chat/useChatLabels';
import { apiFetch } from '@/lib/api/client';
import { usePathname } from 'next/navigation';
import { resolveHirnContext } from '@/config/hirn/page-contexts';
import { logger } from '@/lib/logger';
import { ORG } from '@/config/org';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { transcribeForHirn } from '@/lib/hirn/transcribe-client';

interface HirnActionCard {
  id: string;
  type: 'create_task' | 'create_decision_draft' | 'create_protocol_draft' | 'navigate';
  title: string;
  summary: string;
  cta: string;
  risky: boolean;
  payload: Record<string, unknown>;
}

/** A turn, plus what evig keeps beside it (never sent back as history). */
interface Message extends ChatMessageData {
  model?: string;
  provider?: string;
  actions?: HirnActionCard[];
}

interface HirnChatProps {
  sessionId: string;
  onSessionChange?: () => void;
  /** Compact mode for slide-over panel — the panel has its own header. */
  compact?: boolean;
}

export function HirnChat({ sessionId, onSessionChange, compact = false }: HirnChatProps) {
  const t = useTranslations('admin.hirn.chat');
  const labels = useChatLabels();
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [pendingClear, setPendingClear] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  // Load chat history on mount or session change
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const result = await apiFetch<
          {
            id: string;
            role: string;
            content: string;
            replies?: string[];
          }[]
        >(`/api/admin/hirn/history?sessionId=${encodeURIComponent(sessionId)}`);
        if (result.success && result.data) {
          setMessages(
            result.data.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              replies: m.replies,
            })),
          );
        }
      } catch {
        // New session, no history
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [sessionId]);

  const pathname = usePathname();
  // Page context (SSOT: config/hirn/page-contexts) — tells Hirn what the
  // staff member is currently looking at + seeds the empty-state starters.
  const pageContext = resolveHirnContext(pathname ?? '/admin', 'admin');
  // Starters are UI → localized via admin.hirnContexts.<area>.sN, config German fallback.
  const tCtx = useTranslations('admin.hirnContexts');
  const localizedSuggestions = pageContext.suggestions.map((fallback, i) => {
    const key = `${pageContext.area}.s${i}`;
    return tCtx.has(key as never) ? tCtx(key as never) : fallback;
  });

  const newId = (role: ChatMessageData['role']) => `${role}-${Date.now()}-${++nextId.current}`;

  /** One request: `thread` ends with the person's turn; the answer or the
   *  failure (with Retry) is appended. The server holds the history. */
  const ask = async (thread: Message[], content: string) => {
    setMessages(thread);
    setBusy(true);
    setStopped(false);
    setError('');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await apiFetch<{
        content: string;
        replies?: string[];
        model?: string;
        provider?: string;
        actions?: HirnActionCard[];
      }>('/api/admin/hirn/chat', {
        method: 'POST',
        body: { message: content, sessionId, pathname: pathname ?? undefined },
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        setStopped(true);
        return;
      }
      if (!result.success) {
        throw new Error(result.error || t('errorSendDefault'));
      }

      const responseData = result.data!;
      setMessages([
        ...thread,
        {
          id: newId('assistant'),
          role: 'assistant',
          content: responseData.content || t('errorEmptyResponse'),
          model: responseData.model || undefined,
          provider: responseData.provider || undefined,
          actions: responseData.actions || [],
          replies: responseData.replies || [],
        },
      ]);
    } catch (err) {
      setMessages([
        ...thread,
        {
          id: newId('assistant'),
          role: 'assistant',
          content: err instanceof Error ? err.message : t('errorUnknown'),
          failed: true,
        },
      ]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  };

  // One send path for the composer, the starters and the suggested replies,
  // so a tapped reply is exactly a typed one.
  const send = (text: string) => {
    const content = text.trim();
    if (!content || busy) return false;
    const base = messages.filter((m) => !m.failed);
    void ask([...base, { id: newId('user'), role: 'user', content }], content);
    return true;
  };

  const retry = () => {
    if (busy) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const upTo = messages.slice(0, messages.indexOf(lastUser) + 1).filter((m) => !m.failed);
    void ask(upTo, lastUser.content);
  };

  const stop = () => abortRef.current?.abort();

  const clearSession = () => setPendingClear(true);

  const doClearSession = async () => {
    try {
      await apiFetch<void>(`/api/admin/hirn/history?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      setMessages([]);
      setStopped(false);
      onSessionChange?.();
    } catch (err) {
      logger.warn('Failed to delete Hirn chat session', { error: err });
      setError(t('errorDelete'));
    }
  };

  const executeAction = useCallback(
    async (action: HirnActionCard) => {
      setError('');

      // Navigate actions just redirect — no API call needed
      if (action.type === 'navigate') {
        const url = typeof action.payload.url === 'string' ? action.payload.url : '/admin';
        window.location.href = url;
        return;
      }

      try {
        const result = await apiFetch<{ entity?: { link?: string } }>(
          '/api/admin/hirn/actions/execute',
          {
            method: 'POST',
            body: {
              actionId: action.id,
              actionType: action.type,
              payload: action.payload,
              dryRun: false,
            },
          },
        );

        if (!result.success) throw new Error(result.error || t('errorActionDefault'));

        const link = result.data?.entity?.link;
        if (link) {
          window.location.href = link;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errorActionDefault'));
      }
    },
    [t],
  );

  /** What evig shows under an answer: the proposed actions and the provider. */
  const renderFooter = (m: ChatMessageData) => {
    const message = m as Message;
    if (message.role !== 'assistant' || message.failed) return null;
    const actions = message.actions ?? [];
    if (actions.length === 0 && !message.model) return null;
    return (
      <div className="mt-3 space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="card-shell p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                <p className="text-xs text-text-secondary mt-1">{action.summary}</p>
              </div>
              {action.risky && (
                <TriangleAlert className="w-4 h-4 text-warning-500 shrink-0" aria-hidden="true" />
              )}
            </div>
            <Button
              type="button"
              onClick={() => executeAction(action)}
              variant="primary"
              size="sm"
              className="mt-3"
            >
              <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
              {action.cta}
            </Button>
          </div>
        ))}
        {message.model && (
          <p className="text-xs text-text-muted">
            via {message.provider}/{message.model}
          </p>
        )}
      </div>
    );
  };

  const header = compact ? undefined : (
    <>
      <span className="ck-glass hirn-glass-title">
        <Bot className="w-4 h-4 text-action" aria-hidden="true" />
        <span className="truncate">{t('title')}</span>
      </span>
      <span className="flex-1" />
      {messages.length > 0 && (
        // eslint-disable-next-line no-restricted-syntax -- chatkit's ck-glass header pill (fleet chat chrome); Button's variant classes would fight it
        <button type="button" className="ck-glass" onClick={clearSession}>
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          {t('clear')}
        </button>
      )}
    </>
  );

  return (
    <>
      <ChatScreen
        fill="parent"
        className="hirn-screen"
        header={header}
        composer={
          <>
            {error && (
              <p className="ck-failed" role="alert">
                {error}
              </p>
            )}
            <Composer
              onSend={(text) => send(text)}
              placeholder={t('inputPlaceholder')}
              ariaLabel={t('inputPlaceholder')}
              sending={busy}
              onStop={stop}
              voice={{ transcribe: transcribeForHirn }}
              labels={labels.composer}
              density={compact ? 'compact' : 'comfortable'}
            />
          </>
        }
        footnote={labels.footnote}
      >
        <ChatThread
          messages={messages}
          loading={loadingHistory}
          live={busy ? { status: labels.thread.working } : null}
          stopped={stopped}
          onStop={stop}
          onRetry={retry}
          onReply={send}
          renderFooter={renderFooter}
          share={{ title: t('title') }}
          labels={labels.thread}
          empty={
            <ChatStarters
              starters={localizedSuggestions}
              onPick={send}
              title={
                <div className="flex flex-col items-center gap-2 text-center">
                  <Sparkles className="w-12 h-12 text-action" aria-hidden="true" />
                  <Heading level={3} className="text-lg font-medium text-text-primary">
                    {t('welcomeTitle')}
                  </Heading>
                  <p className="text-sm text-text-tertiary max-w-md">
                    {t('welcomeBody', { orgName: ORG.name })}
                  </p>
                </div>
              }
            />
          }
        />
      </ChatScreen>

      <ConfirmDialog
        isOpen={pendingClear}
        title={t('confirmDeleteTitle')}
        message={t('confirmDeleteMessage')}
        onConfirm={() => {
          setPendingClear(false);
          doClearSession();
        }}
        onClose={() => setPendingClear(false)}
      />
    </>
  );
}
