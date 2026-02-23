'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, User } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Review {
  id: string
  user_name: string
  rating: number
  feedback: string
  created_at: string
  instance_date: string
}

interface ReviewStats {
  averageRating: number
  reviewCount: number
}

interface WorkshopReviewsProps {
  workshopSlug: string
}

export default function WorkshopReviews({ workshopSlug }: WorkshopReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/workshops/${workshopSlug}/reviews`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.data.reviews)
          setStats(data.data.stats)
        } else {
          setError('Fehler beim Laden der Bewertungen')
        }
      } catch (err) {
        logger.error('Error fetching workshop reviews', { error: err })
        setError('Netzwerkfehler')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [workshopSlug])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  if (stats.reviewCount === 0) {
    return (
      <div className="text-center py-8">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Noch keine Bewertungen</p>
        <p className="text-gray-500 text-sm mt-1">
          Bewertungen erscheinen hier, sobald Teilnehmer Feedback geben.
        </p>
      </div>
    )
  }

  return (
    <div id="feedback">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex gap-0.5 mt-1">
            {renderStars(Math.round(stats.averageRating))}
          </div>
        </div>
        <div className="text-gray-600 text-sm">
          {stats.reviewCount} {stats.reviewCount === 1 ? 'Bewertung' : 'Bewertungen'}
        </div>
      </div>

      {/* Rating Distribution (optional enhancement) */}
      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {review.user_name}
                  </span>
                  <div className="flex gap-0.5">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{review.feedback}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(review.instance_date).toLocaleDateString('de-CH', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
            Alle {reviews.length} Bewertungen anzeigen
          </button>
        </div>
      )}
    </div>
  )
}
