'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import {
  ArrowRight,
  MapPin,
  Clock,
  Heart,
  FileText,
  Wrench,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('itHelp.myOffers')

  const [offers, setOffers] = useState<OfferWithRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      const result = await apiFetch<{ offers: OfferWithRequest[]; total: number }>(
        `/api/it-hilfe/my-offers?${params}`,
      )

      if (result.success && result.data) {
        setOffers(result.data.offers)
        setTotal(result.data.total)
      } else {
        setError(result.error || t('errorMessage'))
        logger.error('Error fetching my offers', { error: result.error })
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, t])

  useEffect(() => {
    if (session?.user) {
      fetchOffers()
    }
  }, [session?.user, fetchOffers])

  const handleWithdraw = async (offer: OfferWithRequest) => {
    if (!confirm(t('withdrawConfirm'))) return

    setWithdrawingId(offer.id)
    try {
      const result = await apiFetch<unknown>(
        `/api/it-hilfe/requests/${offer.requestId}/offers/${offer.id}`,
        { method: 'DELETE' },
      )
      if (!result.success) {
        throw new Error(result.error || t('withdrawError'))
      }
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('withdrawError')
      setError(message)
      logger.error('Error withdrawing offer', { error: err })
    } finally {
      setWithdrawingId(null)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Heading level={1} className="text-2xl text-neutral-900">{t('title')}</Heading>
            <p className="text-neutral-600 mt-1">
              {t('description')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/it-hilfe/my"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t('myRequestsButton')}
            </Link>
            <Link
              href="/it-hilfe"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Heart className="w-4 h-4" />
              {t('browseRequests')}
            </Link>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {t('filterAll', { total })}
            </button>
            {OFFER_STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-error-800">{error}</p>
          </div>
        )}

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-12 text-center">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <Heading level={3} className="text-xl text-neutral-900 mb-2">
              {statusFilter ? t('emptyFiltered') : t('emptyNoFilter')}
            </Heading>
            <p className="text-neutral-600 mb-6">
              {statusFilter ? t('emptyFilteredMessage') : t('emptyNoFilterMessage')}
            </p>
            {!statusFilter && (
              <Link
                href="/it-hilfe"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <Heart className="w-5 h-5" />
                {t('browseRequests')}
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
                  className="bg-white rounded-xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
                >
                  <Link
                    href={`/it-hilfe/${offer.requestId}`}
                    className="block p-6 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${categoryConfig?.color || 'bg-neutral-500'} rounded-xl`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-neutral-100 text-neutral-700'}`}>
                            {t('offerLabel')} {offerStatusConfig?.name || offer.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${requestStatusConfig?.badgeClass || 'bg-neutral-100 text-neutral-700'}`}>
                            {t('requestLabel')} {requestStatusConfig?.name || offer.request.status}
                          </span>
                        </div>

                        <Heading level={3} className="font-semibold text-neutral-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {offer.request.title}
                        </Heading>

                        <p className="text-sm text-neutral-600 mb-3">
                          <span className="font-medium">{t('yourOffer')}</span> {offer.message.slice(0, 150)}
                          {offer.message.length > 150 && '...'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
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
                          <span className="text-neutral-400">
                            {t('requestedBy', { name: offer.request.requesterName })}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </Link>
                  {offer.status === OFFER_STATUS.PENDING && (
                    <div className="px-6 pb-4">
                      <button
                        onClick={() => handleWithdraw(offer)}
                        disabled={withdrawingId === offer.id}
                        className="px-4 py-2 min-h-[44px] bg-error-50 text-error-700 rounded-lg text-sm font-medium hover:bg-error-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                      >
                        {withdrawingId === offer.id ? t('withdrawingButton') : t('withdrawButton')}
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
