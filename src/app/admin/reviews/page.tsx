'use client'

import { useState, useEffect } from 'react'
import { formatDateShort } from '@/lib/date-formats'
import {
  type ReviewStatus,
  REVIEW_STATUS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_BADGES,
  getReviewFilterLabel,
  getReviewActionLabel,
} from '@/config/review-status'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { apiFetch } from '@/lib/api/client'
import { AdminStatusBadge, type StatusConfig } from '@/components/admin/AdminStatusBadge'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import {
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Filter,
  Flag,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'

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

const REVIEW_STATUS_CONFIG: Record<string, StatusConfig> = Object.fromEntries(
  Object.values(REVIEW_STATUS).map((status) => [
    status,
    { label: REVIEW_STATUS_LABELS[status], color: REVIEW_STATUS_BADGES[status] },
  ])
)

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(REVIEW_STATUS.PENDING_MODERATION)
  const [searchQuery, setSearchQuery] = useState('')
  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const [moderatingAction, setModerationAction] = useState<string>('')
  const [moderationReason, setModerationReason] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchReviews = async () => {
      setLoading(true)
      setError(null)
      const result = await apiFetch<{ reviews: Review[] }>(`/api/admin/reviews?status=${selectedStatus}&limit=50`)
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        setReviews(result.data.reviews || [])
      } else {
        setError(result.error || ADMIN_CONTENT.reviews.errorMessage)
      }
    }
    fetchReviews()
    return () => { cancelled = true }
  }, [selectedStatus])

  const loadReviews = () => {
    setLoading(true)
    setError(null)
    apiFetch<{ reviews: Review[] }>(`/api/admin/reviews?status=${selectedStatus}&limit=50`).then(
      (result) => {
        setLoading(false)
        if (result.success && result.data) {
          setReviews(result.data.reviews || [])
        } else {
          setError(result.error || ADMIN_CONTENT.reviews.errorMessage)
        }
      }
    )
  }

  const startModeration = (reviewId: string, action: string) => {
    setModeratingId(reviewId)
    setModerationAction(action)
    setModerationReason('')
  }

  const cancelModeration = () => {
    setModeratingId(null)
    setModerationAction('')
    setModerationReason('')
  }

  const handleModerate = async () => {
    if (!moderatingId || !moderationReason.trim()) return

    setActionInProgress(moderatingId)
    const result = await apiFetch<void>(`/api/admin/reviews/${moderatingId}/moderate`, {
      method: 'PUT',
      body: {
        action: moderatingAction,
        reason: moderationReason
      }
    })

    if (result.success) {
      const actionLabel = getReviewActionLabel(moderatingAction)
      cancelModeration()
      loadReviews()
      toast.success(`Bewertung erfolgreich ${actionLabel}`)
    } else {
      setError('Fehler bei der Moderation: ' + (result.error || 'Unbekannter Fehler'))
    }
    setActionInProgress(null)
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'}`}
        />
      ))}
      <span className="ml-2 text-sm text-neutral-600">{rating}/5</span>
    </div>
  )

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && reviews.length === 0) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-error-400" />
          <div className="ml-3">
            <Heading level={3} className="text-sm font-medium text-error-800">Fehler beim Laden</Heading>
            <p className="text-sm text-error-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminPageWrapper
      title="Bewertungs-Management"
      description="Bewertungen moderieren und verwalten"
      icon={MessageSquare}
      iconColor="amber"
    >
      {/* Filters and Search */}
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Suchen nach Name, E-Mail oder Inhalt..."
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Status:</span>
          </div>
          <div className="flex gap-2">
            {(Object.values(REVIEW_STATUS) as ReviewStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {getReviewFilterLabel(status)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={loadReviews}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
        </div>
      </AdminFilterBar>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-error-800">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">
              {ADMIN_CONTENT.reviews.emptyTitle}
            </Heading>
            <p className="text-neutral-600">
              {searchQuery
                ? 'Keine Bewertungen entsprechen Ihrer Suchanfrage.'
                : `Keine Bewertungen mit Status "${getReviewFilterLabel(selectedStatus)}".`
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              {/* Review Header */}
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Heading level={3} className="text-lg font-semibold text-neutral-900">
                        Bewertung für {review.targetName}
                      </Heading>
                      <AdminStatusBadge status={review.status} config={REVIEW_STATUS_CONFIG} />
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-800">
                          Verifizierter Kauf
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                      {renderStars(review.overallRating)}
                      <span>•</span>
                      <span>{review.reviewerName}</span>
                      <span>•</span>
                      <span>{formatDateShort(review.createdAt)}</span>
                    </div>
                    {review.title && (
                      <Heading level={4} className="font-medium text-neutral-900 mb-2">{review.title}</Heading>
                    )}
                    <p className="text-neutral-700 text-sm leading-relaxed">{review.content}</p>

                    {review.response && (
                      <div className="mt-4 p-4 bg-info-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-info-600" />
                          <span className="text-sm font-medium text-info-900">
                            Antwort von {review.response.responderName}
                          </span>
                          <span className="text-xs text-info-600">
                            {formatDateShort(review.response.createdAt)}
                          </span>
                        </div>
                        <p className="text-info-800 text-sm">{review.response.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    {selectedStatus === REVIEW_STATUS.PENDING_MODERATION && (
                      <>
                        <button
                          onClick={() => startModeration(review.id, 'approve')}
                          disabled={actionInProgress === review.id}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {actionInProgress === review.id ? '...' : 'Freigeben'}
                        </button>
                        <button
                          onClick={() => startModeration(review.id, 'hide')}
                          disabled={actionInProgress === review.id}
                          className="px-3 py-1.5 bg-error-600 text-white rounded text-xs hover:bg-error-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3" />
                          {actionInProgress === review.id ? '...' : 'Ausblenden'}
                        </button>
                      </>
                    )}

                    {selectedStatus === REVIEW_STATUS.HIDDEN && (
                      <>
                        <button
                          onClick={() => startModeration(review.id, 'restore')}
                          disabled={actionInProgress === review.id}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {actionInProgress === review.id ? '...' : 'Wiederherstellen'}
                        </button>
                        <button
                          onClick={() => startModeration(review.id, 'delete')}
                          disabled={actionInProgress === review.id}
                          className="px-3 py-1.5 bg-error-600 text-white rounded text-xs hover:bg-error-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          {actionInProgress === review.id ? '...' : 'Löschen'}
                        </button>
                      </>
                    )}

                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => startModeration(review.id, 'flag_spam')}
                        disabled={actionInProgress === review.id}
                        aria-label="Als Spam markieren"
                        className="min-h-[2.75rem] px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Flag className="w-3 h-3" />
                        Spam
                      </button>
                      <button
                        onClick={() => startModeration(review.id, 'flag_inappropriate')}
                        disabled={actionInProgress === review.id}
                        aria-label="Als unangemessen markieren"
                        className="min-h-[2.75rem] px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Unangemessen
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                  <span>{review.helpfulVotes} hilfreiche Stimmen</span>
                  {review.moderationReason && (
                    <span className="text-error-600">Moderationsgrund: {review.moderationReason}</span>
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

      {/* Moderation Modal */}
      <Modal
        isOpen={!!moderatingId}
        onClose={cancelModeration}
        title={`Grund für ${getReviewActionLabel(moderatingAction)}`}
        size="md"
      >
        <div className="space-y-4">
          <textarea
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            placeholder="Bitte gib einen Grund an..."
            rows={4}
            className="w-full px-3 py-2 border border-neutral-400 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-info-500 text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelModeration}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleModerate}
              disabled={!moderationReason.trim() || !!actionInProgress}
              className="inline-flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg text-sm font-medium hover:bg-info-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionInProgress && <Loader2 className="w-4 h-4 animate-spin" />}
              Bestätigen
            </button>
          </div>
        </div>
      </Modal>
    </AdminPageWrapper>
  )
}
