'use client'

import { useState } from 'react'
import { Star, Loader2, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ConfirmReviewCardProps {
  requestTitle: string
  submitting: boolean
  onSubmit: (params: { rating: number; reviewText: string; recommended: boolean }) => void
}

/**
 * Prominent card shown to the requester after the helper marks a request
 * as completed. Collects a star rating, optional review text, and a
 * recommend yes/no answer, then submits them together.
 */
export function ConfirmReviewCard({
  requestTitle,
  submitting,
  onSubmit,
}: ConfirmReviewCardProps) {
  const t = useTranslations('itHelp.review')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [recommended, setRecommended] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating < 1) {
      setError(t('errorNoStars'))
      return
    }
    if (recommended === null) {
      setError(t('errorNoRecommend'))
      return
    }
    if (reviewText && reviewText.trim().length > 0 && reviewText.trim().length < 10) {
      setError(t('errorTextTooShort'))
      return
    }

    onSubmit({ rating, reviewText: reviewText.trim(), recommended })
  }

  return (
    <div className="bg-action-muted rounded-xl border-2 border-strong p-6">
      <div className="flex items-start gap-3 mb-4">
        <CheckCircle className="w-6 h-6 text-action shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <Heading level={3} className="text-lg font-semibold text-text-primary">
            {t('confirmHeading')}
          </Heading>
          <p className="text-sm text-text-secondary mt-1">
            {t('confirmDescription', { requestTitle })}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-3 mb-4 text-sm text-error-700 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('overallRating')}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                variant="ghost"
                size="icon"
                className="p-2 rounded-sm"
                aria-label={t('starAriaLabel', { count: star })}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hover || rating)
                      ? 'fill-warning-400 text-warning-400'
                      : 'text-text-muted'
                  }`}
                />
              </Button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div>
          <label htmlFor="confirm-review-text" className="block text-sm font-medium text-text-secondary mb-1">
            {t('reviewTextOptionalLabel')}
          </label>
          <Textarea
            id="confirm-review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={t('reviewTextOptionalPlaceholder')}
            rows={4}
            maxLength={5000}
          />
          <p className="text-xs text-text-tertiary mt-1">{reviewText.length}/5000</p>
        </div>

        {/* Recommend */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('recommendLabel')}
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setRecommended(true)}
              variant="outline"
              className={`flex-1 py-3 px-4 min-h-touch font-medium border-2 ${
                recommended === true
                  ? 'bg-action text-white border-action'
                  : 'bg-surface-base text-text-secondary border-default hover:border-action'
              }`}
            >
              {t('recommendYes')}
            </Button>
            <Button
              type="button"
              onClick={() => setRecommended(false)}
              variant="outline"
              className={`flex-1 py-3 px-4 min-h-touch font-medium border-2 ${
                recommended === false
                  ? 'bg-error-600 text-white border-error-600'
                  : 'bg-surface-base text-text-secondary border-default hover:border-error-400'
              }`}
            >
              {t('recommendNo')}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={submitting || rating < 1 || recommended === null}
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
