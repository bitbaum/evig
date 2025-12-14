import { Metadata } from 'next'
import { auth } from '@/auth'
import Link from 'next/link'
import {
  Package,
  Search,
  Filter,
  Grid,
  List,
  Star,
  MapPin,
  User,
  Heart,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Marketplace | RevampIT',
  description: 'Entdecken Sie refurbished Produkte von RevampIT und unserer Community.',
}

interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  condition: 'new' | 'like_new' | 'good' | 'fair'
  category: string
  location: string
  seller: {
    name: string
    rating: number
    verified: boolean
  }
  images: string[]
  isOfficial: boolean
  inStock: boolean
}

export default async function MarketplacePage() {
  const session = await auth()

  // Mock marketplace data - in real app, this would come from API
  const products: Product[] = [
    // Official RevampIT products
    {
      id: 'official_1',
      title: 'Refurbished MacBook Pro 14" M2',
      price: 1299,
      originalPrice: 1999,
      condition: 'like_new',
      category: 'Laptops',
      location: 'Zürich',
      seller: { name: 'RevampIT', rating: 4.9, verified: true },
      images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300'],
      isOfficial: true,
      inStock: true,
    },
    {
      id: 'official_2',
      title: 'Gaming Desktop PC i7-12700K',
      price: 1899,
      originalPrice: 2499,
      condition: 'new',
      category: 'Desktop PCs',
      location: 'Bern',
      seller: { name: 'RevampIT', rating: 4.9, verified: true },
      images: ['https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300'],
      isOfficial: true,
      inStock: true,
    },
    // Community seller products
    {
      id: 'seller_1',
      title: 'MacBook Air M1 - Perfekt Zustand',
      price: 899,
      originalPrice: 1199,
      condition: 'like_new',
      category: 'Laptops',
      location: 'Basel',
      seller: { name: 'Anna M.', rating: 4.7, verified: true },
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300'],
      isOfficial: false,
      inStock: true,
    },
    {
      id: 'seller_2',
      title: 'Dell XPS 13 - Studenten-PC',
      price: 699,
      originalPrice: 999,
      condition: 'good',
      category: 'Laptops',
      location: 'Genève',
      seller: { name: 'Marco L.', rating: 4.5, verified: false },
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300'],
      isOfficial: false,
      inStock: true,
    },
    {
      id: 'seller_3',
      title: '27" 4K Monitor - LG',
      price: 349,
      originalPrice: 599,
      condition: 'good',
      category: 'Monitore',
      location: 'Zürich',
      seller: { name: 'Sarah K.', rating: 4.8, verified: true },
      images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300'],
      isOfficial: false,
      inStock: false,
    },
  ]

  const getConditionLabel = (condition: Product['condition']) => {
    switch (condition) {
      case 'new': return { label: 'Neu', color: 'bg-green-100 text-green-800' }
      case 'like_new': return { label: 'Wie neu', color: 'bg-blue-100 text-blue-800' }
      case 'good': return { label: 'Gut', color: 'bg-yellow-100 text-yellow-800' }
      case 'fair': return { label: 'Akzeptabel', color: 'bg-orange-100 text-orange-800' }
    }
  }

  const stats = {
    totalProducts: products.length,
    officialProducts: products.filter(p => p.isOfficial).length,
    communityProducts: products.filter(p => !p.isOfficial).length,
    averagePrice: Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length),
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            RevampIT Marketplace
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Entdecken Sie hochwertige refurbished Produkte von RevampIT und unserer Community
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Produkten..."
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">RevampIT Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.officialProducts}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Community Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.communityProducts}</p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ø Preis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">CHF {stats.averagePrice}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Alle Kategorien</option>
              <option value="laptops">Laptops</option>
              <option value="desktop-pcs">Desktop PCs</option>
              <option value="monitore">Monitore</option>
              <option value="zubehoer">Zubehör</option>
            </select>
          </div>

          <div className="flex-1">
            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Alle Zustände</option>
              <option value="new">Neu</option>
              <option value="like_new">Wie neu</option>
              <option value="good">Gut</option>
              <option value="fair">Akzeptabel</option>
            </select>
          </div>

          <div className="flex-1">
            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Alle Verkäufer</option>
              <option value="official">Nur RevampIT</option>
              <option value="community">Nur Community</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
              <Grid className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const conditionInfo = getConditionLabel(product.condition)
          return (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative">
                <img
                  src={product.images[0]}
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
                  {product.originalPrice && (
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
                      {product.seller.rating}
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
                <button
                  disabled={!product.inStock}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    product.inStock
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.inStock ? 'In den Warenkorb' : 'Nicht verfügbar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Seller CTA */}
      {session?.user && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            Auf Revamp‑IT verkaufen
          </h2>
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





