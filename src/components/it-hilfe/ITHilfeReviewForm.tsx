'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import Heading from '@/components/ui/Heading'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/button'

interface ITHilfeReviewFormProps {
  requestId: string
  requestTitle: string
  onSuccess: () => void
}

export function ITHilfeReviewForm({ requestId, requestTitle, onSuccess }: ITHilfeReviewFormProps) {
  const t = useTranslations('itHelp.review')
  const [overallRating, setOverallRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating === 0) {
      setError(t('errorNoRating'))
      return
    }
    if (content.length < 10) {
      setError(t('errorTextTooShort'))
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const { error: apiError } = await apiFetch('/api/reviews', {
        method: 'POST',
        body: {
          targetType: REVIEW_TARGET_TYPES.IT_HILFE,
          targetId: requestId,
          overallRating,
          communicationRating: communicationRating || null,
          qualityRating: qualityRating || null,
          content,
        },
      })

      if (apiError) {
        throw new Error(apiError)
      }

      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorGeneric')
      setError(message)
      logger.error('Error submitting review', { error: err, requestId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card-shell p-6">
      <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-2">{t('heading')}</Heading>
      <p className="text-sm text-neutral-600 mb-4">
        {t('experienceWith', { title: requestTitle })}
      </p>

      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StarRating
          value={overallRating}
          onChange={setOverallRating}
          label={t('overallRating')}
          size="lg"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StarRating
            value={communicationRating}
            onChange={setCommunicationRating}
            label={t('communication')}
            size="lg"
          />
          <StarRating
            value={qualityRating}
            onChange={setQualityRating}
            label={t('quality')}
            size="lg"
          />
        </div>

        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('reviewTextLabel')}
          </label>
          <textarea
            id="review-comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('reviewTextPlaceholder')}
            rows={4}
            minLength={10}
            maxLength={5000}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">{content.length}/5000</p>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={submitting || overallRating === 0 || content.length < 10}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('submittingButton')}
            </>
          ) : (
            t('submitButton')
          )}
        </Button>
      </form>
    </div>
  )
}
