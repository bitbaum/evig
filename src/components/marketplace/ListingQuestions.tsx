'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Loader2, MessageCircleQuestion, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort } from '@/lib/date-formats'
import { LISTING_QUESTION_STATUS } from '@/config/marketplace'

interface ListingQuestion {
  id: string
  question: string
  answer: string | null
  status: string
  created_at: string
  answered_at: string | null
  asker_id: string
  asker_name: string
  can_answer: boolean
}

interface ListingQuestionsProps {
  listingId: string
  sellerId: string
}

export default function ListingQuestions({ listingId, sellerId }: ListingQuestionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const t = useTranslations('marketplace.questions')

  const [questions, setQuestions] = useState<ListingQuestion[]>([])
  const [canAsk, setCanAsk] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAskForm, setShowAskForm] = useState(false)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [answeringId, setAnsweringId] = useState<string | null>(null)

  const isOwner = session?.user?.id === sellerId

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiFetch<{
        questions: ListingQuestion[]
        can_ask: boolean
      }>(`/api/listings/${listingId}/questions`)

      if (result.success && result.data) {
        setQuestions(result.data.questions)
        setCanAsk(result.data.can_ask)
      }
    } catch {
      // Non-critical — section stays empty
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    void loadQuestions()
  }, [loadQuestions])

  const handleAsk = async () => {
    if (!newQuestion.trim() || submitting) return

    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await apiFetch<{ id: string }>(`/api/listings/${listingId}/questions`, {
      method: 'POST',
      body: { question: newQuestion.trim() },
    })

    if (result.success) {
      setNewQuestion('')
      setShowAskForm(false)
      await loadQuestions()
    } else {
      setError(result.error || t('errorAsk'))
    }

    setSubmitting(false)
  }

  const handleAnswer = async (questionId: string) => {
    const answer = answerDrafts[questionId]?.trim()
    if (!answer || answeringId) return

    setAnsweringId(questionId)
    setError(null)

    const result = await apiFetch<void>(
      `/api/listings/${listingId}/questions/${questionId}/answer`,
      { method: 'POST', body: { answer } },
    )

    if (result.success) {
      setAnswerDrafts((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
      await loadQuestions()
    } else {
      setError(result.error || t('errorAnswer'))
    }

    setAnsweringId(null)
  }

  const visibleCount = questions.filter(
    (q) => q.status === LISTING_QUESTION_STATUS.ANSWERED || (isOwner && q.status === LISTING_QUESTION_STATUS.OPEN),
  ).length

  return (
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg text-text-primary mb-1 flex items-center gap-2">
        <MessageCircleQuestion className="w-5 h-5 text-text-muted" aria-hidden="true" />
        {t('title')}
        {visibleCount > 0 && (
          <span className="text-sm font-normal text-text-tertiary">({visibleCount})</span>
        )}
      </Heading>
      <p className="text-sm text-text-tertiary mb-4">{t('subtitle')}</p>

      {loading ? (
        // Quiet skeleton, not a "…loading" text — this section is usually empty
        // and sits below the fold, so an alarming spinner reads as "broken".
        <div className="space-y-2 py-2" aria-hidden="true">
          <div className="h-3 w-40 rounded bg-surface-raised animate-pulse" />
          <div className="h-3 w-full rounded bg-surface-raised animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {questions.length === 0 && !canAsk && !isOwner && (
            <p className="text-sm text-text-tertiary">{t('emptyPublic')}</p>
          )}

          {questions.map((q) => (
            <div key={q.id} className="border border-subtle rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">
                  {q.asker_name} · {formatDateShort(q.created_at)}
                  {q.status === LISTING_QUESTION_STATUS.OPEN && (
                    <span className="ml-2 text-warning-600">{t('awaitingAnswer')}</span>
                  )}
                </p>
                <p className="text-sm text-text-primary font-medium">{q.question}</p>
              </div>

              {q.answer ? (
                <div className="bg-surface-raised rounded-lg p-3 border border-subtle">
                  <p className="text-xs text-text-muted mb-1">{t('sellerAnswer')}</p>
                  <p className="text-sm text-text-secondary whitespace-pre-line">{q.answer}</p>
                  {q.answered_at && (
                    <p className="text-xs text-text-muted mt-2">{formatDateShort(q.answered_at)}</p>
                  )}
                </div>
              ) : q.can_answer ? (
                <div className="space-y-2">
                  <Textarea
                    value={answerDrafts[q.id] || ''}
                    onChange={(e) =>
                      setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    onInput={(e) =>
                      setAnswerDrafts((prev) => ({
                        ...prev,
                        [q.id]: (e.target as HTMLTextAreaElement).value,
                      }))
                    }
                    placeholder={t('answerPlaceholder')}
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={answeringId === q.id || !(answerDrafts[q.id]?.trim())}
                    onClick={() => void handleAnswer(q.id)}
                    className="gap-2"
                  >
                    {answeringId === q.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="w-4 h-4" aria-hidden="true" />
                    )}
                    {t('submitAnswer')}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}

          {canAsk && (
            <div className="border-t border-subtle pt-4">
              {showAskForm ? (
                <div className="space-y-3">
                  <Textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder={t('askPlaceholder')}
                    rows={3}
                    className="resize-none"
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      disabled={submitting || newQuestion.trim().length < 5}
                      onClick={() => void handleAsk()}
                      className="flex-1 gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <HelpCircle className="w-4 h-4" aria-hidden="true" />
                      )}
                      {t('submitQuestion')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAskForm(false)
                        setNewQuestion('')
                        setError(null)
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full gap-2" onClick={() => setShowAskForm(true)}>
                  <HelpCircle className="w-4 h-4" aria-hidden="true" />
                  {t('askButton')}
                </Button>
              )}
            </div>
          )}

          {isOwner && questions.length === 0 && (
            <p className="text-sm text-text-tertiary">{t('emptyOwner')}</p>
          )}

          {error && (
            <p className="text-sm text-error-600" role="alert">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
