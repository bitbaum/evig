'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import {
  Search,
  MapPin,
  Clock,
  Users,
  Plus,
  Filter,
  ChevronDown,
  Wrench,
  Heart,
} from 'lucide-react'
import {
  IT_HILFE,
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  SWISS_CANTONS,
  getCategoryById,
  getUrgencyById,
  getServiceTypeById,
  formatBudget,
} from '@/config/it-hilfe'

interface ITHilfeRequest {
  id: string
  requesterId: string
  requesterName: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  title: string
  description: string
  urgency: string
  budgetType: string
  budgetAmountCents: number | null
  postalCode: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  imageUrls: string[]
  status: string
  offerCount: number
  expiresAt: string
  createdAt: string
}

// Swiss cantons imported from config (SSOT)

export default function ITHilfePage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<ITHilfeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [category, setCategory] = useState('')
  const [canton, setCanton] = useState('')
  const [urgency, setUrgency] = useState('')
  const [budgetType, setBudgetType] = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (category) params.set('category', category)
      if (canton) params.set('canton', canton)
      if (urgency) params.set('urgency', urgency)
      if (budgetType) params.set('budgetType', budgetType)

      const response = await fetch(`/api/it-hilfe/requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.data.requests)
        setTotal(data.data.total)
      }
    } catch (error) {
      logger.error('Error fetching IT-Hilfe requests', { error })
    } finally {
      setLoading(false)
    }
  }, [category, canton, urgency, budgetType])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const clearFilters = () => {
    setCategory('')
    setCanton('')
    setUrgency('')
    setBudgetType('')
  }

  const hasActiveFilters = category || canton || urgency || budgetType

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Wrench className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold">{IT_HILFE.name}</h1>
          </div>
          <p className="text-emerald-100 text-lg max-w-2xl mb-8">
            {IT_HILFE.description}. Finde Hilfe in deiner Nähe oder biete deine Skills an.
          </p>

          <div className="flex flex-wrap gap-4">
            {session?.user ? (
              <Link
                href={IT_HILFE.routes.create}
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Anfrage erstellen
              </Link>
            ) : (
              <Link
                href={`/auth/login?callbackUrl=${IT_HILFE.routes.create}`}
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Anmelden & Anfrage erstellen
              </Link>
            )}

            <Link
              href={IT_HILFE.routes.helpers}
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Users className="w-5 h-5" aria-hidden="true" />
              Techniker finden
            </Link>

            <Link
              href={session?.user ? IT_HILFE.routes.register : `/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
              className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Wrench className="w-5 h-5" aria-hidden="true" />
              Techniker werden
            </Link>

            {session?.user && (
              <>
                <Link
                  href={IT_HILFE.routes.my}
                  className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Meine Anfragen
                </Link>
                <Link
                  href={IT_HILFE.routes.myOffers}
                  className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Heart className="w-5 h-5" aria-hidden="true" />
                  Meine Angebote
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              Filter
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Filter zurücksetzen
              </button>
            )}

            <div className="ml-auto text-sm text-gray-500">
              {total} {total === 1 ? 'Anfrage' : 'Anfragen'} gefunden
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gerätekategorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <option value="">Alle Kategorien</option>
                  {DEVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Canton filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kanton
                </label>
                <select
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <option value="">Alle Kantone</option>
                  {SWISS_CANTONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dringlichkeit
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <option value="">Alle</option>
                  {URGENCY_LEVELS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget filter - simplified */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <select
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <option value="">Alle</option>
                  <option value="free">Gratis / Community</option>
                  <option value="paid">Mit Budget</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Anfragen gefunden
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Versuche andere Filter oder setze sie zurück.'
                : 'Sei der Erste, der eine Reparaturanfrage stellt!'}
            </p>
            {session?.user && (
              <Link
                href={IT_HILFE.routes.create}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Anfrage erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {requests.map((req) => {
              const categoryConfig = getCategoryById(req.categoryId)
              const urgencyConfig = getUrgencyById(req.urgency)
              const CategoryIcon = categoryConfig?.icon || Wrench

              return (
                <Link
                  key={req.id}
                  href={IT_HILFE.routes.detail(req.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 ${categoryConfig?.color || 'bg-gray-500'} rounded-lg`}>
                        <CategoryIcon className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
                        {urgencyConfig?.name || req.urgency}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {req.title}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {req.description}
                    </p>

                    {/* Device info */}
                    {(req.deviceBrand || req.deviceModel) && (
                      <p className="text-xs text-gray-500 mb-3">
                        {[req.deviceBrand, req.deviceModel].filter(Boolean).join(' ')}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <span>{req.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        <span>{req.offerCount} {req.offerCount === 1 ? 'Angebot' : 'Angebote'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600">
                      {formatBudget(req.budgetAmountCents)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateShort(req.createdAt)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Technician Registration CTA */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl px-6 py-12 md:px-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Kannst du Geräte reparieren?
          </h2>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-6">
            Registriere dich als Techniker und hilf Menschen in deiner Nähe. Kostenlos oder gegen Vergütung — du entscheidest.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">Flexible Zeiten</span>
            <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">Gratis oder bezahlt</span>
            <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">Hilf deiner Community</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={session?.user ? IT_HILFE.routes.register : `/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Wrench className="w-5 h-5" aria-hidden="true" />
              Techniker-Profil erstellen
            </Link>
            <Link
              href={IT_HILFE.routes.browse}
              className="text-sm font-semibold text-white hover:text-emerald-100 transition-colors"
            >
              Mehr über IT-Hilfe →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
