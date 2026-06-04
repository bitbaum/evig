'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Textarea } from '@/components/ui/textarea'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface ProtocolAIChatProps {
  title: string
  notes: StructuredNotes
  defaultExpanded?: boolean
}

const QUICK_QUESTIONS = [
  { label: 'Was wurde entschieden?', question: 'Was sind die wichtigsten Entscheidungen dieser Sitzung?' },
  { label: 'Welche Aufgaben wurden vergeben?', question: 'Welche Aufgaben wurden vergeben und wer ist zuständig?' },
  { label: 'Was ist das Wichtigste?', question: 'Was ist das wichtigste Ergebnis dieser Sitzung in einem Satz?' },
  { label: 'Was sind die nächsten Schritte?', question: 'Was sind die nächsten konkreten Schritte nach dieser Sitzung?' },
]

export function ProtocolAIChat({ title, notes, defaultExpanded = false }: ProtocolAIChatProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState('')

  async function ask(q: string) {
    if (!q.trim() || loading) return
    setLoading(true)
    setError('')
    setAnalysis('')

    const result = await apiFetch<{ analysis: string }>('/api/ai/protocol-advisor', {
      method: 'POST',
      body: {
        title,
        summary: notes.summary,
        topics: notes.topics?.map(t => ({
          title: t.title,
          discussion: t.discussion,
          outcome: t.outcome,
        })),
        actionItems: notes.action_items?.map(a => ({
          description: a.description,
          assigned_to_name: a.assigned_to_name,
          item_type: a.item_type,
        })),
        question: q.trim(),
      },
    })

    if (!result.success || !result.data) {
      setError(result.error || 'Fehler bei der KI-Analyse')
    } else {
      setAnalysis(result.data.analysis)
      setQuestion('')
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(question)
    }
  }

  return (
    <div className="rounded-lg border border-info-200 bg-info-50 dark:border-info-500/20 dark:bg-info-500/[0.06]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-info-900 dark:text-info-200">
          <Sparkles className="w-4 h-4 text-info-600 dark:text-info-400 flex-shrink-0" />
          KI-Assistent — Frag die KI zu diesem Protokoll
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-info-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-info-500 flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => ask(q.question)}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-full bg-info-100 dark:bg-info-500/[0.12] text-info-700 dark:text-info-300 text-xs font-medium hover:bg-info-200 dark:hover:bg-info-500/[0.18] disabled:opacity-50 transition-colors touch-manipulation"
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stelle eine eigene Frage zu diesem Protokoll..."
              rows={2}
              disabled={loading}
              className="flex-1 resize-none"
            />
            <button
              type="button"
              onClick={() => ask(question)}
              disabled={loading || !question.trim()}
              className="px-3 py-2 bg-info-600 hover:bg-info-700 disabled:bg-info-300 dark:disabled:bg-info-500/30 text-white rounded-lg transition-colors self-end touch-manipulation"
              aria-label="Frage stellen"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {analysis && (
            <div className="bg-white dark:bg-neutral-800/50 border border-info-200 dark:border-info-500/20 rounded-lg px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
              <div className="flex items-center gap-1.5 text-xs text-info-600 dark:text-info-400 font-medium mb-2">
                <Sparkles className="w-3 h-3" />
                KI-Antwort
              </div>
              {analysis}
            </div>
          )}

          <p className="text-xs text-info-500 dark:text-info-400/70">
            Die KI antwortet basierend auf dem Protokollinhalt — prüfe wichtige Punkte immer im Protokoll selbst.
          </p>
        </div>
      )}
    </div>
  )
}
