'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';
import { SuggestedReplies } from '@/components/hirn/SuggestedReplies';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  /** Suggested next messages (assistant only) — never sent back as history. */
  replies?: string[];
  /** An error shown in the thread — not something Hirn said, so never history. */
  failed?: boolean;
}

/**
 * Context-aware Q&A about a deliverable, powered by Hirn. Posts to the given
 * endpoint (admin `/api/deliverables/[id]/ask` or public
 * `/api/public/share/[token]/ask`), which grounds the answer in the
 * deliverable's own files. Same component both places — only the endpoint differs.
 */
export default function DeliverableChat({
  endpoint,
  suggestions = [],
}: {
  endpoint: string;
  suggestions?: string[];
}) {
  const t = useTranslations('hirn');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const history = turns
      .filter((turn) => !turn.failed)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));
    setTurns((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setBusy(true);

    const res = await apiFetch<{ reply: string; replies?: string[] }>(endpoint, {
      method: 'POST',
      body: { message: q, history },
    });

    setTurns((prev) => [
      ...prev,
      res.success && res.data
        ? { role: 'assistant', content: res.data.reply, replies: res.data.replies ?? [] }
        : { role: 'assistant', content: res.error || t('error'), failed: true },
    ]);
    setBusy(false);
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-text-primary mb-1">
        <Sparkles className="w-4 h-4 text-action" />
        {t('deliverableChat.title')}
      </h2>
      <p className="text-xs text-text-secondary mb-4">{t('deliverableChat.hint')}</p>

      {turns.length > 0 && (
        <div ref={scrollRef} className="max-h-80 overflow-y-auto space-y-3 mb-3 pr-1">
          {turns.map((turn, i) => (
            <div key={i} className={turn.role === 'user' ? 'text-right' : 'text-left'}>
              <div
                className={`inline-block rounded-lg px-3 py-2 text-sm text-left max-w-[85%] ${
                  turn.role === 'user'
                    ? 'bg-action text-action-text whitespace-pre-wrap'
                    : 'bg-surface-raised text-text-primary'
                }`}
              >
                {turn.role === 'user' ? (
                  turn.content
                ) : (
                  <div className="space-y-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-action [&_a]:underline">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ className, children }) => {
                          const isBlock = (className ?? '').includes('language-');
                          return isBlock ? (
                            <code className="block bg-surface-overlay text-text-primary rounded-md p-2.5 my-2 text-xs font-mono overflow-x-auto whitespace-pre">
                              {children}
                            </code>
                          ) : (
                            <code className="bg-surface-overlay rounded px-1 py-0.5 text-xs font-mono">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => <pre className="my-0">{children}</pre>,
                      }}
                    >
                      {turn.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {turn.role === 'assistant' && i === turns.length - 1 && !busy && (
                <SuggestedReplies replies={turn.replies} onPick={ask} />
              )}
            </div>
          ))}
          {busy && (
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-surface-raised text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin" /> {t('thinking')}
              </div>
            </div>
          )}
        </div>
      )}

      {turns.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
            <Button
              key={s}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => ask(s)}
              className="text-xs rounded-full text-text-secondary hover:text-action"
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('deliverableChat.inputPlaceholder')}
          className="flex-1 min-w-0 border rounded-md px-3 py-2 text-sm bg-surface-base focus:outline-none focus:ring-2 focus:ring-action/40"
        />
        <Button
          type="submit"
          variant="primary"
          size="icon"
          disabled={busy || !input.trim()}
          className="shrink-0"
          aria-label={t('deliverableChat.send')}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </Card>
  );
}
