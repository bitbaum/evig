'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { getReviewActionLabel, REVIEW_STATUS, type ReviewStatus } from '@/config/review-status'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { toast } from 'sonner'

export interface Review {
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

export function useAdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(REVIEW_STATUS.PENDING_MODERATION)
  const [searchQuery, setSearchQuery] = useState('')
  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const [moderatingAction, setModerationAction] = useState('')
  const [moderationReason, setModerationReason] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const loadReviews = () => {
    setLoading(true)
    setError(null)
    apiFetch<{ reviews: Review[] }>(`/api/admin/reviews?status=${selectedStatus}&limit=50`).then((result) => {
      setLoading(false)
      if (result.success && result.data) {
        setReviews(result.data.reviews || [])
      } else {
        setError(result.error || ADMIN_CONTENT.reviews.errorMessage)
      }
    })
  }

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
      body: { action: moderatingAction, reason: moderationReason },
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

  const filteredReviews = reviews.filter(
    (review) =>
      searchQuery === '' ||
      review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return {
    reviews,
    filteredReviews,
    loading,
    error,
    selectedStatus,
    searchQuery,
    moderatingId,
    moderatingAction,
    moderationReason,
    actionInProgress,
    setSelectedStatus,
    setSearchQuery,
    setModerationReason,
    startModeration,
    cancelModeration,
    handleModerate,
    loadReviews,
  }
}
