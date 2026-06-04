'use client'

import Link from 'next/link'
import {
  Package,
  Plus,
  Eye,
  Heart,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { LISTING_STATUS_CONFIG, LISTING_STATUS, formatCHF } from '@/config/marketplace'
import type { ListingStatus } from '@/config/marketplace'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { useMyListings } from '@/hooks/useMyListings'
import { ROUTES } from '@/config/routes'

export default function MyListingsPage() {
  const t = useTranslations('dashboard.listings')

  const {
    sessionStatus,
    listings,
    isLoading,
    error,
    statusFilter,
    deletingId,
    duplicatingId,
    pendingDeleteId,
    page,
    hasNext,
    hasPrev,
    total,
    goNext,
    goPrev,
    refresh,
    handleStatusFilterChange,
    doDelete,
    handleDuplicate,
    setPendingDeleteId,
  } = useMyListings({ loadError: t('loadError') })

  const STATUS_TABS = [
    { value: '', label: t('tabAll') },
    { value: LISTING_STATUS.ACTIVE, label: t('tabActive') },
    { value: LISTING_STATUS.SOLD, label: t('tabSold') },
    { value: LISTING_STATUS.DRAFT, label: t('tabDraft') },
    { value: LISTING_STATUS.RESERVED, label: t('tabReserved') },
  ]

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} className="text-2xl font-bold text-text-primary">{t('pageTitle')}</Heading>
          <p className="text-sm text-text-tertiary mt-1">{t('pageSubtitle')}</p>
        </div>
        <Button as={Link} href={ROUTES.public.marketplaceSell} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          {t('newListing')}
        </Button>
      </div>

      <div className="flex gap-1 bg-surface-raised dark:bg-neutral-800 rounded-lg p-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleStatusFilterChange(tab.value)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-surface-base dark:bg-neutral-700 text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <span className="ml-3 text-text-secondary">{t('loading')}</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-error-600 dark:text-error-300 mb-4">{error}</p>
          <Button onClick={() => refresh()} variant="destructive" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
        </div>
      )}

      {!isLoading && !error && listings.length === 0 && (
        <EmptyState
          icon={Package}
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          iconColor="text-violet-500 dark:text-violet-400"
          title={statusFilter ? t('emptyFilteredTitle') : t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button as={Link} href={ROUTES.public.marketplaceSell} variant="primary">
              <Plus className="w-4 h-4" />
              {t('createFirst')}
            </Button>
          }
        />
      )}

      {!isLoading && !error && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => {
            const statusConfig = LISTING_STATUS_CONFIG[listing.status as ListingStatus]
            const conditionInfo = getConditionBadge(listing.condition)
            return (
              <div
                key={listing.id}
                className="bg-surface-base dark:bg-neutral-800 rounded-xl shadow-xs border border-subtle dark:border-neutral-700 p-4 flex items-center gap-4"
              >
                <Link href={`/marketplace/${listing.id}`} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                  <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/${listing.id}`} className="hover:text-primary-600 transition-colors">
                    <Heading level={3} className="font-medium text-text-primary truncate">{listing.title}</Heading>
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm text-text-tertiary">
                    <span className="font-semibold text-text-primary">
                      {formatCHF(Number(listing.price_chf))}
                    </span>
                    <span>{listing.category}</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs rounded-sm ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {listing.view_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {listing.favorite_count}
                    </span>
                  </div>
                </div>

                {statusConfig && (
                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`${ROUTES.public.marketplaceSell}?edit=${listing.id}`}
                    className="p-2 rounded-lg text-text-tertiary hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    title={t('actionEdit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(listing.id)}
                    disabled={duplicatingId === listing.id}
                    className="p-2 rounded-lg text-text-tertiary hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                    title={t('actionDuplicate')}
                  >
                    {duplicatingId === listing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(listing.id)}
                    disabled={deletingId === listing.id}
                    className="p-2 rounded-lg text-text-tertiary hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors disabled:opacity-50"
                    title={t('actionDelete')}
                  >
                    {deletingId === listing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && !error && (hasNext || hasPrev) && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-text-tertiary">
            {t('totalCount', { count: total })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('prevPage')}
            </button>
            <span className="text-sm text-text-secondary">
              {/* Keyset doesn't know the total page count up front (total
                  divided by page size is close but doesn't always
                  match because of filter changes mid-scroll). Show just
                  the current page; "more available" is conveyed by the
                  enabled-state of the Next button. */}
              {t('paginationCurrentPage', { page })}
            </span>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('nextPage')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        title={t('actionDelete')}
        message={t('confirmDelete')}
        itemName={listings.find(l => l.id === pendingDeleteId)?.title}
        onConfirm={doDelete}
        onClose={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
