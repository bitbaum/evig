'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search,
  Package,
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  MARKETPLACE_CATEGORY_VALUES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  SORT_OPTIONS,
  MARKETPLACE_LIMITS,
  getSpecFiltersForCategory,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { MARKETPLACE_CONTENT } from '@/config/page-content'
import { ListingCard, ListingCardGrid } from '@/components/marketplace/ListingCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import { useState } from 'react'
import Heading from '@/components/ui/Heading'

export default function MarketplacePage() {
  const { data: session, status } = useSession()
  const [showFilters, setShowFilters] = useState(false)

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

  return (
    <div className="bg-white min-h-screen">
      {/* Compact hero — products visible without scrolling */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900">Marketplace</Heading>
              <p className="text-sm text-gray-600 mt-1">
                {pagination.total} {pagination.total === 1 ? 'Inserat' : 'Inserate'} verfügbar
              </p>
            </div>
            <Link
              href={session?.user ? '/marketplace/sell' : '/auth/login?callbackUrl=/marketplace/sell'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-base font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {MARKETPLACE_CONTENT.actions.sell}
            </Link>
          </div>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={filters.searchInput}
                onChange={(e) => filters.setSearchInput(e.target.value)}
                placeholder="Laptop, Monitor, Smartphone..."
                aria-label="Im Marketplace suchen"
                className="w-full pl-12 pr-24 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-md transition-colors text-sm font-semibold shadow-sm"
              >
                Suchen
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Seller Type Toggle */}
        <div className="mb-4 flex gap-2" role="group" aria-label="Verkäufertyp">
          <button
            onClick={() => { filters.setSellerType(''); resetOffset(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !filters.sellerType ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={!filters.sellerType}
          >
            {MARKETPLACE_CONTENT.sellerTypes.all}
          </button>
          <button
            onClick={() => { filters.setSellerType('revampit'); resetOffset(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.sellerType === 'revampit' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filters.sellerType === 'revampit'}
          >
            {MARKETPLACE_CONTENT.sellerTypes.revampit}
          </button>
          <button
            onClick={() => { filters.setSellerType('community'); resetOffset(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.sellerType === 'community' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={filters.sellerType === 'community'}
          >
            {MARKETPLACE_CONTENT.sellerTypes.community}
          </button>
        </div>

        {/* Category Pills */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Kategoriefilter">
            <button
              onClick={() => { filters.setCategory(''); resetOffset(); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !filters.category ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={!filters.category}
            >
              Alle
            </button>
            {MARKETPLACE_CATEGORY_VALUES.map((val) => (
              <button
                key={val}
                onClick={() => { filters.setCategory(val); resetOffset(); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.category === val ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filters.category === val}
              >
                {CATEGORY_ICONS[val] ? `${CATEGORY_ICONS[val]} ` : ''}{CATEGORY_LABELS[val] || val}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-orange-500" aria-label="Aktive Filter" />
              )}
            </button>

            <select
              value={filters.sort}
              onChange={(e) => { filters.setSort(e.target.value); resetOffset(); }}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              aria-label="Sortierung"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                <X className="w-4 h-4" />
                Filter zurücksetzen
              </button>
            )}

          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div id="filter-panel" className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="filter-condition" className="block text-xs font-medium text-gray-700 mb-2">Zustand</label>
                  <select
                    id="filter-condition"
                    value={filters.condition}
                    onChange={(e) => { filters.setCondition(e.target.value); resetOffset(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Alle Zustände</option>
                    {ZUSTAND_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-delivery" className="block text-xs font-medium text-gray-700 mb-2">Lieferung</label>
                  <select
                    id="filter-delivery"
                    value={filters.delivery}
                    onChange={(e) => { filters.setDelivery(e.target.value); resetOffset(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Alle Optionen</option>
                    {DELIVERY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{DELIVERY_LABELS[opt]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-payment" className="block text-xs font-medium text-gray-700 mb-2">Zahlung</label>
                  <select
                    id="filter-payment"
                    value={filters.payment}
                    onChange={(e) => { filters.setPayment(e.target.value); resetOffset(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    {PAYMENT_MODES.map(opt => (
                      <option key={opt} value={opt}>{PAYMENT_MODE_LABELS[opt]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Preisbereich (CHF)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={MARKETPLACE_LIMITS.MAX_PRICE_CHF}
                      step="1"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => {
                        filters.setPriceMin(e.target.value)
                        filters.setPriceError(null)
                      }}
                      onBlur={() => {
                        validatePrices()
                        resetOffset()
                      }}
                      aria-label="Mindestpreis in CHF"
                      aria-invalid={!!filters.priceError}
                      className={`w-1/2 px-3 py-2 border rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        filters.priceError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="number"
                      min="0"
                      max={MARKETPLACE_LIMITS.MAX_PRICE_CHF}
                      step="1"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => {
                        filters.setPriceMax(e.target.value)
                        filters.setPriceError(null)
                      }}
                      onBlur={() => {
                        validatePrices()
                        resetOffset()
                      }}
                      aria-label="Höchstpreis in CHF"
                      aria-invalid={!!filters.priceError}
                      className={`w-1/2 px-3 py-2 border rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        filters.priceError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {filters.priceError && (
                    <p className="text-xs text-red-600 mt-1">{filters.priceError}</p>
                  )}
                </div>
              </div>

              {/* Toggle Filters: Gratis + Verified */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.gratisOnly}
                    onChange={(e) => { filters.setGratisOnly(e.target.checked); resetOffset(); }}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Nur Gratis</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => { filters.setVerifiedOnly(e.target.checked); resetOffset(); }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Nur geprüfte Geräte</span>
                </label>
              </div>

              {/* Spec Filters (shown when category is selected) */}
              {filters.category && getSpecFiltersForCategory(filters.category).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 mb-3">Technische Filter</p>
                  <div className="flex flex-wrap gap-3">
                    {getSpecFiltersForCategory(filters.category).map(spec => {
                      const filterValue =
                        spec.meiliField === 'spec_ram_gb' ? filters.specRamMin :
                        spec.meiliField === 'spec_storage_gb' ? filters.specStorageMin :
                        spec.meiliField === 'spec_display_inches' ? filters.specDisplayMin : ''
                      const setFilter =
                        spec.meiliField === 'spec_ram_gb' ? filters.setSpecRamMin :
                        spec.meiliField === 'spec_storage_gb' ? filters.setSpecStorageMin :
                        spec.meiliField === 'spec_display_inches' ? filters.setSpecDisplayMin : null

                      if (!setFilter) return null
                      return (
                        <div key={spec.key}>
                          <label className="block text-xs text-gray-500 mb-1">{spec.label}</label>
                          <select
                            value={filterValue}
                            onChange={(e) => { setFilter(e.target.value); resetOffset(); }}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Alle</option>
                            {spec.options.map(opt => (
                              <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <LoadingSkeleton count={pagination.limit} />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorAlert
            title={MARKETPLACE_CONTENT.errorStates.loadFailed}
            message={error}
            onRetry={fetchListings}
            retryLabel={MARKETPLACE_CONTENT.errorStates.tryAgain}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <EmptyState
            icon={Package}
            title={MARKETPLACE_CONTENT.emptyStates.noListings.title}
            message={
              hasActiveFilters
                ? MARKETPLACE_CONTENT.emptyStates.noListings.messageFiltered
                : MARKETPLACE_CONTENT.emptyStates.noListings.messageEmpty
            }
            action={
              hasActiveFilters
                ? { label: MARKETPLACE_CONTENT.filters.clearFilters, onClick: clearFilters }
                : session?.user
                ? { label: 'Erstes Inserat erstellen', href: '/marketplace/sell' }
                : undefined
            }
          />
        )}

        {/* Listings Grid */}
        {!isLoading && !error && listings.length > 0 && (
          <ListingCardGrid>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </ListingCardGrid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 pt-8" aria-label="Seitennavigation">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label="Vorherige Seite"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-4" aria-current="page">
              Seite {currentPage} von {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label="Nächste Seite"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}

        {/* Sign-in CTA for non-logged-in users */}
        {status === 'unauthenticated' && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Heading level={3} className="text-xl font-bold text-gray-900 mb-2">
              Melde dich an, um zu kaufen oder zu verkaufen
            </Heading>
            <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
              Erstelle ein Konto, um Inserate aufzugeben oder Verkäufer zu kontaktieren.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                Anmelden
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-600 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                Registrieren
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
