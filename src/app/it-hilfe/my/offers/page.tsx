'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowRight,
  MapPin,
  Clock,
  Heart,
  FileText,
  Wrench,
} from 'lucide-react'
import {
  getCategoryById,
  getOfferStatusById,
  getRequestStatusById,
  OFFER_STATUSES,
  OFFER_STATUS,
} from '@/config/it-hilfe'

interface OfferWithRequest {
  id: string
  requestId: string
  message: string
  estimatedTime: string | null
  proposedCompensation: string | null
  relevantSkills: string[]
  status: string
  createdAt: string
  request: {
    id: string
    title: string
    categoryId: string
    deviceBrand: string | null
    deviceModel: string | null
    status: string
    city: string
    canton: string
    requesterName: string
  }
}

export default function MyOffersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [offers, setOffers] = useState<OfferWithRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/my/offers')
    }
  }, [status, router])

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/it-hilfe/my-offers?${params}`)
      const data = await response.json()

      if (data.success) {
        setOffers(data.data.offers)
        setTotal(data.data.total)
      }
    } catch (error) {
      logger.error('Error fetching my offers', { error })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (session?.user) {
      fetchOffers()
    }
  }, [session?.user, fetchOffers])

  const handleWithdraw = async (offer: OfferWithRequest) => {
    if (!confirm('Angebot wirklich zurückziehen?')) return

    setWithdrawingId(offer.id)
    try {
      const response = await fetch(`/api/it-hilfe/requests/${offer.requestId}/offers/${offer.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Zurückziehen')
      }
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      alert(message)
      logger.error('Error withdrawing offer', { error: err })
    } finally {
      setWithdrawingId(null)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meine Angebote</h1>
            <p className="text-gray-600 mt-1">
              Angebote, die du für Reparaturanfragen abgegeben hast
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/it-hilfe/my"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Meine Anfragen
            </Link>
            <Link
              href="/it-hilfe"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Anfragen durchsuchen
            </Link>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({total})
            </button>
            {OFFER_STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter ? 'Keine Angebote mit diesem Status' : 'Noch keine Angebote abgegeben'}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter
                ? 'Versuche einen anderen Filter.'
                : 'Durchsuche Reparaturanfragen und hilf anderen Mitgliedern der Community.'}
            </p>
            {!statusFilter && (
              <Link
                href="/it-hilfe"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <Heart className="w-5 h-5" />
                Anfragen durchsuchen
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const categoryConfig = getCategoryById(offer.request.categoryId)
              const offerStatusConfig = getOfferStatusById(offer.status)
              const requestStatusConfig = getRequestStatusById(offer.request.status)
              const CategoryIcon = categoryConfig?.icon || Wrench

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <Link
                    href={`/it-hilfe/${offer.requestId}`}
                    className="block p-6 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${categoryConfig?.color || 'bg-gray-500'} rounded-xl`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                            Angebot: {offerStatusConfig?.name || offer.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${requestStatusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                            Anfrage: {requestStatusConfig?.name || offer.request.status}
                          </span>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {offer.request.title}
                        </h3>

                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Dein Angebot:</span> {offer.message.slice(0, 150)}
                          {offer.message.length > 150 && '...'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{offer.request.city}, {offer.request.canton}</span>
                          </div>
                          {offer.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{offer.estimatedTime}</span>
                            </div>
                          )}
                          {offer.proposedCompensation && (
                            <span className="text-emerald-600 font-medium">
                              {offer.proposedCompensation}
                            </span>
                          )}
                          <span className="text-gray-400">
                            Angefragt von {offer.request.requesterName}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </Link>
                  {offer.status === OFFER_STATUS.PENDING && (
                    <div className="px-6 pb-4">
                      <button
                        onClick={() => handleWithdraw(offer)}
                        disabled={withdrawingId === offer.id}
                        className="px-4 py-2 min-h-[44px] bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        {withdrawingId === offer.id ? 'Wird zurückgezogen...' : 'Angebot zurückziehen'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
