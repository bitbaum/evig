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

    try {
      const res = await fetch('/api/ai/vote-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          background: background || undefined,
          votingMethod,
          options: options?.map(o => ({ label: o.label, description: o.description })),
          question: q.trim(),
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Fehler bei der KI-Analyse')
      } else {
        setAnalysis(json.data.analysis)
        setQuestion('')
      }
    } catch {
      setError('Netzwerkfehler — bitte versuche es erneut')
    } finally {
      setLoading(false)
    }
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
    <div className="rounded-lg border border-indigo-200 bg-indigo-50">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          KI-Beratung — Frag die KI zu dieser Abstimmung
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Quick question chips */}
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => ask(q.question)}
                disabled={loading}
                className="px-2.5 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium hover:bg-indigo-200 disabled:opacity-50 transition-colors touch-manipulation"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Custom question input */}
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stelle eine eigene Frage zu dieser Abstimmung..."
              rows={2}
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-indigo-300 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors self-end touch-manipulation"
              aria-label="Frage stellen"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AI response */}
          {analysis && (
            <div className="bg-white border border-indigo-200 rounded-lg px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-2">
                <Sparkles className="w-3 h-3" />
                KI-Antwort
              </div>
              {analysis}
            </div>
          )}

          <p className="text-xs text-indigo-500">
            Die KI ist unparteiisch und empfiehlt keine Abstimmungsposition. Sie hilft dir, die Entscheidung besser zu verstehen.
          </p>
        </div>
      )}
    </div>
  )
}
