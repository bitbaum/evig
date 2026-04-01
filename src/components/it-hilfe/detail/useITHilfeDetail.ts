'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import type { ITHilfeRequest, Offer } from './types'

export function useITHilfeDetail(id: string) {
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

  // Review state
  const [hasReviewed, setHasReviewed] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ request: ITHilfeRequest }>(`/api/it-hilfe/requests/${id}`)

      if (!result.success || !result.data) {
        setError(result.error || 'Fehler beim Laden der Anfrage')
        return
      }

      setRequest(result.data.request)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      logger.error('Error fetching peer repair request', { error: err })
    } finally {
      setLoading(false)
    }
  }, [id])

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

    apiFetch<{ offers: Array<{ id: string; requestId: string; message: string; estimatedTime: string; proposedCompensation: string; relevantSkills: string[]; status: string; createdAt: string }> }>(`/api/it-hilfe/my-offers?status=pending`)
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

    apiFetch<{ reviews: Array<{ reviewerId: string }> }>(`/api/reviews?targetType=it_hilfe&targetId=${id}`)
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
          relevantSkills: offerSkills,
        },
      })

      if (!result.success) {
        setOfferError(result.error || 'Fehler beim Senden des Angebots')
        return
      }

      // Reset form and close
      setOfferMessage('')
      setOfferEstimatedTime('')
      setOfferCompensation('')
      setOfferSkills([])
      setShowOfferForm(false)

      // Refresh request to update offer count
      fetchRequest()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setOfferError(message)
    } finally {
      setSubmittingOffer(false)
    }
  }

  const handleWithdrawOffer = async () => {
    if (!userOffer) return
    if (!confirm('Angebot wirklich zurückziehen?')) return

    setWithdrawing(true)
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers/${userOffer.id}`, {
        method: 'DELETE',
      })
      if (!result.success) {
        alert(result.error || 'Fehler beim Zurückziehen')
        return
      }
      setUserOffer(null)
      fetchRequest()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      alert(message)
    } finally {
      setWithdrawing(false)
    }
  }

  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('Möchtest du dieses Angebot wirklich akzeptieren? Alle anderen Angebote werden abgelehnt.')) {
      return
    }

    setAcceptingOfferId(offerId)

    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers/${offerId}/accept`, {
        method: 'POST',
      })

      if (!result.success) {
        alert(result.error || 'Fehler beim Akzeptieren des Angebots')
        return
      }

      // Refresh both request and offers
      fetchRequest()
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      alert(message)
    } finally {
      setAcceptingOfferId(null)
    }
  }

  const handleDeclineOffer = async (offerId: string) => {
    if (!confirm('Dieses Angebot wirklich ablehnen?')) return

    setDecliningOfferId(offerId)
    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}/offers/${offerId}/decline`, {
        method: 'POST',
      })
      if (!result.success) {
        alert(result.error || 'Fehler beim Ablehnen')
        return
      }
      fetchRequest()
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      alert(message)
    } finally {
      setDecliningOfferId(null)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!request) return
    const confirmMsg = status === REQUEST_STATUS.COMPLETED
      ? 'Anfrage als abgeschlossen markieren?'
      : 'Anfrage wirklich abbrechen?'
    if (!confirm(confirmMsg)) return

    try {
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${request.id}`, {
        method: 'PUT',
        body: { status },
      })
      if (result.success) {
        fetchRequest()
      } else {
        alert(result.error || 'Fehler beim Aktualisieren')
      }
    } catch {
      alert('Fehler beim Aktualisieren')
    }
  }

  const isExpired = request ? new Date(request.expiresAt) < new Date() : false
  const canOffer = !!(session?.user && request && !request.isOwner && (request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.IN_DISCUSSION) && !isExpired)

  return {
    session,
    request,
    offers,
    loading,
    error,
    isExpired,
    canOffer,

    // Offer form
    showOfferForm,
    setShowOfferForm,
    offerMessage,
    setOfferMessage,
    offerEstimatedTime,
    setOfferEstimatedTime,
    offerCompensation,
    setOfferCompensation,
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

    // Refresh
    fetchRequest,
  }
}
