'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import type { ITHilfeRequest, Offer } from './types'

export function useITHilfeDetail(id: string) {
  const t = useTranslations('itHelp.detail')
  const { data: session } = useSession()

  const [request, setRequest] = useState<ITHilfeRequest | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerMessage, setOfferMessage] = useState('')
  const [offerEstimatedTime, setOfferEstimatedTime] = useState('')
  const [offerCompensation, setOfferCompensation] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [offerSkills, setOfferSkills] = useState<string[]>([])
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [offerError, setOfferError] = useState('')

  // Accept/decline offer state
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)
  const [decliningOfferId, setDecliningOfferId] = useState<string | null>(null)

  // User's own offer (for non-owners)
  const [userOffer, setUserOffer] = useState<Offer | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  // Messaging state
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showMessages, setShowMessages] = useState(false)
  const [openingConversation, setOpeningConversation] = useState(false)

  // Review state
  const [hasReviewed, setHasReviewed] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  // Helper-completion state
  const [markingCompleted, setMarkingCompleted] = useState(false)

  // Confirm+review state
  const [confirmingReview, setConfirmingReview] = useState(false)

  // Pending confirm dialog state
  type PendingConfirm =
    | { type: 'withdrawOffer' }
    | { type: 'acceptOffer'; offerId: string }
    | { type: 'declineOffer'; offerId: string }
    | { type: 'statusChange'; status: string }
    | { type: 'markCompleted' }
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const cancelPendingConfirm = () => setPendingConfirm(null)

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ request: ITHilfeRequest }>(`/api/it-hilfe/requests/${id}`)

      if (!result.success || !result.data) {
        setError(result.error || t('errorLoading'))
        return
      }

      setRequest(result.data.request)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      setError(message)
      logger.error('Error fetching peer repair request', { error: err })
    } finally {
      setLoading(false)
    }
  }, [id, t])

  const fetchOffers = useCallback(async () => {
    if (!request?.isOwner) return

    try {
      const result = await apiFetch<{ offers: Offer[] }>(`/api/it-hilfe/requests/${id}/offers`)

      if (result.success && result.data) {
        setOffers(result.data.offers)
      }
    } catch (err) {
      logger.error('Error fetching offers', { error: err })
    }
  }, [id, request?.isOwner])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  useEffect(() => {
    if (request?.isOwner) {
      fetchOffers()
    }
  }, [request?.isOwner, fetchOffers])

  // Fetch current user's own offer on this request (non-owners only)
  useEffect(() => {
    if (!session?.user || !request || request.isOwner) return

    apiFetch<{ offers: Array<{ id: string; requestId: string; message: string; estimatedTime: string; proposedCompensation: string; proposedAmountCents: number | null; relevantSkills: string[]; status: string; createdAt: string }> }>(`/api/it-hilfe/my-offers?status=pending`)
      .then(result => {
        if (result.success && result.data) {
          const match = result.data.offers.find((o) => o.requestId === id)
          if (match) {
            setUserOffer({
              id: match.id,
              requestId: match.requestId,
              helperId: session.user!.id!,
              helperName: session.user!.name || '',
              helperEmail: '',
              message: match.message,
              estimatedTime: match.estimatedTime,
              proposedCompensation: match.proposedCompensation,
              proposedAmountCents: match.proposedAmountCents ?? null,
              relevantSkills: match.relevantSkills || [],
              status: match.status,
              createdAt: match.createdAt,
            })
          }
        }
      })
      .catch(err => logger.error('Error fetching user offer', { error: err }))
  }, [session?.user, request, id])

  // Check if user has already reviewed this request
  useEffect(() => {
    if (!session?.user || !request || request.status !== REQUEST_STATUS.COMPLETED) return

    apiFetch<{ reviews: Array<{ reviewerId: string }> }>(`/api/reviews?targetType=${REVIEW_TARGET_TYPES.IT_HILFE}&targetId=${id}`)
      .then(result => {
        if (result.success && result.data) {
          const userReview = result.data.reviews.find(
            (r) => r.reviewerId === session.user!.id
          )
          if (userReview) setHasReviewed(true)
        }
      })
      .catch(err => logger.error('Error checking review status', { error: err }))
  }, [session?.user, request, id])

  // Find existing conversation for this request
  useEffect(() => {
    if (!session?.user || !request) return

    apiFetch<{ conversations: Array<{ id: string }> }>(`/api/messages?context_id=${id}`)
      .then(result => {
        if (result.success && result.data && result.data.conversations && result.data.conversations.length > 0) {
          setConversationId(result.data.conversations[0].id)
        }
      })
      .catch(err => logger.error('Error fetching conversation', { error: err }))
  }, [session?.user, request, id])

  const handleSkillToggle = (skillId: string) => {
    setOfferSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setOfferError('')
    setSubmittingOffer(true)

    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers`, {
        method: 'POST',
        body: {
          message: offerMessage,
          estimatedTime: offerEstimatedTime || null,
          proposedCompensation: offerCompensation || null,
          proposedAmountCents: offerAmount ? Math.round(parseFloat(offerAmount) * 100) : null,
          relevantSkills: offerSkills,
        },
      })

      if (!result.success) {
        setOfferError(result.error || t('errorSubmitOffer'))
        return
      }

      // Reset form and close
      setOfferMessage('')
      setOfferEstimatedTime('')
      setOfferCompensation('')
      setOfferAmount('')
      setOfferSkills([])
      setShowOfferForm(false)

      // Refresh request to update offer count
      fetchRequest()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      setOfferError(message)
    } finally {
      setSubmittingOffer(false)
    }
  }

  const handleWithdrawOffer = () => {
    if (!userOffer) return
    setPendingConfirm({ type: 'withdrawOffer' })
  }

  const doWithdrawOffer = async () => {
    if (!userOffer) return
    setWithdrawing(true)
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers/${userOffer.id}`, {
        method: 'DELETE',
      })
      if (!result.success) {
        toast.error(result.error || t('errorWithdraw'))
        return
      }
      setUserOffer(null)
      fetchRequest()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      toast.error(message)
    } finally {
      setWithdrawing(false)
    }
  }

  const handleAcceptOffer = (offerId: string) => {
    setPendingConfirm({ type: 'acceptOffer', offerId })
  }

  const doAcceptOffer = async (offerId: string) => {
    setAcceptingOfferId(offerId)
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers/${offerId}/accept`, {
        method: 'POST',
      })
      if (!result.success) {
        toast.error(result.error || t('errorAccept'))
        return
      }
      fetchRequest()
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      toast.error(message)
    } finally {
      setAcceptingOfferId(null)
    }
  }

  const handleDeclineOffer = (offerId: string) => {
    setPendingConfirm({ type: 'declineOffer', offerId })
  }

  const doDeclineOffer = async (offerId: string) => {
    setDecliningOfferId(offerId)
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers/${offerId}/decline`, {
        method: 'POST',
      })
      if (!result.success) {
        toast.error(result.error || t('errorDecline'))
        return
      }
      fetchRequest()
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      toast.error(message)
    } finally {
      setDecliningOfferId(null)
    }
  }

  const handleStatusChange = (status: string) => {
    if (!request) return
    setPendingConfirm({ type: 'statusChange', status })
  }

  const doStatusChange = async (status: string) => {
    if (!request) return
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${request.id}`, {
        method: 'PUT',
        body: { status },
      })
      if (result.success) {
        fetchRequest()
      } else {
        toast.error(result.error || t('errorUpdate'))
      }
    } catch (err) {
      logger.warn('Failed to update IT-Hilfe request status', { error: err, requestId: request.id, status })
      toast.error(t('errorUpdate'))
    }
  }

  const isExpired = request ? new Date(request.expiresAt) < new Date() : false
  const canOffer = !!(session?.user && request && !request.isOwner && request.status === REQUEST_STATUS.OPEN && !isExpired)

  // Is the current user the matched helper for this request?
  const isMatchedHelper = !!(
    session?.user?.id &&
    request &&
    request.matchedHelperId &&
    request.matchedHelperId === session.user.id
  )

  // Helper can mark completed while the request is in the matched state
  const canMarkCompleted = !!(isMatchedHelper && request?.status === REQUEST_STATUS.MATCHED)

  // Requester needs to confirm + review when status is completed and not yet reviewed
  const needsConfirmation = !!(
    request?.isOwner &&
    request?.status === REQUEST_STATUS.COMPLETED &&
    !request?.reviewedAt &&
    !hasReviewed &&
    !reviewSubmitted
  )

  const handleMarkCompleted = () => {
    if (!request) return
    setPendingConfirm({ type: 'markCompleted' })
  }

  const doMarkCompleted = async () => {
    if (!request) return
    setMarkingCompleted(true)
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${request.id}/complete`, {
        method: 'POST',
      })
      if (!result.success) {
        toast.error(result.error || t('errorComplete'))
        return
      }
      fetchRequest()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      toast.error(message)
      logger.error('Error marking IT-Hilfe completed', { error: err })
    } finally {
      setMarkingCompleted(false)
    }
  }

  const handleConfirmReview = async (params: {
    rating: number
    reviewText: string
    recommended: boolean
  }) => {
    if (!request) return
    setConfirmingReview(true)
    try {
      const result = await apiFetch<unknown>(
        `/api/it-hilfe/requests/${request.id}/confirm-review`,
        {
          method: 'POST',
          body: params,
        },
      )
      if (!result.success) {
        toast.error(result.error || t('errorReview'))
        return
      }
      setReviewSubmitted(true)
      fetchRequest()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unexpectedError')
      toast.error(message)
      logger.error('Error confirming IT-Hilfe review', { error: err })
    } finally {
      setConfirmingReview(false)
    }
  }

  const executePendingConfirm = async () => {
    if (!pendingConfirm) return
    const action = pendingConfirm
    setPendingConfirm(null)
    if (action.type === 'withdrawOffer') await doWithdrawOffer()
    else if (action.type === 'acceptOffer') await doAcceptOffer(action.offerId)
    else if (action.type === 'declineOffer') await doDeclineOffer(action.offerId)
    else if (action.type === 'statusChange') await doStatusChange(action.status)
    else if (action.type === 'markCompleted') await doMarkCompleted()
  }

  const pendingConfirmTitle = pendingConfirm
    ? pendingConfirm.type === 'acceptOffer' ? t('accept')
    : pendingConfirm.type === 'declineOffer' ? t('decline')
    : pendingConfirm.type === 'markCompleted' ? t('markCompletedTitle')
    : pendingConfirm.type === 'statusChange' && pendingConfirm.status === REQUEST_STATUS.COMPLETED ? t('markCompletedButton')
    : pendingConfirm.type === 'statusChange' ? t('cancelRequest')
    : t('confirmWithdraw')
    : ''

  const pendingConfirmMessage = pendingConfirm
    ? pendingConfirm.type === 'withdrawOffer' ? ''
    : pendingConfirm.type === 'acceptOffer' ? t('confirmAccept')
    : pendingConfirm.type === 'declineOffer' ? t('confirmDecline')
    : pendingConfirm.type === 'markCompleted' ? t('confirmComplete')
    : pendingConfirm.type === 'statusChange' && pendingConfirm.status === REQUEST_STATUS.COMPLETED ? t('confirmMarkCompleted')
    : t('confirmCancelRequest')
    : ''

  // Pre-acceptance conversation: a technician asks the requester a question
  // (no arg → the helper is the caller), or the requester messages an offerer
  // (pass the offerer's id). Find-or-creates the conversation, then opens the
  // message panel.
  const openConversation = useCallback(async (withUserId?: string) => {
    setOpeningConversation(true)
    try {
      const result = await apiFetch<{ conversationId: string }>(`/api/it-hilfe/requests/${id}/conversation`, {
        method: 'POST',
        body: withUserId ? { withUserId } : {},
      })
      if (result.success && result.data?.conversationId) {
        setConversationId(result.data.conversationId)
        setShowMessages(true)
      } else {
        setError(result.error || t('unexpectedError'))
      }
    } finally {
      setOpeningConversation(false)
    }
  }, [id, t])

  return {
    session,
    request,
    offers,
    loading,
    error,
    isExpired,
    canOffer,
    openConversation,
    openingConversation,

    // Offer form
    showOfferForm,
    setShowOfferForm,
    offerMessage,
    setOfferMessage,
    offerEstimatedTime,
    setOfferEstimatedTime,
    offerCompensation,
    setOfferCompensation,
    offerAmount,
    setOfferAmount,
    offerSkills,
    submittingOffer,
    offerError,
    handleSkillToggle,
    handleSubmitOffer,

    // Accept/Decline
    acceptingOfferId,
    handleAcceptOffer,
    decliningOfferId,
    handleDeclineOffer,

    // Status change (owner)
    handleStatusChange,

    // User offer
    userOffer,
    withdrawing,
    handleWithdrawOffer,

    // Messaging
    conversationId,
    showMessages,
    setShowMessages,

    // Review
    hasReviewed,
    reviewSubmitted,
    setReviewSubmitted,

    // Helper completion
    isMatchedHelper,
    canMarkCompleted,
    markingCompleted,
    handleMarkCompleted,

    // Requester confirmation + review
    needsConfirmation,
    confirmingReview,
    handleConfirmReview,

    // Confirm dialog
    pendingConfirm,
    pendingConfirmTitle,
    pendingConfirmMessage,
    executePendingConfirm,
    cancelPendingConfirm,

    // Refresh
    fetchRequest,
  }
}
