'use client';

/**
 * HirnChat — the staff Hirn chat (full page at /admin/hirn, compact in the
 * slide-over). The whole app is `@bitbaum/chatkit`'s `ChatApp`: header, chat
 * list, New chat, rename, delete, thread and composer. evig adds only what is
 * evig's: the transport to /api/admin/hirn/chat, the store over Hirn's
 * per-session history (src/lib/hirn/conversation-store.ts), the action cards
 * Hirn proposes and the provider line (`thread.renderFooter`), the
 * page-context starters, and the translated words.
 *
 * Temporary chats are off: the chat route writes every turn to the history
 * itself, so a chat that "is never saved" would be a promise this server
 * cannot keep. Attachments are off: the route takes a message and nothing else.
 */

import '@bitbaum/chatkit/styles.css';
import { useCallback, useState } from 'react';
import { ChatApp, ChatTurnError, type ChatTransport } from '@bitbaum/chatkit/react';
import type { ChatMessageData } from '@bitbaum/chatkit/react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, Rocket, TriangleAlert } from 'lucide-react';
import Heading from '@/components/admin/AdminHeading';
import { Button } from '@/components/ui/button';
import { useChatLabels } from '@/components/chat/useChatLabels';
import { apiFetch } from '@/lib/api/client';
import { usePathname } from 'next/navigation';
import { resolveHirnContext } from '@/config/hirn/page-contexts';
import { ORG } from '@/config/org';
import { transcribeForHirn } from '@/lib/hirn/transcribe-client';
import { hirnConversationStore } from '@/lib/hirn/conversation-store';

interface HirnActionCard {
  id: string;
  type: 'create_task' | 'create_decision_draft' | 'create_protocol_draft' | 'navigate';
  title: string;
  summary: string;
  cta: string;
  risky: boolean;
  payload: Record<string, unknown>;
}

/** An answer, plus what evig keeps beside it (never sent back as history). */
interface HirnAnswer extends ChatMessageData {
  model?: string;
  provider?: string;
  actions?: HirnActionCard[];
}

interface HirnChatProps {
  /** Compact mode for the slide-over: tighter composer, the list always a drawer. */
  compact?: boolean;
}

const store = hirnConversationStore();

/** Each surface reopens its own chat after a reload or after the panel closes. */
const REMEMBER_KEY = { page: 'evig-hirn-admin', panel: 'evig-hirn-admin-panel' } as const;

export function HirnChat({ compact = false }: HirnChatProps) {
  const t = useTranslations('admin.hirn.chat');
  const labels = useChatLabels();
  const locale = useLocale();
  const [actionError, setActionError] = useState('');

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

  const transport: ChatTransport = async (turn) => {
    setActionError('');
    const result = await apiFetch<{
      content: string;
      replies?: string[];
      model?: string;
      provider?: string;
      actions?: HirnActionCard[];
    }>('/api/admin/hirn/chat', {
      method: 'POST',
      body: {
        message: turn.text,
        sessionId: turn.conversationId ?? turn.chatId,
        pathname: pathname ?? undefined,
      },
      signal: turn.signal,
    });
    if (!result.success || !result.data) {
      throw new ChatTurnError(result.error || t('errorSendDefault'));
    }
    const data = result.data;
    const answer: Omit<HirnAnswer, 'id' | 'role'> = {
      content: data.content || t('errorEmptyResponse'),
      replies: data.replies ?? [],
      model: data.model || undefined,
      provider: data.provider || undefined,
      actions: data.actions ?? [],
    };
    return answer;
  };

  const executeAction = useCallback(
    async (action: HirnActionCard) => {
      setActionError('');

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
        setActionError(err instanceof Error ? err.message : t('errorActionDefault'));
      }
    },
    [t],
  );

  /** What evig shows under an answer: the proposed actions and the provider. */
  const renderFooter = (m: ChatMessageData) => {
    const message = m as HirnAnswer;
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
              className="mt-3 min-h-11"
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

  return (
    <ChatApp
      fill="parent"
      className="hirn-screen"
      name={t('title')}
      store={store}
      transport={transport}
      rememberKey={compact ? REMEMBER_KEY.panel : REMEMBER_KEY.page}
      // The slide-over is a 28rem panel: the list is always its drawer, never
      // a rail beside the chat (a media query that never matches).
      railQuery={compact ? 'not all' : undefined}
      temporaryChats={false}
      placeholder={t('inputPlaceholder')}
      labels={labels.app}
      locale={locale}
      footnote={labels.footnote}
      composer={{
        ariaLabel: t('inputPlaceholder'),
        // /api/admin/hirn/chat takes a message and no files.
        attach: false,
        voice: { transcribe: transcribeForHirn },
        labels: labels.composer,
        density: compact ? 'compact' : 'comfortable',
      }}
      thread={{
        labels: labels.thread,
        share: { title: t('title') },
        renderFooter,
        after: actionError ? (
          <p className="ck-failed" role="alert">
            {actionError}
          </p>
        ) : null,
      }}
      starters={localizedSuggestions}
      startersTitle={
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
  );
}
