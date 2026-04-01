'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateShort } from '@/lib/date-formats'
import {
  type ReviewStatus,
  REVIEW_STATUS,
  getReviewStatusLabel,
  getReviewStatusBadgeColor,
  getReviewFilterLabel,
  getReviewActionLabel,
} from '@/config/review-status'
import { apiFetch } from '@/lib/api/client'
import {
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Filter,
  Search,
  ArrowLeft,
  Flag,
  RefreshCw
} from 'lucide-react'

interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerEmail: string
  targetType: string
  targetId: string
  targetName: string
  overallRating: number
  title?: string
  content: string
  status: string
  helpfulVotes: number
  totalVotes: number
  isVerifiedPurchase: boolean
  moderationReason?: string
  moderatedBy?: string
  moderatedAt?: string
  createdAt: string
  updatedAt: string
  response?: {
    content: string
    responderName: string
    createdAt: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(REVIEW_STATUS.PENDING_MODERATION)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [moderationAction, setModerationAction] = useState<string | null>(null)
  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const [moderatingAction, setModeratingAction] = useState<string>('')
  const [moderationReason, setModerationReason] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ reviews: Review[] }>(`/api/admin/reviews?status=${selectedStatus}&limit=50`)
    setLoading(false)

    if (result.success && result.data) {
      setReviews(result.data.reviews || [])
    } else {
      setError(result.error || 'Fehler beim Laden der Bewertungen')
    }
  }, [selectedStatus])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await apiFetch<{ reviews: Review[] }>(`/api/admin/reviews?status=${selectedStatus}&limit=50`)
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        setReviews(result.data.reviews || [])
      } else {
        setError(result.error || 'Fehler beim Laden der Bewertungen')
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedStatus])

  const startModeration = (reviewId: string, action: string) => {
    setModeratingId(reviewId)
    setModeratingAction(action)
    setModerationReason('')
  }

  const cancelModeration = () => {
    setModeratingId(null)
    setModeratingAction('')
    setModerationReason('')
  }

  const handleModerate = async () => {
    if (!moderatingId || !moderationReason.trim()) return

    setModerationAction(moderatingId)
    const result = await apiFetch<void>(`/api/admin/reviews/${moderatingId}/moderate`, {
      method: 'PUT',
      body: {
        action: moderatingAction,
        reason: moderationReason
      }
    })

    if (result.success) {
      cancelModeration()
      await fetchReviews()
      setSuccessMessage(`Bewertung erfolgreich ${getReviewActionLabel(moderatingAction)}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      setError('Fehler bei der Moderation: ' + (result.error || 'Unbekannter Fehler'))
    }
    setModerationAction(null)
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case REVIEW_STATUS.PUBLISHED:
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case REVIEW_STATUS.PENDING_MODERATION:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case REVIEW_STATUS.HIDDEN:
        return <EyeOff className="w-5 h-5 text-red-500" />
      case REVIEW_STATUS.DELETED:
        return <Trash2 className="w-5 h-5 text-gray-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReviewStatusBadgeColor(status)}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{getReviewStatusLabel(status)}</span>
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    )
  }

  const filteredReviews = reviews.filter(review =>
    searchQuery === '' ||
    review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.reviewerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Fehler beim Laden</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Admin-Bereich
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bewertungs-Management</h1>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <div className="flex gap-2">
              {([REVIEW_STATUS.PUBLISHED, REVIEW_STATUS.PENDING_MODERATION, REVIEW_STATUS.HIDDEN, REVIEW_STATUS.DELETED] as ReviewStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getReviewFilterLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Suchen nach Name, E-Mail oder Inhalt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchReviews}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Moderation Dialog */}
      {moderatingId && (
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Grund für {getReviewActionLabel(moderatingAction)}:
          </h3>
          <textarea
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            placeholder="Bitte geben Sie einen Grund an..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleModerate}
              disabled={!moderationReason.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bestätigen
            </button>
            <button
              onClick={cancelModeration}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bewertungen gefunden</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Keine Bewertungen entsprechen Ihrer Suchanfrage.'
                : `Keine Bewertungen mit Status "${selectedStatus}".`
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Review Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bewertung für {review.targetName}
                      </h3>
                      {getStatusBadge(review.status)}
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verifizierter Kauf
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      {renderStars(review.overallRating)}
                      <span>•</span>
                      <span>{review.reviewerName}</span>
                      <span>•</span>
                      <span>{formatDateShort(review.createdAt)}</span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>

                    {review.response && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Antwort von {review.response.responderName}
                          </span>
                          <span className="text-xs text-blue-600">
                            {formatDateShort(review.response.createdAt)}
                          </span>
                        </div>
                        <p className="text-blue-800 text-sm">{review.response.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    {selectedStatus === REVIEW_STATUS.PENDING_MODERATION && (
                      <>
                        <button
                          onClick={() => startModeration(review.id, 'approve')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Freigeben'}
                        </button>
                        <button
                          onClick={() => startModeration(review.id, 'hide')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Ausblenden'}
                        </button>
                      </>
                    )}

                    {selectedStatus === REVIEW_STATUS.HIDDEN && (
                      <>
                        <button
                          onClick={() => startModeration(review.id, 'restore')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Wiederherstellen'}
                        </button>
                        <button
                          onClick={() => startModeration(review.id, 'delete')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Löschen'}
                        </button>
                      </>
                    )}

                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => startModeration(review.id, 'flag_spam')}
                        disabled={moderationAction === review.id}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 disabled:opacity-50"
                        title="Als Spam markieren"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => startModeration(review.id, 'flag_inappropriate')}
                        disabled={moderationAction === review.id}
                        className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 disabled:opacity-50"
                        title="Als unangemessen markieren"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>{review.helpfulVotes} hilfreiche Stimmen</span>
                  {review.moderationReason && (
                    <span className="text-red-600">Moderationsgrund: {review.moderationReason}</span>
                  )}
                  {review.moderatedAt && (
                    <span>Moderiert am {formatDateShort(review.moderatedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}