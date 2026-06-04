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

      <div className="flex gap-1 bg-surface-raised rounded-lg p-1">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab.value}
            onClick={() => handleStatusFilterChange(tab.value)}
            variant="ghost"
            size="sm"
            className={`flex-1 ${
              statusFilter === tab.value
                ? 'bg-surface-base text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </Button>
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
                className="bg-surface-base rounded-xl shadow-xs border border-subtle p-4 flex items-center gap-4"
              >
                <Link href={`/marketplace/${listing.id}`} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                  <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/${listing.id}`} className="hover:text-action transition-colors">
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
                    className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-raised transition-colors"
                    title={t('actionEdit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <Button
                    onClick={() => handleDuplicate(listing.id)}
                    disabled={duplicatingId === listing.id}
                    variant="ghost"
                    size="icon"
                    className="text-text-tertiary hover:text-text-secondary"
                    title={t('actionDuplicate')}
                  >
                    {duplicatingId === listing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => setPendingDeleteId(listing.id)}
                    disabled={deletingId === listing.id}
                    variant="destructive-ghost"
                    size="icon"
                    className="text-text-tertiary"
                    title={t('actionDelete')}
                  >
                    {deletingId === listing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
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
            <Button
              onClick={goPrev}
              disabled={!hasPrev}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('prevPage')}
            </Button>
            <span className="text-sm text-text-secondary">
              {/* Keyset doesn't know the total page count up front (total
                  divided by page size is close but doesn't always
                  match because of filter changes mid-scroll). Show just
                  the current page; "more available" is conveyed by the
                  enabled-state of the Next button. */}
              {t('paginationCurrentPage', { page })}
            </span>
            <Button
              onClick={goNext}
              disabled={!hasNext}
              variant="outline"
              size="sm"
            >
              {t('nextPage')}
              <ChevronRight className="w-4 h-4" />
            </Button>
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
