'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Package,
  Search,
  Grid,
  List,
  Star,
  MapPin,
  User,
  Heart,
  ShoppingCart,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { ZUSTAND_OPTIONS, getConditionBadge } from '@/config/erfassung/conditions'
import Heading from '@/components/ui/Heading'

interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number | null
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  category: string
  location: string
  seller: {
    id?: string
    name: string
    rating: number
    verified: boolean
  }
  images: string[]
  isOfficial: boolean
  inStock: boolean
}

interface Stats {
  total: number
  officialCount: number
  communityCount: number
  averagePrice: number
}

interface ApiResponse {
  success: boolean
  data?: {
    products: Product[]
    stats: Stats
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  error?: string
}

export default function MarketplacePage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, officialCount: 0, communityCount: 0, averagePrice: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [sellerType, setSellerType] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (condition) params.set('condition', condition)
      if (sellerType) params.set('sellerType', sellerType)
      if (search) params.set('search', search)

      const response = await fetch(`/api/marketplace/products?${params.toString()}`)
      const data: ApiResponse = await response.json()

      if (data.success && data.data) {
        setProducts(data.data.products)
        setStats(data.data.stats)
      } else {
        throw new Error(data.error || 'Fehler beim Laden der Produkte')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [category, condition, sellerType, search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const getConditionDisplay = (cond: string) => getConditionBadge(cond)

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Heading level={1} className="mb-4">
            RevampIT Marketplace
          </Heading>
          <p className="text-xl text-green-100 mb-8">
            Entdecken Sie hochwertige refurbished Produkte von RevampIT und unserer Community
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Suche nach Produkten..."
              className="w-full pl-12 pr-24 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">RevampIT Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.officialCount}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Community Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.communityCount}</p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ø Preis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averagePrice > 0 ? `CHF ${stats.averagePrice}` : '-'}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle Kategorien</option>
              <option value="Laptops">Laptops</option>
              <option value="Desktop PCs">Desktop PCs</option>
              <option value="Monitore">Monitore</option>
              <option value="Smartphones">Smartphones</option>
              <option value="Tablets">Tablets</option>
              <option value="Zubehör">Zubehör</option>
            </select>
          </div>

          <div className="flex-1">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle Zustände</option>
              {ZUSTAND_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <select
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle Verkäufer</option>
              <option value="official">Nur RevampIT</option>
              <option value="community">Nur Community</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCategory('')
                setCondition('')
                setSellerType('')
                setSearch('')
                setSearchInput('')
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
              title="Filter zurücksetzen"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
              <Grid className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Produkte werden geladen...</span>
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
            onClick={fetchProducts}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keine Produkte gefunden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {search || category || condition || sellerType
              ? 'Versuchen Sie andere Filteroptionen oder entfernen Sie einige Filter.'
              : 'Es sind noch keine Produkte im Marketplace verfügbar.'}
          </p>
          {(search || category || condition || sellerType) && (
            <button
              onClick={() => {
                setCategory('')
                setCondition('')
                setSellerType('')
                setSearch('')
                setSearchInput('')
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const conditionInfo = getConditionDisplay(product.condition)
            return (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300'}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <button className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-red-600 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  {product.isOfficial && (
                    <div className="absolute bottom-2 left-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <TrendingUp className="w-3 h-3" />
                        RevampIT
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {product.title}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      CHF {product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        CHF {product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.seller.name}
                      </span>
                      {product.seller.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.seller.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {product.location}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/marketplace/${product.id}`}
                    className={`block w-full py-2 px-4 rounded-lg font-medium transition-colors text-center ${
                      product.inStock
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    {product.inStock ? 'Details ansehen' : 'Nicht verfügbar'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Seller CTA */}
      {session?.user && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center">
          <Heading level={2} className="mb-4">
            Auf Revamp‑IT verkaufen
          </Heading>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Verkaufen Sie Ihre eigenen refurbished Produkte direkt über den Revamp‑IT Marketplace.
            Erreichen Sie Käufer ohne Zwischenlagerung – Versand direkt von Ihnen zum Käufer.
          </p>
          <Link
            href="/dashboard/seller"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Jetzt verkaufen
            <Package className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Empty State for non-logged-in users */}
      {!session?.user && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Melden Sie sich an, um Produkte zu kaufen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie ein Konto, um Produkte in den Warenkorb zu legen und zu kaufen.
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
