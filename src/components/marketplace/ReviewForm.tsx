'use client'

import { useState } from 'react'
import { Star, Loader2, AlertCircle } from 'lucide-react'

interface ReviewFormProps {
  targetType: string
  targetId: string
  onSubmitted: () => void
  onCancel: () => void
}

export default function ReviewForm({ targetType, targetId, onSubmitted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Bitte wählen Sie eine Bewertung')
      return
    }
    if (content.trim().length < 10) {
      setError('Bewertung muss mindestens 10 Zeichen lang sein')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          overall_rating: rating,
          title: title.trim() || null,
          content: content.trim(),
        }),
      })
      const data = await response.json()

      if (data.success) {
        onSubmitted()
      } else {
        setError(data.error || 'Fehler beim Senden der Bewertung')
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bewertung schreiben</h3>

      {/* Star Rating */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Bewertung <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
              className="p-0.5"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  i < (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
          )}
        </div>
      </div>

      {/* Title (optional) */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Titel <span className="text-xs text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kurze Zusammenfassung"
          maxLength={120}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Bewertung <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Beschreiben Sie Ihre Erfahrung..."
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white resize-y"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Bewertung senden'
          )}
        </button>
      </div>
    </div>
  )
}
