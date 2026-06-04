'use client'

/**
 * OrderReviewForm
 *
 * Inline review form shown on a completed buyer order.
 * - 5-star rating picker
 * - Optional textarea (min 10 chars if provided)
 * - Empfehlung toggle
 * - Submits to POST /api/marketplace/orders/[id]/review
 */

import { useState } from 'react'
import { Star, Loader2, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api/client'

interface OrderReviewFormProps {
  orderId: string
  onSubmitted?: (review: { reviewId: string; rating: number }) => void
}

export function OrderReviewForm({ orderId, onSubmitted }: OrderReviewFormProps) {
  const t = useTranslations('marketplace.review')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [recommend, setRecommend] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating < 1 || rating > 5) {
      setError(t('errorNoRatingOrder'))
      return
    }

    const trimmed = content.trim()
    if (trimmed.length > 0 && trimmed.length < 10) {
      setError(t('errorCommentTooShort'))
      return
    }

    setSubmitting(true)
    const result = await apiFetch<{ reviewId: string; rating: number; orderId: string }>(
      `/api/marketplace/orders/${orderId}/review`,
      {
        method: 'POST',
        body: { rating, content: trimmed, recommend },
      },
    )
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || t('errorSaveFailed'))
      return
    }

    setSuccess(true)
    if (result.data) {
      onSubmitted?.({ reviewId: result.data.reviewId, rating: result.data.rating })
    }
  }

  if (success) {
    return (
      <div className="bg-action-muted border border-strong rounded-xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-action mx-auto mb-2" />
        <Heading level={3} className="font-semibold text-action-text">{t('successHeading')}</Heading>
        <p className="text-sm text-action mt-1">
          {t('successDesc')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {t('yourRatingLabel')}
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= (hoverRating || rating)
            return (
              <button
                key={n}
                type="button"
                aria-label={t('starAriaLabel', { stars: n })}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    filled
                      ? 'fill-warning-400 text-warning-400'
                      : 'text-text-muted dark:text-text-secondary'
                  }`}
                />
              </button>
            )
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm text-text-secondary">
              {t('ratingDisplay', { rating })}
            </span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {t('yourCommentLabel')} <span className="text-text-muted font-normal">{t('titleOptional')}</span>
        </label>
        <Textarea
          id="review-content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('orderContentPlaceholder')}
          maxLength={5000}
        />
        <p className="text-xs text-text-muted mt-1">{t('contentHint')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {t('recommendLabel')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recommend
                ? 'bg-action text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> {t('recommendYes')}
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !recommend
                ? 'bg-error-600 text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> {t('recommendNo')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={submitting || rating === 0}
        className="w-full"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
        {t('submitButton')}
      </Button>
    </form>
  )
}
