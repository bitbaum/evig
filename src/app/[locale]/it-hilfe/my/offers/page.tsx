'use client'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  getCategoryById,
  getOfferStatusById,
  getRequestStatusById,
  OFFER_STATUSES,
  OFFER_STATUS,
  REQUEST_STATUS,
} from '@/config/it-hilfe'
import { useMyOffers } from '@/hooks/useMyOffers'
import { ROUTES } from '@/config/routes'
import { PageShell } from '@/components/layout/PageShell'
import { StatusBadge } from '@/components/ui/status-badge'

export default function MyOffersPage() {
  const t = useTranslations('itHelp.myOffers')

  const {
    sessionStatus,
    offers,
    loading,
    total,
    statusFilter,
    withdrawingId,
    pendingWithdraw,
    error,
    setStatusFilter,
    setPendingWithdraw,
    doWithdraw,
  } = useMyOffers({
    errorMessage: t('errorMessage'),
    withdrawError: t('withdrawError'),
  })

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && loading)) {
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
              <Button as={Link} href={ROUTES.public.itHilfeMy} variant="outline">
                <FileText className="w-4 h-4" aria-hidden="true" />
                {t('myRequestsButton')}
              </Button>
              <Link href={ROUTES.public.itHilfe} className="ui-public-cta inline-flex items-center gap-2">
                <Heart className="w-4 h-4" aria-hidden="true" />
                {t('browseRequests')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageShell maxWidth="5xl" py="py-8 sm:py-12">

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
            {OFFER_STATUSES.map((s) => (
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

        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-error-800 dark:text-error-400">{error}</p>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="ui-public-card p-12 text-center">
            <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" aria-hidden="true" />
            <h3 className="ui-public-display-md mb-2">
              {statusFilter ? t('emptyFiltered') : t('emptyNoFilter')}
            </h3>
            <p className="ui-public-section-lede mb-6">
              {statusFilter ? t('emptyFilteredMessage') : t('emptyNoFilterMessage')}
            </p>
            {!statusFilter && (
              <Link href={ROUTES.public.itHilfe} className="ui-public-cta inline-flex items-center gap-2">
                <Heart className="w-5 h-5" aria-hidden="true" />
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
              // Helper-side mirror of 627fc731 on /it-hilfe/my (requester-side):
              // when the underlying request has silently expired (status='open'
              // AND expires_at past), the helper's PENDING offer effectively
              // can't progress — no new state changes happen on expired
              // requests. Without this badge the helper waits indefinitely.
              const requestExpired =
                offer.request.status === REQUEST_STATUS.OPEN &&
                offer.request.expiresAt != null &&
                new Date(offer.request.expiresAt) < new Date()

              return (
                <div
                  key={offer.id}
                  className="card-shell hover:border-strong transition-all"
                >
                  <Link href={`/it-hilfe/${offer.requestId}`} className="block p-6 group">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${categoryConfig?.color || 'bg-surface-overlay'} rounded-xl`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offerStatusConfig?.badgeClass || 'bg-surface-raised text-text-secondary'}`}>
                            {t('offerLabel')} {offerStatusConfig?.name || offer.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${requestStatusConfig?.badgeClass || 'bg-surface-raised text-text-secondary'}`}>
                            {t('requestLabel')} {requestStatusConfig?.name || offer.request.status}
                          </span>
                          {requestExpired && (
                            <StatusBadge variant="warning">Anfrage abgelaufen</StatusBadge>
                          )}
                        </div>

                        <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action transition-colors">
                          {offer.request.title}
                        </Heading>

                        <p className="text-sm text-text-secondary mb-3">
                          <span className="font-medium">{t('yourOffer')}</span>{' '}
                          {offer.message.slice(0, 150)}
                          {offer.message.length > 150 && '...'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
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
                            <span className="text-action font-medium">
                              {offer.proposedCompensation}
                            </span>
                          )}
                          <span className="text-text-muted">
                            {t('requestedBy', { name: offer.request.requesterName })}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-action transition-colors" />
                    </div>
                  </Link>

                  {offer.status === OFFER_STATUS.PENDING && (
                    <div className="px-6 pb-4">
                      <Button
                        variant="destructive-ghost"
                        onClick={() => setPendingWithdraw(offer)}
                        disabled={withdrawingId === offer.id}
                        className="px-4 py-2 min-h-touch bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg text-sm font-medium hover:bg-error-100 dark:hover:bg-error-900/30 transition-colors disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                      >
                        {withdrawingId === offer.id ? t('withdrawingButton') : t('withdrawButton')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      <ConfirmDialog
        isOpen={!!pendingWithdraw}
        title={t('withdrawButton')}
        message={t('withdrawConfirm')}
        itemName={pendingWithdraw?.request.title}
        onConfirm={doWithdraw}
        onClose={() => setPendingWithdraw(null)}
      />
      </PageShell>
    </div>
  )
}
