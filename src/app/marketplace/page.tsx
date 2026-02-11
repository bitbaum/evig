'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search,
  Heart,
  MapPin,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  Plus,
  SlidersHorizontal,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ZUSTAND_OPTIONS, getConditionBadge } from '@/config/erfassung/conditions'
import {
  MARKETPLACE_CATEGORIES,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  SORT_OPTIONS,
  formatCHF,
  MARKETPLACE_LIMITS,
} from '@/config/marketplace'
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

  const fetchListings = useCallback(async () => {
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
  }, [category, condition, delivery, payment, sort, search, priceMin, priceMax, pagination.limit, pagination.offset])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, offset: 0 }))
    setSearch(searchInput)
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
    <div className="space-y-6">
      {/* Hero / Search */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 md:p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Heading level={1} className="mb-3">
            Marketplace
          </Heading>
          <p className="text-lg text-green-100 mb-6">
            Kaufen und verkaufen Sie gebrauchte IT-Geräte in der Community
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Laptop, Monitor, Smartphone..."
              className="w-full pl-12 pr-24 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md transition-colors text-sm font-medium"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => { setCategory(''); setPagination(prev => ({ ...prev, offset: 0 })); }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !category ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Alle
        </button>
        {MARKETPLACE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPagination(prev => ({ ...prev, offset: 0 })); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
        </button>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Filter zurücksetzen
          </button>
        )}

        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {pagination.total} {pagination.total === 1 ? 'Inserat' : 'Inserate'}
        </div>

        {session?.user && (
          <Link
            href="/marketplace/sell"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Verkaufen
          </Link>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Zustand</label>
              <select
                value={condition}
                onChange={(e) => { setCondition(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Alle Zustände</option>
                {ZUSTAND_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lieferung</label>
              <select
                value={delivery}
                onChange={(e) => { setDelivery(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Alle Optionen</option>
                {DELIVERY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{DELIVERY_LABELS[opt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Zahlung</label>
              <select
                value={payment}
                onChange={(e) => { setPayment(e.target.value); setPagination(prev => ({ ...prev, offset: 0 })); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Alle</option>
                {PAYMENT_MODES.map(opt => (
                  <option key={opt} value={opt}>{PAYMENT_MODE_LABELS[opt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preisbereich (CHF)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  onBlur={() => setPagination(prev => ({ ...prev, offset: 0 }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  onBlur={() => setPagination(prev => ({ ...prev, offset: 0 }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Inserate werden geladen...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Fehler beim Laden
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchListings}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && listings.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keine Inserate gefunden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {hasActiveFilters
              ? 'Versuchen Sie andere Filteroptionen oder entfernen Sie einige Filter.'
              : 'Es sind noch keine Inserate verfügbar. Seien Sie der Erste!'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Filter zurücksetzen
            </button>
          ) : session?.user ? (
            <Link
              href="/marketplace/sell"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Erstes Inserat erstellen
            </Link>
          ) : null}
        </div>
      )}

      {/* Listings Grid */}
      {!isLoading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {listings.map((listing) => {
            const conditionInfo = getConditionBadge(listing.condition)
            const sellerName = listing.seller_display_name || listing.seller_name
            return (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[4/3]">
                  {listing.thumbnail ? (
                    <img
                      src={listing.thumbnail}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </span>
                  </div>
                  {listing.is_revampit && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <TrendingUp className="w-3 h-3" />
                        RevampIT
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm md:text-base group-hover:text-green-600 transition-colors">
                    {listing.title}
                  </h3>

                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {formatCHF(Number(listing.price_chf))}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="truncate">{sellerName}</span>
                    {listing.seller_rating && Number(listing.seller_rating) > 0 && (
                      <span className="inline-flex items-center gap-0.5 flex-shrink-0">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {Number(listing.seller_rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {(listing.pickup_location || listing.seller_city) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{listing.pickup_location || listing.seller_city}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{listing.view_count} Aufrufe</span>
                    {listing.favorite_count > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="w-3 h-3" />
                        {listing.favorite_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Seite {currentPage} von {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sell CTA for non-logged-in users */}
      {!session?.user && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Melden Sie sich an, um zu kaufen oder zu verkaufen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie ein Konto, um Inserate aufzugeben oder Verkäufer zu kontaktieren.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Anmelden
            </Link>
            <Link
              href="/auth/register"
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-6 py-2 rounded-lg font-medium"
            >
              Registrieren
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
