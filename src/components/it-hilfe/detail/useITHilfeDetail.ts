'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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

  // Accept offer state
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)

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
      const response = await fetch(`/api/it-hilfe/requests/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden der Anfrage')
      }

      setRequest(data.data.request)
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
      const response = await fetch(`/api/it-hilfe/requests/${id}/offers`)
      const data = await response.json()

      if (response.ok) {
        setOffers(data.data.offers)
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

    fetch(`/api/it-hilfe/my-offers?status=pending`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data.success) {
          const match = data.data.offers.find((o: { requestId: string }) => o.requestId === id)
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

    fetch(`/api/reviews?targetType=it_hilfe&targetId=${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data.success) {
          const userReview = data.data.reviews.find(
            (r: { reviewerId: string }) => r.reviewerId === session.user!.id
          )
          if (userReview) setHasReviewed(true)
        }
      })
      .catch(err => logger.error('Error checking review status', { error: err }))
  }, [session?.user, request, id])

  // Find existing conversation for this request
  useEffect(() => {
    if (!session?.user || !request) return

    fetch(`/api/messages?context_id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data.success && data.data?.conversations?.length > 0) {
          setConversationId(data.data.conversations[0].id)
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
      const response = await fetch(`/api/it-hilfe/requests/${id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: offerMessage,
          estimatedTime: offerEstimatedTime || null,
          proposedCompensation: offerCompensation || null,
          relevantSkills: offerSkills,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden des Angebots')
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
      const response = await fetch(`/api/it-hilfe/requests/${id}/offers/${userOffer.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Zurückziehen')
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
      const response = await fetch(`/api/it-hilfe/requests/${id}/offers/${offerId}/accept`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Akzeptieren des Angebots')
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

  const handleStatusChange = async (status: string) => {
    if (!request) return
    const confirmMsg = status === REQUEST_STATUS.COMPLETED
      ? 'Anfrage als abgeschlossen markieren?'
      : 'Anfrage wirklich abbrechen?'
    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/it-hilfe/requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchRequest()
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Aktualisieren')
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

    // Accept
    acceptingOfferId,
    handleAcceptOffer,

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
