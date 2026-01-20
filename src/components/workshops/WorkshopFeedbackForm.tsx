'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

interface WorkshopFeedbackFormProps {
  registrationId: string
  workshopTitle: string
  onSuccess?: () => void
}

export default function WorkshopFeedbackForm({
  registrationId,
  workshopTitle,
  onSuccess
}: WorkshopFeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Bitte wählen Sie eine Bewertung')
      return
    }

    if (!feedback.trim()) {
      setError('Bitte geben Sie ein Feedback ein')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/workshops/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedback.trim() })
      })

      if (response.ok) {
        setSubmitted(true)
        onSuccess?.()
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Senden des Feedbacks')
      }
    } catch (err) {
      logger.error('Error submitting workshop feedback', { error: err })
      setError('Netzwerkfehler')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Vielen Dank!</h3>
        <p className="text-gray-600">
          Ihr Feedback für &quot;{workshopTitle}&quot; wurde erfolgreich gesendet.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wie bewerten Sie den Workshop?
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {rating === 1 && 'Unzufrieden'}
            {rating === 2 && 'Weniger zufrieden'}
            {rating === 3 && 'In Ordnung'}
            {rating === 4 && 'Gut'}
            {rating === 5 && 'Ausgezeichnet'}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
          Ihr Feedback
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Was hat Ihnen am Workshop gefallen? Was könnte verbessert werden?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Wird gesendet...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Feedback senden
          </>
        )}
      </button>
    </form>
  )
}
