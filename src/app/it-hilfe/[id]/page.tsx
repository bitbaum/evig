'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/date-formats'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Wrench,
  Users,
} from 'lucide-react'
import {
  getCategoryById,
  getUrgencyById,
  formatBudget,
  getServiceTypeById,
  getRequestStatusById,
  getSkillById,
  getOfferStatusById,
  getAllSkills,
} from '@/config/it-hilfe'
import { TechnicianMapList } from '@/components/it-hilfe/TechnicianMapList'
import { AIDiagnosisCard } from '@/components/it-hilfe/AIDiagnosisCard'
import { ITHilfeReviewForm } from '@/components/it-hilfe/ITHilfeReviewForm'
import { MessageSidebar } from '@/components/messaging/MessageSidebar'

interface PeerRepairRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterEmail?: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  title: string
  description: string
  urgency: string
  budgetType: string
  budgetAmountCents: number | null
  postalCode: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  imageUrls: string[]
  status: string
  matchedOfferId: string | null
  offerCount: number
  aiDiagnosis: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  isOwner: boolean
}

interface Offer {
  id: string
  requestId: string
  helperId: string
  helperName: string
  helperEmail: string
  message: string
  estimatedTime: string | null
  proposedCompensation: string | null
  relevantSkills: string[]
  status: string
  createdAt: string
}

