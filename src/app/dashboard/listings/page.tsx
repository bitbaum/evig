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
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { LISTING_STATUS_CONFIG, LISTING_STATUS, formatCHF, getCategoryLabel } from '@/config/marketplace'
import type { ListingStatus } from '@/config/marketplace'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { useMyListings } from '@/hooks/useMyListings'
import { ROUTES } from '@/config/routes'

/**
 * /dashboard/listings — the user's own marketplace listings.
 *
 * Phase 2 polish: flat-document layout matching the redesigned
 * /dashboard hub and /admin dashboard. Header with mono kicker,
 * tab strip, then one divide-y list of listing rows (no card-stacking
 * per listing). Empty state and error state use existing primitives.
 */
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
      <main className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-action" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-canvas">
      <article className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-subtle pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
              {t('pageSubtitle')}
              {total > 0 && ` · ${t('totalCount', { count: total })}`}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
              {t('pageTitle')}
            </h1>
          </div>
          <Button as={Link} href={ROUTES.public.marketplaceSell} variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            {t('newListing')}
          </Button>
        </header>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-surface-raised p-1">
          {STATUS_TABS.map(tab => (
            <Button
              key={tab.value}
              onClick={() => handleStatusFilterChange(tab.value)}
              variant="ghost"
              size="sm"
              className={`flex-1 ${
                statusFilter === tab.value
                  ? 'bg-surface-base text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-action" />
            <span className="ml-3 text-text-secondary">{t('loading')}</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-800 dark:bg-error-900/20">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-error-500" />
            <p className="mb-4 text-error-600 dark:text-error-300">{error}</p>
            <Button onClick={() => refresh()} variant="destructive" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('retry')}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && listings.length === 0 && (
          <EmptyState
            icon={Package}
            title={statusFilter ? t('emptyFilteredTitle') : t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Button as={Link} href={ROUTES.public.marketplaceSell} variant="primary">
                <Plus className="h-4 w-4" />
                {t('createFirst')}
              </Button>
            }
          />
        )}

        {/* Listings — divide-y, single border. No per-row card chrome. */}
        {!isLoading && !error && listings.length > 0 && (
          <ul className="divide-y divide-subtle overflow-hidden rounded-lg border border-subtle bg-surface-base">
            {listings.map(listing => {
              const statusConfig = LISTING_STATUS_CONFIG[listing.status as ListingStatus]
              const conditionInfo = getConditionBadge(listing.condition)
              return (
                <li key={listing.id} className="flex items-center gap-4 p-4">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-md"
                  >
                    <ListingImage
                      src={listing.thumbnail}
                      alt={listing.title}
                      fallbackIconSize="w-6 h-6"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/marketplace/${listing.id}`}
                      className="block transition-colors hover:text-action"
                    >
                      <p className="truncate text-sm font-medium text-text-primary">
                        {listing.title}
                      </p>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                      <span className="font-semibold text-text-primary">
                        {formatCHF(Number(listing.price_chf))}
                      </span>
                      <span>{getCategoryLabel(listing.category)}</span>
                      <span className={`inline-flex rounded-sm px-1.5 py-0.5 ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {listing.view_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {listing.favorite_count}
                      </span>
                    </div>
                  </div>

                  {statusConfig && (
                    <span
                      className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`${ROUTES.public.marketplaceSell}?edit=${listing.id}`}
                      className="rounded-md p-2 text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-secondary"
                      title={t('actionEdit')}
                    >
                      <Pencil className="h-4 w-4" />
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Pagination */}
        {!isLoading && !error && (hasNext || hasPrev) && (
          <div className="flex items-center justify-between pt-2">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
              {t('paginationCurrentPage', { page })}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={goPrev} disabled={!hasPrev} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                {t('prevPage')}
              </Button>
              <Button onClick={goNext} disabled={!hasNext} variant="outline" size="sm">
                {t('nextPage')}
                <ChevronRight className="h-4 w-4" />
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
      </article>
    </main>
  )
}
