"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, Package, Search, Filter, Heart, Briefcase, Tv, Gamepad2, Palette, Code, GraduationCap } from "lucide-react";

// Customer profile data
const PROFILE_ICONS: Record<string, React.ReactNode> = {
  oma: <Heart className="w-3 h-3" />,
  buero: <Briefcase className="w-3 h-3" />,
  chiller: <Tv className="w-3 h-3" />,
  gamer: <Gamepad2 className="w-3 h-3" />,
  kreativ: <Palette className="w-3 h-3" />,
  dev: <Code className="w-3 h-3" />,
  student: <GraduationCap className="w-3 h-3" />,
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neu',
  like_new: 'Wie neu',
  good: 'Gut',
  fair: 'Akzeptabel',
  poor: 'Gebraucht',
}

// Product type
interface ShopProduct {
  id: string
  item_uuid: string
  title: string
  brand: string
  model: string
  description: string | null
  price: number
  condition: string
  category: string | null
  quantity: number
  image_url: string | null
  customer_profiles: Array<{ slug: string; name_de: string; color: string }>
}

// Hero Banner Component
function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium mb-4">
              🌱 Nachhaltig & Hochwertig
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Technologie,
              <br />
              <span className="text-amber-300">neu gedacht.</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-6 max-w-lg">
              Professionell aufbereitete Computer & IT-Geräte –
              gut für dein Portemonnaie und unseren Planeten.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="#products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors shadow-lg"
              >
                🛒 Jetzt stöbern
              </Link>
            </div>
          </div>

          <div className="flex-shrink-0 grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: "🔧", label: "Geprüfte Qualität" },
              { icon: "🌱", label: "Nachhaltig" },
              { icon: "💬", label: "Support" },
              { icon: "📦", label: "Schneller Versand" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/10"
              >
                <span className="text-2xl sm:text-3xl block mb-2">{item.icon}</span>
                <div className="font-semibold text-sm sm:text-base">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Trust Badges Section
function TrustBadges() {
  const badges = [
    { icon: "🔧", label: "Geprüfte Qualität", desc: "Jedes Gerät wird technisch überprüft" },
    { icon: "📦", label: "Schneller Versand", desc: "Innerhalb von 2-3 Werktagen" },
    { icon: "🌱", label: "Nachhaltig", desc: "Gut für die Umwelt" },
    { icon: "💬", label: "Support", desc: "Persönliche Beratung" },
  ];

  return (
    <section className="py-6 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {badges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{badge.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{badge.label}</div>
                <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <Link
      href={`/shop/medusa/products/${product.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
    >
      {/* Product Image */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Condition Badge */}
        <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded-full text-gray-700">
          {CONDITION_LABELS[product.condition] || product.condition}
        </span>

        {/* Stock Badge */}
        {product.quantity <= 1 && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
            Nur 1 verfügbar
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {product.brand}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
          {product.model}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Customer Profiles */}
        {product.customer_profiles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.customer_profiles.slice(0, 3).map((profile) => (
              <span
                key={profile.slug}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: profile.color }}
              >
                {PROFILE_ICONS[profile.slug]}
                {profile.name_de}
              </span>
            ))}
            {product.customer_profiles.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{product.customer_profiles.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-emerald-600">
            CHF {product.price.toFixed(2)}
          </div>
          <button className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  )
}

// Products Grid Component
function ProductsGrid() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (selectedProfile) params.set('profile', selectedProfile)

        const response = await fetch(`/api/shop/inventory?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch products')

        const data = await response.json()
        setProducts(data.products || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [search, selectedProfile])

  const profiles = [
    { slug: 'oma', name: 'Oma/Opa', icon: PROFILE_ICONS.oma, color: '#EC4899' },
    { slug: 'buero', name: 'Büro', icon: PROFILE_ICONS.buero, color: '#3B82F6' },
    { slug: 'chiller', name: 'Chiller', icon: PROFILE_ICONS.chiller, color: '#8B5CF6' },
    { slug: 'gamer', name: 'Gamer', icon: PROFILE_ICONS.gamer, color: '#EF4444' },
    { slug: 'kreativ', name: 'Kreativ', icon: PROFILE_ICONS.kreativ, color: '#F59E0B' },
    { slug: 'dev', name: 'Entwickler', icon: PROFILE_ICONS.dev, color: '#10B981' },
    { slug: 'student', name: 'Student', icon: PROFILE_ICONS.student, color: '#06B6D4' },
  ]

  return (
    <div id="products" className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Produkte suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Profile Filters */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Für wen suchst du?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedProfile(null)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedProfile === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            {profiles.map((profile) => (
              <button
                key={profile.slug}
                onClick={() => setSelectedProfile(profile.slug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedProfile === profile.slug
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedProfile === profile.slug ? { backgroundColor: profile.color } : {}}
              >
                {profile.icon}
                {profile.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Produkte gefunden</h3>
          <p className="text-gray-600">
            {search || selectedProfile
              ? 'Versuche andere Suchkriterien.'
              : 'Schau bald wieder vorbei – wir haben immer neue Geräte!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MedusaShopPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Products Grid */}
        <ProductsGrid />
      </div>
    </div>
  );
}