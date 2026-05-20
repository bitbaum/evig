'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Search,
  Package,
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { SORT_OPTIONS } from '@/config/marketplace'
import { ListingCard, ListingCardGrid } from '@/components/marketplace/ListingCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { MarketplaceFilterSidebar } from '@/components/marketplace/MarketplaceFilterSidebar'
import { ActiveFilterChips } from '@/components/marketplace/ActiveFilterChips'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

export default function MarketplacePage() {
  const { data: session, status } = useSession()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const t = useTranslations('marketplace')

  const {
    listings,
    pagination,
    isLoading,
    error,
    filters,
    handleSearch,
    clearFilters,
    validatePrices,
    fetchListings,
    resetOffset,
    goToPage,
    hasActiveFilters,
    totalPages,
    currentPage,
  } = useMarketplaceListings()

  const activeFilterCount = [
    filters.category,
    filters.condition,
    filters.delivery,
    filters.payment,
    filters.sellerType,
    filters.priceMin,
    filters.priceMax,
    filters.gratisOnly ? 'gratis' : '',
    filters.verifiedOnly ? 'verified' : '',
    filters.specRamMin,
    filters.specStorageMin,
    filters.specDisplayMin,
  ].filter(Boolean).length

  const sharedSidebarProps = {
    filters,
    validatePrices,
    resetOffset,
    clearFilters,
    hasActiveFilters,
  }

  return (
    <div className="bg-canvas min-h-screen">
      {/* Compact search hero — orange accents maintained for marketplace identity */}
      <div className="bg-secondary-50 dark:bg-neutral-900 border-b border-secondary-100 dark:border-white/[0.06] py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                {t('title')}
              </Heading>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                {t('listingsAvailable', { count: pagination.total })}
              </p>
            </div>
            <Link
              href={
                session?.user
                  ? '/marketplace/sell'
                  : '/auth/login?callbackUrl=/marketplace/sell'
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-500 hover:bg-secondary-600 dark:bg-secondary-500 dark:hover:bg-secondary-400 text-white rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              {t('sell.label')}
            </Link>
          </div>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={filters.searchInput}
                onChange={(e) => filters.setSearchInput(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchAriaLabel')}
                className="w-full pl-10 pr-24 py-2.5 rounded-lg border border-neutral-300 dark:border-white/[0.1] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:ring-2 focus:ring-secondary-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-secondary-500 hover:bg-secondary-600 dark:hover:bg-secondary-400 text-white px-4 py-1.5 rounded-md transition-colors text-sm font-semibold"
              >
                {t('searchButton')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: filter bar */}
        <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-300 dark:border-white/[0.1] rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors"
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('filters.label')}
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-500 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => { filters.setSort(e.target.value); resetOffset() }}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-white/[0.1] bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent outline-none"
            aria-label={t('filters.sort')}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips
          filters={filters}
          resetOffset={resetOffset}
          clearFilters={clearFilters}
        />

        {/* 2-column layout: sidebar + results */}
        <div className="flex gap-8 items-start">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-20 pb-4">
            <MarketplaceFilterSidebar {...sharedSidebarProps} />
          </aside>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Results header: count + sort (desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('listingsAvailable', { count: pagination.total })}
              </p>
              <select
                value={filters.sort}
                onChange={(e) => { filters.setSort(e.target.value); resetOffset() }}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/[0.1] bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent outline-none"
                aria-label={t('filters.sort')}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading */}
            {isLoading && <LoadingSkeleton count={pagination.limit} />}

            {/* Error */}
            {error && !isLoading && (
              <ErrorAlert
                title={t('error_states.loadFailed')}
                message={error}
                onRetry={fetchListings}
                retryLabel={t('error_states.tryAgain')}
              />
            )}

            {/* Empty */}
            {!isLoading && !error && listings.length === 0 && (
              <EmptyState
                icon={Package}
                title={t('empty_states.noListings')}
                message={
                  hasActiveFilters
                    ? t('empty_states.noListingsFiltered')
                    : t('empty_states.noListingsEmpty')
                }
                action={
                  hasActiveFilters
                    ? { label: t('filters.clearFilters'), onClick: clearFilters }
                    : session?.user
                    ? { label: t('signInCta.firstListing'), href: '/marketplace/sell' }
                    : undefined
                }
              />
            )}

            {/* Listings grid */}
            {!isLoading && !error && listings.length > 0 && (
              <ListingCardGrid>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </ListingCardGrid>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 pt-8"
                aria-label={t('pagination.navigation')}
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-neutral-300 dark:border-white/[0.1] text-neutral-600 dark:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors"
                  aria-label={t('pagination.previousPage')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 px-4" aria-current="page">
                  {t('pagination.pageOf', { current: currentPage, total: totalPages })}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-neutral-300 dark:border-white/[0.1] text-neutral-600 dark:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors"
                  aria-label={t('pagination.nextPage')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </div>
        </div>

        {/* Sign-in CTA */}
        {status === 'unauthenticated' && (
          <div className="mt-12 card-shell rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-500/15">
                <Package className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
            <Heading level={3} className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              {t('signInCta.title')}
            </Heading>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              {t('signInCta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button as={Link} href={ROUTES.public.login} variant="primary">
                {t('signInCta.login')}
              </Button>
              <Link
                href={ROUTES.public.register}
                className="px-6 py-2.5 border border-neutral-300 dark:border-white/[0.1] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] rounded-lg font-semibold transition-colors"
              >
                {t('signInCta.register')}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters.label')}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute right-0 top-0 h-full w-80 max-w-full bg-white dark:bg-neutral-900 shadow-xl dark:shadow-black/40 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/[0.06] flex-shrink-0">
              <span className="font-semibold text-neutral-900 dark:text-white">{t('filters.label')}</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label={t('filters.closeLabel')}
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MarketplaceFilterSidebar
                {...sharedSidebarProps}
                clearFilters={() => { clearFilters(); setMobileFiltersOpen(false) }}
              />
            </div>
            <div className="p-4 border-t border-neutral-200 dark:border-white/[0.06] flex-shrink-0">
              <Button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                variant="primary"
                className="w-full"
              >
                {t('filters.showResults')}
                {pagination.total > 0 && ` (${pagination.total})`}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
