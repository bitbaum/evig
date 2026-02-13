'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'
import {
  Search,
  Package,
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  ShoppingBag,
  DollarSign,
} from 'lucide-react'
import {
  MARKETPLACE_CATEGORIES,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  SORT_OPTIONS,
  MARKETPLACE_LIMITS,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { MARKETPLACE_CONTENT } from '@/config/page-content'
import { ListingCard, ListingCardGrid } from '@/components/marketplace/ListingCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'

interface ListingItem {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  brand: string | null
  model: string | null
  delivery_options: string
  payment_mode: string
  is_revampit: boolean
  pickup_location: string | null
  view_count: number
  favorite_count: number
  created_at: string
  seller_name: string
  seller_display_name: string | null
  seller_rating: number | null
  seller_city: string | null
  thumbnail: string | null
}

interface Pagination {
  total: number
  limit: number
  offset: number
}

export default function MarketplacePage() {
  const { data: session } = useSession()
  const [listings, setListings] = useState<ListingItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: MARKETPLACE_LIMITS.DEFAULT_PAGE_SIZE, offset: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [delivery, setDelivery] = useState('')
  const [payment, setPayment] = useState('')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [priceError, setPriceError] = useState<string | null>(null)

  // Debounce search input to prevent excessive API calls
  const debouncedSearch = useDebounce(searchInput, 300)

  // Validate price range
  const validatePrices = useCallback(() => {
    const min = Number(priceMin)
    const max = Number(priceMax)

    if (priceMin && min < 0) {
      setPriceError('Preis kann nicht negativ sein')
      return false
    }
    if (priceMax && max < 0) {
      setPriceError('Preis kann nicht negativ sein')
      return false
    }
    if (priceMin && priceMax && min > max) {
      setPriceError('Mindestpreis darf nicht höher als Höchstpreis sein')
      return false
    }
    if (priceMin && min > 50000) {
      setPriceError('Preis darf maximal CHF 50\'000 sein')
      return false
    }
    if (priceMax && max > 50000) {
      setPriceError('Preis darf maximal CHF 50\'000 sein')
      return false
    }

    setPriceError(null)
    return true
  }, [priceMin, priceMax])

  const fetchListings = useCallback(async () => {
    // Don't fetch if price validation fails
    if (!validatePrices()) {
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (condition) params.set('condition', condition)
      if (delivery) params.set('delivery', delivery)
      if (payment) params.set('payment', payment)
      if (sort) params.set('sort', sort)
      if (search) params.set('search', search)
      if (priceMin) params.set('price_min', priceMin)
      if (priceMax) params.set('price_max', priceMax)
      params.set('limit', String(pagination.limit))
      params.set('offset', String(pagination.offset))

      const response = await fetch(`/api/listings?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.data) {
        setListings(data.data.items)
        setPagination(data.data.pagination)
      } else {
        throw new Error(data.error || 'Fehler beim Laden der Inserate')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }, [category, condition, delivery, payment, sort, search, priceMin, priceMax, pagination.limit, pagination.offset, validatePrices])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Auto-search when debounced input changes
  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch)
      setPagination(prev => ({ ...prev, offset: 0 }))
    }
  }, [debouncedSearch, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission triggers immediate search (bypasses debounce)
    setSearch(searchInput)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const clearFilters = () => {
    setCategory('')
    setCondition('')
    setDelivery('')
    setPayment('')
    setSort('newest')
    setSearch('')
    setSearchInput('')
    setPriceMin('')
    setPriceMax('')
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const hasActiveFilters = category || condition || delivery || payment || search || priceMin || priceMax

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, offset: (page - 1) * prev.limit }))
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section - Matching homepage style */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Icon Badge */}
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 shadow-sm">
                <Store className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <Heading level={1} className="tracking-tight text-gray-900">
              Marketplace
            </Heading>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
              Kaufen und verkaufen Sie gebrauchte IT-Geräte in der Community. Fair, nachhaltig und lokal.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Laptop, Monitor, Smartphone..."
                  aria-label="Im Marketplace suchen"
                  className="w-full pl-12 pr-24 py-3.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-md transition-colors text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                  Suchen
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                <span><strong>{pagination.total}</strong> {pagination.total === 1 ? 'Inserat' : 'Inserate'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <span>Faire Preise</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-600" />
                <span>Community-Verkäufer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category Pills */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Kategoriefilter">
            <button
              onClick={() => { setCategory(''); setPagination(prev => ({ ...prev, offset: 0 })); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !category ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={!category}
            >
              Alle
            </button>
            {MARKETPLACE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPagination(prev => ({ ...prev, offset: 0 })); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={category === cat}
              >
                {cat}
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
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
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

            <div className="ml-auto">
              {session?.user && (
                <Link
                  href="/marketplace/sell"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  Verkaufen
                </Link>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div id="filter-panel" className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="filter-condition" className="block text-xs font-medium text-gray-700 mb-2">Zustand</label>
                  <select
                    id="filter-condition"
                    value={condition}
                    onChange={(e) => { setCondition(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
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
                    value={delivery}
                    onChange={(e) => { setDelivery(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
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
                    value={payment}
                    onChange={(e) => { setPayment(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
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
                      max="50000"
                      step="1"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => {
                        setPriceMin(e.target.value)
                        setPriceError(null)
                      }}
                      onBlur={() => {
                        validatePrices()
                        setPagination(prev => ({ ...prev, offset: 0 }))
                      }}
                      aria-label="Mindestpreis in CHF"
                      aria-invalid={!!priceError}
                      className={`w-1/2 px-3 py-2 border rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        priceError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="number"
                      min="0"
                      max="50000"
                      step="1"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => {
                        setPriceMax(e.target.value)
                        setPriceError(null)
                      }}
                      onBlur={() => {
                        validatePrices()
                        setPagination(prev => ({ ...prev, offset: 0 }))
                      }}
                      aria-label="Höchstpreis in CHF"
                      aria-invalid={!!priceError}
                      className={`w-1/2 px-3 py-2 border rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        priceError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {priceError && (
                    <p className="text-xs text-red-600 mt-1">{priceError}</p>
                  )}
                </div>
              </div>
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
        {!session?.user && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Melden Sie sich an, um zu kaufen oder zu verkaufen
            </h3>
            <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
              Erstellen Sie ein Konto, um Inserate aufzugeben oder Verkäufer zu kontaktieren.
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