export default function PeerRepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()

  const [request, setRequest] = useState<PeerRepairRequest | null>(null)
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
      .then(res => res.json())
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
    if (!session?.user || !request || request.status !== 'completed') return

    fetch(`/api/reviews?targetType=it_hilfe&targetId=${id}`)
      .then(res => res.json())
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
      .then(res => res.json())
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fehler</h1>
          <p className="text-gray-600 mb-6">{error || 'Anfrage nicht gefunden'}</p>
          <Link
            href="/it-hilfe"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 min-h-[44px] rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  const categoryConfig = getCategoryById(request.categoryId)
  const urgencyConfig = getUrgencyById(request.urgency)
  const serviceConfig = getServiceTypeById(request.serviceType)
  const statusConfig = getRequestStatusById(request.status)
  const CategoryIcon = categoryConfig?.icon || Wrench

  const isExpired = new Date(request.expiresAt) < new Date()
  const canOffer = session?.user && !request.isOwner && ['open', 'in_discussion'].includes(request.status) && !isExpired

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/it-hilfe"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 px-2 py-1 min-h-[44px] rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Zurück zur Übersicht
        </Link>

        {/* Expiration Banner */}
        {isExpired && ['open', 'in_discussion'].includes(request.status) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-amber-800 text-sm font-medium">
              Diese Anfrage ist am {formatDate(request.expiresAt)} abgelaufen und akzeptiert keine neuen Angebote mehr.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 ${categoryConfig?.color || 'bg-gray-500'} rounded-xl`}>
                  <CategoryIcon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                      {statusConfig?.name || request.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                      {urgencyConfig?.name || request.urgency}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
                </div>
              </div>

              {/* Device info */}
              {(request.deviceBrand || request.deviceModel) && (
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Gerät:</span>{' '}
                  {[categoryConfig?.name, request.deviceBrand, request.deviceModel].filter(Boolean).join(' - ')}
                </p>
              )}

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap">{request.description}</p>
              </div>

              {/* Images */}
              {request.imageUrls.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {request.imageUrls.map((url, index) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={url}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills needed */}
              {request.skillsNeeded.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Benötigte Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.skillsNeeded.map((skillId) => {
                      const skill = getSkillById(skillId)
                      return (
                        <span
                          key={skillId}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {skill?.name || skillId}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* AI Diagnosis */}
            {request.aiDiagnosis && (
              <AIDiagnosisCard
                diagnosis={request.aiDiagnosis}
                deviceInfo={[
                  getCategoryById(request.categoryId)?.name,
                  request.deviceBrand,
                  request.deviceModel,
                ].filter(Boolean).join(' - ') || undefined}
              />
            )}

            {/* Technician Map + Matched Helpers */}
            {['open', 'in_discussion'].includes(request.status) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <TechnicianMapList requestId={request.id} requestTitle={request.title} />
              </div>
            )}

            {/* User's existing offer (non-owner) */}
            {userOffer && !request.isOwner && (
              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Dein Angebot</h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Ausstehend
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{userOffer.message}</p>
                {(userOffer.estimatedTime || userOffer.proposedCompensation) && (
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {userOffer.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        {userOffer.estimatedTime}
                      </span>
                    )}
                    {userOffer.proposedCompensation && (
                      <span>{userOffer.proposedCompensation}</span>
                    )}
                  </div>
                )}
                <button
                  onClick={handleWithdrawOffer}
                  disabled={withdrawing}
                  className="px-4 py-2.5 min-h-[44px] bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {withdrawing ? 'Wird zurückgezogen...' : 'Angebot zurückziehen'}
                </button>
              </div>
            )}

            {/* Offer Form */}
            {canOffer && !userOffer && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {!showOfferForm ? (
                  <button
                    onClick={() => setShowOfferForm(true)}
                    className="w-full py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <Send className="w-5 h-5" aria-hidden="true" />
                    Angebot abgeben
                  </button>
                ) : (
                  <form onSubmit={handleSubmitOffer}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dein Angebot</h3>

                    {offerError && (
                      <div id="offer-error" className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                        {offerError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nachricht an den Anfragenden <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          placeholder="Beschreibe, wie du helfen kannst und warum du geeignet bist..."
                          required
                          aria-required="true"
                          aria-invalid={!!offerError}
                          aria-describedby={offerError ? 'offer-error' : undefined}
                          minLength={20}
                          maxLength={2000}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Geschätzte Dauer (optional)
                          </label>
                          <input
                            type="text"
                            value={offerEstimatedTime}
                            onChange={(e) => setOfferEstimatedTime(e.target.value)}
                            placeholder="z.B. 1-2 Stunden"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vergütungsvorschlag (optional)
                          </label>
                          <input
                            type="text"
                            value={offerCompensation}
                            onChange={(e) => setOfferCompensation(e.target.value)}
                            placeholder="z.B. Kostenlos, CHF 30"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deine relevanten Skills (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {getAllSkills().map((skill) => (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => handleSkillToggle(skill.id)}
                              className={`px-3 py-3 min-h-[44px] rounded-full text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                offerSkills.includes(skill.id)
                                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                              }`}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowOfferForm(false)}
                        className="px-4 py-3 min-h-[44px] text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        disabled={submittingOffer || offerMessage.length < 20}
                        className="px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        {submittingOffer ? 'Wird gesendet...' : 'Angebot senden'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Offers List (Owner only) */}
            {request.isOwner && offers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Eingegangene Angebote ({offers.length})
                </h3>
                <div className="space-y-4">
                  {offers.map((offer) => {
                    const offerStatusConfig = getOfferStatusById(offer.status)
                    const isAccepted = offer.status === 'accepted'

                    return (
                      <div
                        key={offer.id}
                        className={`p-4 rounded-lg border ${
                          isAccepted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{offer.helperName}</p>
                              <p className="text-sm text-gray-500">{offer.helperEmail}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                            {offerStatusConfig?.name || offer.status}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-3">{offer.message}</p>

                        {(offer.estimatedTime || offer.proposedCompensation) && (
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {offer.estimatedTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" aria-hidden="true" />
                                {offer.estimatedTime}
                              </span>
                            )}
                            {offer.proposedCompensation && (
                              <span>{offer.proposedCompensation}</span>
                            )}
                          </div>
                        )}

                        {offer.relevantSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {offer.relevantSkills.map((skillId) => {
                              const skill = getSkillById(skillId)
                              return (
                                <span
                                  key={skillId}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  {skill?.name || skillId}
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {offer.status === 'pending' && ['open', 'in_discussion'].includes(request.status) && (
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            disabled={acceptingOfferId === offer.id}
                            className="mt-2 px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            {acceptingOfferId === offer.id ? 'Wird akzeptiert...' : 'Angebot akzeptieren'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Review Form (completed requests) */}
            {request.status === 'completed' && session?.user && !hasReviewed && !reviewSubmitted && (
              <ITHilfeReviewForm
                requestId={request.id}
                requestTitle={request.title}
                onSuccess={() => setReviewSubmitted(true)}
              />
            )}

            {/* Review submitted confirmation */}
            {reviewSubmitted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" aria-hidden="true" />
                <p className="text-emerald-800 font-medium">Bewertung abgegeben!</p>
                <p className="text-sm text-emerald-600 mt-1">Vielen Dank für dein Feedback.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Details
              </h3>

              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Standort</p>
                    <p className="font-medium text-gray-900">
                      {request.postalCode} {request.city}
                    </p>
                    <p className="text-sm text-gray-600">{request.canton}</p>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium text-emerald-600">
                      {formatBudget(request.budgetAmountCents)}
                    </p>
                  </div>
                </div>

                {/* Service Type */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Service-Typ</p>
                    <p className="font-medium text-gray-900">
                      {serviceConfig?.name || request.serviceType}
                    </p>
                  </div>
                </div>

                {/* Offers */}
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Angebote</p>
                    <p className="font-medium text-gray-900">
                      {request.offerCount} {request.offerCount === 1 ? 'Angebot' : 'Angebote'}
                    </p>
                  </div>
                </div>

                {/* Created */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Erstellt am</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Expires */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Läuft ab</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(request.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requester Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Anfragender
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{request.requesterName}</p>
                  {request.isOwner && request.requesterEmail && (
                    <p className="text-sm text-gray-500">{request.requesterEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Message Button */}
            {conversationId && session?.user && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <button
                  onClick={() => setShowMessages(true)}
                  className="w-full py-3 px-4 min-h-[44px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  Nachricht senden
                </button>
              </div>
            )}

            {/* Owner Actions */}
            {request.isOwner && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Aktionen
                </h3>
                <div className="space-y-2">
                  {request.status === 'matched' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Anfrage als abgeschlossen markieren?')) return
                        try {
                          const res = await fetch(`/api/it-hilfe/requests/${request.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'completed' }),
                          })
                          if (res.ok) {
                            window.location.reload()
                          } else {
                            const data = await res.json()
                            alert(data.error || 'Fehler beim Abschliessen')
                          }
                        } catch {
                          alert('Fehler beim Abschliessen')
                        }
                      }}
                      className="block w-full py-3 px-4 min-h-[44px] bg-emerald-600 text-white rounded-lg text-center font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      <CheckCircle className="w-4 h-4 inline-block mr-2" />
                      Als abgeschlossen markieren
                    </button>
                  )}
                  {['open', 'in_discussion', 'matched'].includes(request.status) && (
                    <button
                      onClick={async () => {
                        if (!confirm('Anfrage wirklich abbrechen?')) return
                        try {
                          const res = await fetch(`/api/it-hilfe/requests/${request.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'cancelled' }),
                          })
                          if (res.ok) {
                            window.location.reload()
                          } else {
                            const data = await res.json()
                            alert(data.error || 'Fehler beim Abbrechen')
                          }
                        } catch {
                          alert('Fehler beim Abbrechen')
                        }
                      }}
                      className="block w-full py-3 px-4 min-h-[44px] bg-red-50 text-red-700 rounded-lg text-center font-medium hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <XCircle className="w-4 h-4 inline-block mr-2" />
                      Anfrage abbrechen
                    </button>
                  )}
                  <Link
                    href="/it-hilfe/my"
                    className="block w-full py-3 px-4 min-h-[44px] bg-gray-100 text-gray-700 rounded-lg text-center font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    Alle meine Anfragen
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Sidebar */}
      <MessageSidebar
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        initialConversationId={conversationId}
      />
    </div>
  )
}
