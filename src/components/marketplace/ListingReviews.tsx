'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Star, Loader2, MessageSquare } from 'lucide-react'
import ReviewForm from './ReviewForm'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'
import { REVIEW_TARGET_TYPES } from '@/config/database'

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
  const t = useTranslations('components.listingReviews')
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ average_rating: null, review_count: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const result = await apiFetch<{ reviews: Review[]; stats?: ReviewStats }>(`/api/reviews?targetType=${REVIEW_TARGET_TYPES.LISTING}&targetId=${listingId}`)
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
        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="card-shell p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('title')}
          {stats.review_count > 0 && (
            <span className="text-sm font-normal text-neutral-500">({stats.review_count})</span>
          )}
        </Heading>

        {stats.average_rating && Number(stats.average_rating) > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
            <span className="font-bold text-neutral-900 dark:text-white">
              {Number(stats.average_rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 text-sm py-4">
          {t('empty')}
        </p>
      ) : (
        <div className="space-y-4 mb-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-neutral-100 dark:border-neutral-700 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-neutral-900 dark:text-white">
                    {review.reviewerName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.overallRating
                            ? 'text-warning-400 fill-warning-400'
                            : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-neutral-500">
                  {formatDateShort(review.createdAt)}
                </span>
              </div>
              {review.title && (
                <Heading level={4} className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                  {review.title}
                </Heading>
              )}
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Review Form Toggle */}
      {canReview && !hasReviewed && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 px-4 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          {t('writeReview')}
        </button>
      )}

      {showForm && (
        <ReviewForm
          targetType={REVIEW_TARGET_TYPES.LISTING}
          targetId={listingId}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
