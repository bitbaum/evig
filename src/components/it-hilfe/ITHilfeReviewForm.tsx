'use client'

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import Heading from '@/components/ui/Heading'

interface ITHilfeReviewFormProps {
  requestId: string
  requestTitle: string
  onSuccess: () => void
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (rating: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ITHilfeReviewForm({ requestId, requestTitle, onSuccess }: ITHilfeReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating === 0) {
      setError('Bitte gib eine Gesamtbewertung ab')
      return
    }
    if (content.length < 10) {
      setError('Der Bewertungstext muss mindestens 10 Zeichen lang sein')
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
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      logger.error('Error submitting review', { error: err, requestId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Heading level={3} className="text-lg font-semibold text-gray-900 mb-2">Bewertung abgeben</Heading>
      <p className="text-sm text-gray-600 mb-4">
        Wie war deine Erfahrung mit &quot;{requestTitle}&quot;?
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StarRating
          value={overallRating}
          onChange={setOverallRating}
          label="Gesamtbewertung *"
        />

        <div className="grid grid-cols-2 gap-4">
          <StarRating
            value={communicationRating}
            onChange={setCommunicationRating}
            label="Kommunikation"
          />
          <StarRating
            value={qualityRating}
            onChange={setQualityRating}
            label="Qualität"
          />
        </div>

        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
            Dein Erfahrungsbericht *
          </label>
          <textarea
            id="review-comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Beschreibe deine Erfahrung (min. 10 Zeichen)..."
            rows={4}
            minLength={10}
            maxLength={5000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">{content.length}/5000</p>
        </div>

        <button
          type="submit"
          disabled={submitting || overallRating === 0 || content.length < 10}
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
