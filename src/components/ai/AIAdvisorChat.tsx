'use client'

/**
 * AIAdvisorChat — shared collapsed "ask the AI about this thing" card.
 *
 * One component for every advisor surface (protocols, tasks, …): quick
 * question chips, a free-text question, one answer at a time. The caller
 * provides the endpoint and the context body; the endpoint returns
 * { analysis: string } (see /api/ai/protocol-advisor, /api/ai/task-advisor).
 */

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export interface AIQuickQuestion {
  label: string
  question: string
}

interface AIAdvisorChatProps {
  /** Header line, e.g. "KI-Assistent — Frag die KI zu diesem Protokoll". */
  heading: string
  /** POST endpoint returning { analysis: string }. */
  endpoint: string
  /** Context fields merged into the request body alongside { question }. */
  buildBody: (question: string) => Record<string, unknown>
  quickQuestions: AIQuickQuestion[]
  placeholder: string
  /** Small-print reminder under the answer area. */
  hint: string
  defaultExpanded?: boolean
}

export function AIAdvisorChat({
  heading,
  endpoint,
  buildBody,
  quickQuestions,
  placeholder,
  hint,
  defaultExpanded = false,
}: AIAdvisorChatProps) {
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

    const result = await apiFetch<{ analysis: string }>(endpoint, {
      method: 'POST',
      body: buildBody(q.trim()),
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
    <div className="rounded-lg border border-info-200 bg-info-50 dark:border-info-500/20 dark:bg-info-500/6">
      <Button
        type="button"
        onClick={() => setExpanded(!expanded)}
        variant="ghost"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-info-900 dark:text-info-200">
          <Sparkles className="w-4 h-4 text-info-600 dark:text-info-400 shrink-0" />
          {heading}
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-info-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-info-500 shrink-0" />
        }
      </Button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q) => (
              <Button
                key={q.label}
                type="button"
                onClick={() => ask(q.question)}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="px-2.5 py-1.5 rounded-full bg-info-100 dark:bg-info-500/12 text-info-700 dark:text-info-300 text-xs font-medium hover:bg-info-200 dark:hover:bg-info-500/18 disabled:opacity-50 transition-colors touch-manipulation"
              >
                {q.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={2}
              disabled={loading}
              className="flex-1 resize-none"
            />
            <Button
              type="button"
              onClick={() => ask(question)}
              disabled={loading || !question.trim()}
              variant="primary"
              className="px-3 py-2 bg-info-600 hover:bg-info-700 disabled:bg-info-300 dark:disabled:bg-info-500/30 text-white rounded-lg transition-colors self-end touch-manipulation"
              aria-label="Frage stellen"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {analysis && (
            <div className="bg-surface-base border border-info-200 dark:border-info-500/20 rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              <div className="flex items-center gap-1.5 text-xs text-info-600 dark:text-info-400 font-medium mb-2">
                <Sparkles className="w-3 h-3" />
                KI-Antwort
              </div>
              {analysis}
            </div>
          )}

          <p className="text-xs text-info-500 dark:text-info-400/70">
            {hint}
          </p>
        </div>
      )}
    </div>
  )
}
