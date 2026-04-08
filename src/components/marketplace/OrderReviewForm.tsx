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
import { apiFetch } from '@/lib/api/client'

interface OrderReviewFormProps {
  orderId: string
  onSubmitted?: (review: { reviewId: string; rating: number }) => void
}

export function OrderReviewForm({ orderId, onSubmitted }: OrderReviewFormProps) {
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
      setError('Bitte wähle eine Sternebewertung.')
      return
    }

    const trimmed = content.trim()
    if (trimmed.length > 0 && trimmed.length < 10) {
      setError('dein Kommentar muss mindestens 10 Zeichen enthalten oder leer bleiben.')
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
      setError(result.error || 'Bewertung konnte nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    if (result.data) {
      onSubmitted?.({ reviewId: result.data.reviewId, rating: result.data.rating })
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-green-800 dark:text-green-200">Vielen Dank für deine Bewertung!</h3>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          deine Rückmeldung hilft der Community.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          deine Bewertung
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= (hoverRating || rating)
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} Sterne`}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    filled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            )
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {rating} von 5
            </span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          dein Kommentar <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Wie war deine Erfahrung? Entsprach der Artikel der Beschreibung? Wie war die Kommunikation mit dem Verkäufer?"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          maxLength={5000}
        />
        <p className="text-xs text-gray-400 mt-1">Mindestens 10 Zeichen, wenn du einen Kommentar schreiben.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Würdest du diesen Verkäufer empfehlen?
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recommend
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> Ja, empfehlen
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !recommend
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> Eher nicht
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
        Bewertung absenden
      </button>
    </form>
  )
}

export default OrderReviewForm
