'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
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
  REQUEST_STATUS,
  REQUEST_STATUSES,
} from '@/config/it-hilfe'
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { StatusBadge } from '@/components/ui/status-badge'
import { ROUTES } from '@/config/routes'
import { PageShell } from '@/components/layout/PageShell'

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
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    )
  }

  return (
    <div className="bg-canvas min-h-screen">
      <section className="border-b border-subtle py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="ui-public-eyebrow">IT-HILFE</div>
              <h1 className="ui-public-display-md mt-3">{t('title')}</h1>
              <p className="ui-public-meta mt-2">{t('description')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button as={Link} href={ROUTES.public.itHilfeMyOffers} variant="outline">
                <Heart className="w-4 h-4" aria-hidden="true" />
                {t('myOffersButton')}
              </Button>
              <Link href={ROUTES.public.itHilfeCreate} className="ui-public-cta inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" />
                {t('newRequestButton')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageShell maxWidth="5xl" py="py-8 sm:py-12">

        {/* Status Filter */}
        <div className="card-shell p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-action-muted text-action'
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
              }`}
            >
              {t('filterAll', { total })}
            </Button>
            {REQUEST_STATUSES.map((s) => (
              <Button
                key={s.id}
                variant="ghost"
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-action-muted text-action'
                    : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
                }`}
              >
                {s.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Fetch Error */}
        {fetchError && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-error-800 dark:text-error-400">{t('fetchError')}</p>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 && !fetchError ? (
          <div className="ui-public-card p-12 text-center">
            <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" aria-hidden="true" />
            <h3 className="ui-public-display-md mb-2">
              {statusFilter ? t('emptyFiltered') : t('emptyNoFilter')}
            </h3>
            <p className="ui-public-section-lede mb-6">{statusFilter ? t('emptyFilteredMessage') : t('emptyNoFilterMessage')}</p>
            {!statusFilter && (
              <Link href={ROUTES.public.itHilfeCreate} className="ui-public-cta inline-flex items-center gap-2">
                <Plus className="w-5 h-5" aria-hidden="true" />
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
              // An "Abgelaufen" request is still status=open in the DB but
              // past its expires_at — the public browse silently filters it
              // out and the API rejects new offers, so without this badge
              // the requester sees "Offen" and wonders why no offers come
              // in. Surface it explicitly.
              const isExpired =
                req.status === REQUEST_STATUS.OPEN &&
                req.expiresAt != null &&
                new Date(req.expiresAt) < new Date()

              return (
                <Link
                  key={req.id}
                  href={`/it-hilfe/${req.id}`}
                  className="block card-shell p-6 hover:border-strong transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${categoryConfig?.color || 'bg-surface-overlay'} rounded-xl`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.badgeClass || 'bg-surface-raised text-text-secondary'}`}>
                          {statusConfig?.name || req.status}
                        </span>
                        {isExpired && (
                          <StatusBadge variant="warning" title={`Abgelaufen am ${formatDateShort(req.expiresAt)}`}>
                            Abgelaufen
                          </StatusBadge>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-surface-raised text-text-secondary'}`}>
                          {urgencyConfig?.name || req.urgency}
                        </span>
                      </div>

                      <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action transition-colors">
                        {req.title}
                      </Heading>

                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {req.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{req.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className={req.offerCount > 0 ? 'text-action font-medium' : ''}>
                            {t('offerCount', { count: req.offerCount })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateShort(req.createdAt)}</span>
                        </div>
                        <span className="text-action font-medium">
                          {formatBudget(req.budgetAmountCents)}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-action transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </PageShell>
    </div>
  )
}
