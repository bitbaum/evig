'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  Search,
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Heart,
  Users,
  HelpCircle,
} from 'lucide-react'
import {
  IT_HILFE,
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SWISS_CANTONS,
  SORT_OPTIONS,
} from '@/config/it-hilfe'
import { IT_HILFE_CONTENT } from '@/config/page-content'
import { RequestCard, RequestCardGrid } from '@/components/it-hilfe/RequestCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'

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

export default function ITHilfePage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<ITHilfeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search and Sort
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  // Pagination
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Filters
  const [category, setCategory] = useState('')
  const [canton, setCanton] = useState('')
  const [urgency, setUrgency] = useState('')
  const [budgetType, setBudgetType] = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()

      if (category) params.set('category', category)
      if (canton) params.set('canton', canton)
      if (urgency) params.set('urgency', urgency)
      if (budgetType) params.set('budgetType', budgetType)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)
      params.set('limit', String(limit))
      params.set('offset', String(offset))

      const response = await fetch(`/api/it-hilfe/requests?${params}`)

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Anfragen')
      }

      const data = await response.json()

      if (data.success) {
        setRequests(data.data.requests)
        setTotal(data.data.total)
      } else {
        setError(data.error || 'Fehler beim Laden der Anfragen')
      }
    } catch (error) {
      logger.error('Error fetching IT-Hilfe requests', { error })
      setError('Fehler beim Laden der Anfragen. Bitte versuche es erneut.')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [category, canton, urgency, budgetType, search, sort, limit, offset])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setOffset(0)
  }

  const clearFilters = () => {
    setCategory('')
    setCanton('')
    setUrgency('')
    setBudgetType('')
    setSearch('')
    setSearchInput('')
    setSort('newest')
    setOffset(0)
  }

  const hasActiveFilters = category || canton || urgency || budgetType || search

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const goToPage = (page: number) => {
    setOffset((page - 1) * limit)
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section - Matching homepage style */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Icon Badge */}
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                <Wrench className="h-8 w-8 text-emerald-600" />
              </div>
            </div>

            <Heading level={1} className="tracking-tight text-gray-900">
              IT-Hilfe
            </Heading>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
              {IT_HILFE.description}. Finde Hilfe in deiner Nähe oder biete deine Skills an.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Anfragen durchsuchen..."
                  className="w-full pl-12 pr-24 py-3.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-md transition-colors text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Suchen
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-600" />
                <span><strong>{total}</strong> {total === 1 ? 'Anfrage' : 'Anfragen'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>Community-Techniker</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-600" />
                <span>Kostenlos helfen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Quick Actions - Card Style */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {session?.user ? (
              <Link
                href={IT_HILFE.routes.create}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Plus className="w-4 h-4" />
                Anfrage erstellen
              </Link>
            ) : (
              <Link
                href={`/auth/login?callbackUrl=${IT_HILFE.routes.create}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Plus className="w-4 h-4" />
                Anmelden & Anfrage erstellen
              </Link>
            )}

            <Link
              href={IT_HILFE.routes.helpers}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <Users className="w-4 h-4" />
              Techniker finden
            </Link>

            <Link
              href={session?.user ? IT_HILFE.routes.register : `/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <Wrench className="w-4 h-4" />
              Techniker werden
            </Link>

            {session?.user && (
              <>
                <Link
                  href={IT_HILFE.routes.my}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Meine Anfragen
                </Link>
                <Link
                  href={IT_HILFE.routes.myOffers}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Meine Angebote
                </Link>
              </>
            )}
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
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-label="Aktive Filter" />
              )}
            </button>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setOffset(0)
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label="Sortierung"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
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
                  <label htmlFor="filter-category" className="block text-xs font-medium text-gray-700 mb-2">
                    Gerätekategorie
                  </label>
                  <select
                    id="filter-category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Alle Kategorien</option>
                    {DEVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-canton" className="block text-xs font-medium text-gray-700 mb-2">
                    Kanton
                  </label>
                  <select
                    id="filter-canton"
                    value={canton}
                    onChange={(e) => {
                      setCanton(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Alle Kantone</option>
                    {SWISS_CANTONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-urgency" className="block text-xs font-medium text-gray-700 mb-2">
                    Dringlichkeit
                  </label>
                  <select
                    id="filter-urgency"
                    value={urgency}
                    onChange={(e) => {
                      setUrgency(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    {URGENCY_LEVELS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-budget" className="block text-xs font-medium text-gray-700 mb-2">
                    Budget
                  </label>
                  <select
                    id="filter-budget"
                    value={budgetType}
                    onChange={(e) => {
                      setBudgetType(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    <option value="free">Gratis / Community</option>
                    <option value="paid">Mit Budget</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingSkeleton count={limit} />
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorAlert
            message={error}
            variant="card"
            onRetry={() => {
              setError(null)
              fetchRequests()
            }}
            retryLabel="Erneut versuchen"
          />
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <EmptyState
            icon={Wrench}
            title={IT_HILFE_CONTENT.emptyStates.noRequests.title}
            message={
              hasActiveFilters
                ? IT_HILFE_CONTENT.emptyStates.noRequests.messageFiltered
                : IT_HILFE_CONTENT.emptyStates.noRequests.messageEmpty
            }
            action={
              session?.user
                ? {
                    label: IT_HILFE_CONTENT.actions.createRequest,
                    href: IT_HILFE.routes.create,
                  }
                : undefined
            }
          />
        )}

        {/* Requests Grid */}
        {!loading && !error && requests.length > 0 && (
          <RequestCardGrid>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </RequestCardGrid>
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

        {/* CTA Section for Becoming a Technician */}
        {!session?.user && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Wrench className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Kannst du Geräte reparieren?
            </h3>
            <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
              Registriere dich als Techniker und hilf Menschen in deiner Nähe. Kostenlos oder gegen Vergütung – du entscheidest.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                Techniker-Profil erstellen
              </Link>
              <Link
                href="/it-hilfe"
                className="px-6 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                Mehr über IT-Hilfe →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
