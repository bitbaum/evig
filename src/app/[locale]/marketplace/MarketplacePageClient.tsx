'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

export default function MarketplacePage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
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
  } = useMarketplaceListings({
    category: searchParams.get('category') ?? undefined,
    sellerType: searchParams.get('seller_type') ?? undefined,
    search: searchParams.get('search') ?? searchParams.get('q') ?? undefined,
  })

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

  const sellHref = session?.user
    ? '/marketplace/sell'
    : '/auth/login?callbackUrl=/marketplace/sell'

  return (
    <div className="bg-canvas min-h-screen">
      {/* ── Header — monochrome, fleetcrown discipline ──────────────── */}
      <section className="border-b border-subtle py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="ui-public-eyebrow">{t('eyebrows.marketplace')}</div>
              <h1 className="ui-public-display-md mt-3">{t('subtitle')}</h1>
              <p className="ui-public-meta mt-3 font-mono tabular-nums">
                {t('listingsAvailable', { count: pagination.total })}
              </p>
            </div>
            <Link
              href={sellHref}
              className="ui-public-cta inline-flex items-center gap-2 md:justify-self-end"
            >
              <Plus className="w-4 h-4" />
              {t('sell.label')}
            </Link>
          </div>

          <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="text"
                value={filters.searchInput}
                onChange={(e) => filters.setSearchInput(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchAriaLabel')}
                className="pl-10 pr-28 text-sm"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                {t('searchButton')}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile: filter bar */}
        <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2"
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('filters.label')}
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-text-primary text-canvas text-xs font-bold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Select
            value={filters.sort}
            onChange={(e) => { filters.setSort(e.target.value); resetOffset() }}
            className="w-auto"
            aria-label={t('filters.sort')}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(`sort.${opt.value}` as never)}</option>
            ))}
          </Select>
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips
          filters={filters}
          resetOffset={resetOffset}
          clearFilters={clearFilters}
        />

        {/* 2-column layout */}
        <div className="flex gap-8 items-start">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-20 pb-4">
            <MarketplaceFilterSidebar {...sharedSidebarProps} />
          </aside>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-subtle">
              <p className="ui-public-meta font-mono tabular-nums">
                {t('listingsAvailable', { count: pagination.total })}
              </p>
              <Select
                value={filters.sort}
                onChange={(e) => { filters.setSort(e.target.value); resetOffset() }}
                className="w-auto"
                aria-label={t('filters.sort')}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{t(`sort.${opt.value}` as never)}</option>
                ))}
              </Select>
            </div>

            {isLoading && <LoadingSkeleton count={pagination.limit} />}

            {error && !isLoading && (
              <ErrorAlert
                title={t('error_states.loadFailed')}
                message={error}
                onRetry={fetchListings}
                retryLabel={t('error_states.tryAgain')}
              />
            )}

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

            {!isLoading && !error && listings.length > 0 && (
              <ListingCardGrid>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </ListingCardGrid>
            )}

            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 pt-10"
                aria-label={t('pagination.navigation')}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label={t('pagination.previousPage')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="ui-public-meta font-mono tabular-nums px-4" aria-current="page">
                  {t('pagination.pageOf', { current: currentPage, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label={t('pagination.nextPage')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </nav>
            )}
          </div>
        </div>

        {/* ── Sign-in CTA — text-only fleetcrown discipline ───────── */}
        {status === 'unauthenticated' && (
          <section className="mt-16 border-t border-subtle pt-16 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="ui-public-eyebrow">{t('eyebrows.getInvolved')}</div>
              <h2 className="ui-public-display-md mt-3">{t('signInCta.title')}</h2>
              <p className="ui-public-section-lede mt-4">{t('signInCta.description')}</p>
              <div className="ui-public-cta-row mt-8">
                <Link href={ROUTES.public.login} className="ui-public-cta">
                  {t('signInCta.login')}
                </Link>
                <Link href={ROUTES.public.register} className="ui-public-cta-ghost">
                  {t('signInCta.register')}
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters.label')}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute right-0 top-0 h-full w-80 max-w-full bg-surface-base flex flex-col border-l border-subtle">
            <div className="flex items-center justify-between p-4 border-b border-subtle shrink-0">
              <span className="ui-public-eyebrow">{t('filters.label')}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label={t('filters.closeLabel')}
              >
                <X className="w-5 h-5 text-text-secondary" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MarketplaceFilterSidebar
                {...sharedSidebarProps}
                clearFilters={() => { clearFilters(); setMobileFiltersOpen(false) }}
              />
            </div>
            <div className="p-4 border-t border-subtle shrink-0">
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
