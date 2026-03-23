'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { type RepairerProfile, type RepairerReview } from './types'
import { StarRating } from './StarRating'

interface RepairerReviewsModalProps {
  repairer: RepairerProfile
  reviews: RepairerReview[]
  onClose: () => void
}

export function RepairerReviewsModal({
  repairer,
  reviews,
  onClose,
}: RepairerReviewsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Bewertungen für {repairer.business_name || 'Reparateur'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={repairer.average_rating} />
                <span className="ml-1 text-sm text-gray-600">
                  {(repairer.average_rating ?? 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-600">
                  ({repairer.total_reviews} Bewertungen)
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Noch keine Bewertungen vorhanden.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {review.reviewerName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verifizierter Kauf
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDateShort(review.createdAt)}
                    </span>
                  </div>

                  <div className="mb-2">
                    <StarRating rating={review.rating} size="sm" />
                  </div>

                  {review.title && (
                    <h4 className="font-medium text-gray-900 mb-2">
                      {review.title}
                    </h4>
                  )}

                  {review.content && (
                    <p className="text-gray-700 text-sm mb-3">
                      {review.content}
                    </p>
                  )}

                  {review.response && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-900">
                          Antwort von {review.response.responderName}
                        </span>
                        <span className="text-xs text-blue-600">
                          {formatDateShort(review.response.createdAt)}
                        </span>
                      </div>
                      <p className="text-blue-800 text-sm">
                        {review.response.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {repairer.total_reviews > 5 && (
            <div className="text-center mt-6">
              <Link
                href={`/repairers/${repairer.id}`}
                className="text-green-600 hover:text-green-700 font-medium"
                onClick={onClose}
              >
                Alle {repairer.total_reviews} Bewertungen anzeigen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
