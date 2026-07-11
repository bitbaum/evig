'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Star, MessageSquare } from 'lucide-react'
import ReviewForm from './ReviewForm'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'
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
        // The API returns aggregate stats over ALL reviews (not just this page),
        // so consume them directly instead of averaging the current page.
        setReviews(result.data.reviews || [])
        setStats(result.data.stats ?? { average_rating: null, review_count: 0 })
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
    // Keep the section shell + header stable and show a quiet skeleton instead
    // of a bare spinner, so an empty (usual) section never flashes as "broken".
    return (
      <div className="card-shell p-6">
        <Heading level={2} className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" />
          {t('title')}
        </Heading>
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 w-40 rounded bg-surface-raised animate-pulse" />
          <div className="h-3 w-full rounded bg-surface-raised animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="card-shell p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} className="text-lg font-bold text-text-primary flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('title')}
          {stats.review_count > 0 && (
            <span className="text-sm font-normal text-text-tertiary">({stats.review_count})</span>
          )}
        </Heading>

        {stats.average_rating && Number(stats.average_rating) > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
            <span className="font-bold text-text-primary">
              {Number(stats.average_rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-text-tertiary text-sm py-4">
          {t('empty')}
        </p>
      ) : (
        <div className="space-y-4 mb-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-subtle pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={ROUTES.public.member(review.reviewerId)}
                    className="font-medium text-sm text-text-primary hover:text-action hover:underline"
                  >
                    {review.reviewerName}
                  </Link>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.overallRating
                            ? 'text-warning-400 fill-warning-400'
                            : 'text-text-muted dark:text-text-secondary'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-text-tertiary">
                  {formatDateShort(review.createdAt)}
                </span>
              </div>
              {review.title && (
                <Heading level={4} className="text-sm font-medium text-text-primary mb-1">
                  {review.title}
                </Heading>
              )}
              <p className="text-sm text-text-secondary">{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Review Form Toggle */}
      {canReview && !hasReviewed && !showForm && (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-medium"
        >
          {t('writeReview')}
        </Button>
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
