'use client'

import { useState } from 'react'
import { Star, Loader2, CheckCircle } from 'lucide-react'
import Heading from '@/components/ui/Heading'

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
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [recommended, setRecommended] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating < 1) {
      setError('Bitte wähle eine Sternebewertung aus')
      return
    }
    if (recommended === null) {
      setError('Bitte gib an, ob du den Helfer weiterempfehlen würdest')
      return
    }
    if (reviewText && reviewText.trim().length > 0 && reviewText.trim().length < 10) {
      setError('Der Bewertungstext muss mindestens 10 Zeichen lang sein')
      return
    }

    onSubmit({ rating, reviewText: reviewText.trim(), recommended })
  }

  return (
    <div className="bg-emerald-50 rounded-xl shadow-sm border-2 border-emerald-300 p-6">
      <div className="flex items-start gap-3 mb-4">
        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <Heading level={3} className="text-lg font-semibold text-gray-900">
            Hilfe abgeschlossen - bitte bewerten Sie
          </Heading>
          <p className="text-sm text-gray-700 mt-1">
            Der Helfer hat &quot;{requestTitle}&quot; als abgeschlossen markiert.
            Bestätige die Hilfe und hinterlasse eine kurze Bewertung.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gesamtbewertung *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
                aria-label={`${star} Sterne`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hover || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div>
          <label htmlFor="confirm-review-text" className="block text-sm font-medium text-gray-700 mb-1">
            Dein Erfahrungsbericht (optional)
          </label>
          <textarea
            id="confirm-review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Wie war deine Erfahrung? (optional, min. 10 Zeichen)"
            rows={4}
            maxLength={5000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          />
          <p className="text-xs text-gray-500 mt-1">{reviewText.length}/5000</p>
        </div>

        {/* Recommend */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Würdest du diesen Helfer weiterempfehlen? *
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecommended(true)}
              className={`flex-1 py-3 px-4 min-h-[44px] rounded-lg font-medium border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                recommended === true
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
              }`}
            >
              Ja, gerne
            </button>
            <button
              type="button"
              onClick={() => setRecommended(false)}
              className={`flex-1 py-3 px-4 min-h-[44px] rounded-lg font-medium border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                recommended === false
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
              }`}
            >
              Nein
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || rating < 1 || recommended === null}
          className="w-full py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            'Bewertung abgeben'
          )}
        </button>
      </form>
    </div>
  )
}
