'use client'

import { Star, CheckCircle, MessageCircle } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { type RepairerReview } from './types'
import { StarRating } from './StarRating'
import Heading from '@/components/ui/Heading'

interface ReviewsTabProps {
  reviews: RepairerReview[]
  averageRating: number
  totalReviews: number
  ratingDistribution?: { [key: string]: number }
}

export function ReviewsTab({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
}: ReviewsTabProps) {
  return (
    <div>
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
          <div className="mt-1">
            <StarRating rating={averageRating} size="lg" />
          </div>
          <div className="text-sm text-gray-500 mt-1">{totalReviews} Bewertungen</div>
        </div>

        {ratingDistribution && Object.keys(ratingDistribution).length > 0 && (
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars.toString()] || 0
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-600">{stars}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Noch keine Bewertungen vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.reviewerName}</span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verifiziert
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-sm text-gray-500">
                      {formatDateShort(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {review.title && (
                <Heading level={4} className="font-medium text-gray-900 mb-1">{review.title}</Heading>
              )}

              {review.content && <p className="text-gray-700 text-sm">{review.content}</p>}

              {(review.timeliness_rating ||
                review.quality_rating ||
                review.communication_rating) && (
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  {review.timeliness_rating && (
                    <span>Pünktlichkeit: {review.timeliness_rating}/5</span>
                  )}
                  {review.quality_rating && (
                    <span>Qualität: {review.quality_rating}/5</span>
                  )}
                  {review.communication_rating && (
                    <span>Kommunikation: {review.communication_rating}/5</span>
                  )}
                </div>
              )}

              {review.response && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-900">
                      Antwort von {review.response.responderName}
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm">{review.response.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
