'use client'

/**
 * VoteAIAdvisor — AI consultation panel for voters.
 *
 * Appears on both admin/dashboard voting pages and the public /vote/[id] page.
 * Lets voters ask the AI about what a decision means, what the implications are,
 * and how the voting method works — before casting their vote.
 */

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { VOTING_ADVISOR_PROMPTS } from '@/lib/ai/config/prompts'

interface Option {
  label: string
  description?: string
}

interface VoteAIAdvisorProps {
  title: string
  description: string
  background?: string | null
  votingMethod: string
  options?: Option[]
  /** Start expanded. Defaults to false so it doesn't push the ballot below the fold on mobile. */
  defaultExpanded?: boolean
}

export function VoteAIAdvisor({
  title,
  description,
  background,
  votingMethod,
  options,
  defaultExpanded = false,
}: VoteAIAdvisorProps) {
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

    const result = await apiFetch<{ analysis: string }>('/api/ai/vote-advisor', {
      method: 'POST',
      body: {
        title,
        description,
        background: background || undefined,
        votingMethod,
        options: options?.map(o => ({ label: o.label, description: o.description })),
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

  function handleSubmit() {
    ask(question)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const quickQuestions = Object.values(VOTING_ADVISOR_PROMPTS.quickQuestions)

  return (
    <div className="rounded-lg border border-info-200 bg-info-50 dark:bg-info-900/20">
      {/* Header */}
      <Button
        type="button"
        onClick={() => setExpanded(!expanded)}
        variant="ghost"
        className="w-full justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-info-900">
          <Sparkles className="w-4 h-4 text-info-600 shrink-0" />
          KI-Beratung — Frag die KI zu dieser Abstimmung
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-info-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-info-500 shrink-0" />
        }
      </Button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Quick question chips */}
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q) => (
              <Button
                key={q.label}
                type="button"
                onClick={() => ask(q.question)}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="px-2.5 py-1.5 rounded-full bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 text-xs font-medium hover:bg-info-200 dark:hover:bg-info-900/40 touch-manipulation"
              >
                {q.label}
              </Button>
            ))}
          </div>

          {/* Custom question input */}
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stelle eine eigene Frage zu dieser Abstimmung..."
              rows={2}
              disabled={loading}
              className="flex-1 resize-none"
            />
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              variant="primary"
              size="icon"
              className="bg-info-600 hover:bg-info-700 disabled:bg-info-300 text-white self-end touch-manipulation"
              aria-label="Frage stellen"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-error-50 dark:bg-error-900/20 border border-error-200 text-error-700 dark:text-error-400 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AI response */}
          {analysis && (
            <div className="bg-surface-base border border-info-200 rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              <div className="flex items-center gap-1.5 text-xs text-info-600 font-medium mb-2">
                <Sparkles className="w-3 h-3" />
                KI-Antwort
              </div>
              {analysis}
            </div>
          )}

          <p className="text-xs text-info-500">
            Die KI ist unparteiisch und empfiehlt keine Abstimmungsposition. Sie hilft dir, die Entscheidung besser zu verstehen.
          </p>
        </div>
      )}
    </div>
  )
}
