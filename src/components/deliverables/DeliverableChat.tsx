'use client';

/**
 * Context-aware Q&A about a deliverable, powered by Hirn. Posts to the given
 * endpoint (admin `/api/deliverables/[id]/ask` or public
 * `/api/public/share/[token]/ask`), which grounds the answer in the
 * deliverable's own files. Same component both places — only the endpoint
 * (and whether the reader is signed in, for the microphone's server leg)
 * differs.
 *
 * The chat is `@bitbaum/chatkit` (`ChatThread` + `Composer`) inside a card:
 * this one sits in a page beside the files and the feedback, so it is not a
 * whole screen — the thread is a bounded scroller above the composer.
 */

import '@bitbaum/chatkit/styles.css';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChatStarters, ChatThread, Composer, type ChatMessageData } from '@bitbaum/chatkit/react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useChatLabels } from '@/components/chat/useChatLabels';
import { apiFetch } from '@/lib/api/client';
import { transcribeForHirn } from '@/lib/hirn/transcribe-client';

/** Only the newest turns travel; the deliverable re-anchors every call. */
const HISTORY_LIMIT = 8;

export default function DeliverableChat({
  endpoint,
  suggestions = [],
  signedIn = false,
}: {
  endpoint: string;
  suggestions?: string[];
  /**
   * A signed-in reader gets the microphone's server leg (/api/hirn/transcribe
   * needs a session); a visitor on a share link keeps the browser's own
   * recogniser.
   */
  signedIn?: boolean;
}) {
  const t = useTranslations('hirn');
  const labels = useChatLabels();
  const [turns, setTurns] = useState<ChatMessageData[]>([]);
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  const newId = (role: ChatMessageData['role']) => `${role}-${++nextId.current}`;

  async function run(thread: ChatMessageData[], question: string) {
    setTurns(thread);
    setBusy(true);
    setStopped(false);
    const controller = new AbortController();
    abortRef.current = controller;
    const history = thread
      .slice(0, -1)
      .filter((turn) => !turn.failed)
      .slice(-HISTORY_LIMIT)
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await apiFetch<{ reply: string; replies?: string[] }>(endpoint, {
        method: 'POST',
        body: { message: question, history },
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        setStopped(true);
        return;
      }
      setTurns([
        ...thread,
        res.success && res.data
          ? {
              id: newId('assistant'),
              role: 'assistant',
              content: res.data.reply,
              replies: res.data.replies ?? [],
            }
          : {
              id: newId('assistant'),
              role: 'assistant',
              content: res.error || t('error'),
              failed: true,
            },
      ]);
    } catch {
      setTurns([
        ...thread,
        { id: newId('assistant'), role: 'assistant', content: t('error'), failed: true },
      ]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }

  function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return false;
    const base = turns.filter((turn) => !turn.failed);
    void run([...base, { id: newId('user'), role: 'user', content: q }], q);
    return true;
  }

  function retry() {
    if (busy) return;
    const lastUser = [...turns].reverse().find((turn) => turn.role === 'user');
    if (!lastUser) return;
    const upTo = turns.slice(0, turns.indexOf(lastUser) + 1).filter((turn) => !turn.failed);
    void run(upTo, lastUser.content);
  }

  const stop = () => abortRef.current?.abort();

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-text-primary mb-1">
        <Sparkles className="w-4 h-4 text-action" aria-hidden="true" />
        {t('deliverableChat.title')}
      </h2>
      <p className="text-xs text-text-secondary mb-4">{t('deliverableChat.hint')}</p>

      <div className="flex flex-col max-h-96 mb-3">
        <ChatThread
          messages={turns}
          live={busy ? { status: t('thinking') } : null}
          stopped={stopped}
          onStop={stop}
          onRetry={retry}
          onReply={ask}
          share={{ title: t('deliverableChat.title') }}
          labels={labels.thread}
          empty={
            suggestions.length > 0 ? <ChatStarters starters={suggestions} onPick={ask} /> : null
          }
        />
      </div>

      <Composer
        onSend={(text) => ask(text)}
        placeholder={t('deliverableChat.inputPlaceholder')}
        ariaLabel={t('deliverableChat.inputPlaceholder')}
        sending={busy}
        onStop={stop}
        voice={signedIn ? { transcribe: transcribeForHirn } : undefined}
        labels={labels.composer}
        density="compact"
      />
    </Card>
  );
}
