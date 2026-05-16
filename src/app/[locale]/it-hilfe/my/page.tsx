'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import {
  Plus,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Wrench,
  Heart,
  FileText,
} from 'lucide-react'
import {
  getCategoryById,
  getUrgencyById,
  formatBudget,
  getRequestStatusById,
  REQUEST_STATUSES,
} from '@/config/it-hilfe'
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export default function MyRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('itHelp.myRequests')

  const [requests, setRequests] = useState<ITHilfeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [fetchError, setFetchError] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/my')
    }
  }, [status, router])

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(false)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const result = await apiFetch<{ requests: ITHilfeRequest[]; total: number }>(
        `/api/it-hilfe/my-requests?${params}`,
      )

      if (result.success && result.data) {
        setRequests(result.data.requests)
        setTotal(result.data.total)
      } else {
        logger.warn('Error fetching my IT-Hilfe requests', { error: result.error })
        setFetchError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (session?.user) {
      fetchRequests()
    }
  }, [session?.user, fetchRequests])

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
              href="/it-hilfe/my/offers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              <Heart className="w-4 h-4" />
              {t('myOffersButton')}
            </Link>
            <Link
              href="/it-hilfe/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('newRequestButton')}
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
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {t('filterAll', { total })}
            </button>
            {REQUEST_STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fetch Error */}
        {fetchError && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-error-800">{t('fetchError')}</p>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 && !fetchError ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-12 text-center">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <Heading level={3} className="text-xl text-neutral-900 mb-2">
              {statusFilter ? t('emptyFiltered') : t('emptyNoFilter')}
            </Heading>
            <p className="text-neutral-600 mb-6">
              {statusFilter ? t('emptyFilteredMessage') : t('emptyNoFilterMessage')}
            </p>
            {!statusFilter && (
              <Link
                href="/it-hilfe/create"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('createButton')}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const categoryConfig = getCategoryById(req.categoryId)
              const urgencyConfig = getUrgencyById(req.urgency)
              const statusConfig = getRequestStatusById(req.status)
              const CategoryIcon = categoryConfig?.icon || Wrench

              return (
                <Link
                  key={req.id}
                  href={`/it-hilfe/${req.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-neutral-100 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${categoryConfig?.color || 'bg-neutral-500'} rounded-xl`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.badgeClass || 'bg-neutral-100 text-neutral-700'}`}>
                          {statusConfig?.name || req.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-neutral-100 text-neutral-700'}`}>
                          {urgencyConfig?.name || req.urgency}
                        </span>
                      </div>

                      <Heading level={3} className="font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {req.title}
                      </Heading>

                      <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                        {req.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{req.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className={req.offerCount > 0 ? 'text-primary-600 font-medium' : ''}>
                            {t('offerCount', { count: req.offerCount })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateShort(req.createdAt)}</span>
                        </div>
                        <span className="text-primary-600 font-medium">
                          {formatBudget(req.budgetAmountCents)}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-primary-600 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
