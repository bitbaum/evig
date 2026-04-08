'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Star, Loader2, MessageSquare } from 'lucide-react'
import ReviewForm from './ReviewForm'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'

interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  overallRating: number
  title: string | null
  content: string
  createdAt: string
}

interface ReviewStats {
  average_rating: number | null
  review_count: number
}

interface ListingReviewsProps {
  listingId: string
  sellerId: string
}

export default function ListingReviews({ listingId, sellerId }: ListingReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ average_rating: null, review_count: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const result = await apiFetch<{ reviews: Review[]; stats?: ReviewStats }>(`/api/reviews?targetType=listing&targetId=${listingId}`)
      if (result.success && result.data) {
        const data = result.data
        setReviews(data.reviews || [])
        if (data.stats) {
          setStats(data.stats)
        } else {
          const ratings = (data.reviews || []).map((r: Review) => r.overallRating)
          setStats({
            average_rating: ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
            review_count: ratings.length,
          })
        }
      }
    } catch {
      // Silently fail — reviews are non-critical
    } finally {
      setIsLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const canReview = session?.user?.id && session.user.id !== sellerId
  const hasReviewed = reviews.some(r => r.reviewerId === session?.user?.id)

  const handleReviewSubmitted = () => {
    setShowForm(false)
    fetchReviews()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Bewertungen
          {stats.review_count > 0 && (
            <span className="text-sm font-normal text-gray-500">({stats.review_count})</span>
          )}
        </Heading>

        {stats.average_rating && Number(stats.average_rating) > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-gray-900 dark:text-white">
              {Number(stats.average_rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-4">
          Noch keine Bewertungen für dieses Inserat.
        </p>
      ) : (
        <div className="space-y-4 mb-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {review.reviewerName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.overallRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDateShort(review.createdAt)}
                </span>
              </div>
              {review.title && (
                <Heading level={4} className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {review.title}
                </Heading>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Review Form Toggle */}
      {canReview && !hasReviewed && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Bewertung schreiben
        </button>
      )}

      {showForm && (
        <ReviewForm
          targetType="listing"
          targetId={listingId}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
