'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Send, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, Filter, BarChart3, ChevronRight, HelpCircle
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort } from '@/lib/date-formats'
import {
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  BUDGET_TIERS,
  OFFER_STATUSES,
  REQUEST_STATUSES,
  IT_HILFE,
  SWISS_CANTONS,
  getCategoryById,
  getUrgencyById,
  getBudgetTierById,
  getSkillById,
} from '@/config/it-hilfe'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatchingRequest {
  id: string
  title: string
  description: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  urgency: string
  budgetType: string
  budgetAmountCents: number | null
  budgetTier: string | null
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  offerCount: number
  createdAt: string
  requesterName: string
}

interface HelperOffer {
  id: string
  status: string
  message: string
  proposedCompensation: string | null
  estimatedTime: string | null
  relevantSkills: string[]
  createdAt: string
  request: {
    id: string
    title: string
    categoryId: string
    urgency: string
    budgetTier: string | null
    city: string
    canton: string
    status: string
    createdAt: string
  }
}

type TabId = 'matching' | 'offers' | 'stats'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HelperDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>('matching')

  // Matching requests state
  const [requests, setRequests] = useState<MatchingRequest[]>([])
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [requestsLoading, setRequestsLoading] = useState(true)

  // Offers state
  const [offers, setOffers] = useState<HelperOffer[]>([])
  const [offersTotal, setOffersTotal] = useState(0)
  const [offersLoading, setOffersLoading] = useState(true)

  // Shared
  const [error, setError] = useState<string | null>(null)

  // Filters (matching requests)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterUrgency, setFilterUrgency] = useState('')
  const [filterCanton, setFilterCanton] = useState('')

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchMatchingRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory) params.set('category', filterCategory)
      if (filterUrgency) params.set('urgency', filterUrgency)
      if (filterCanton) params.set('canton', filterCanton)
      const qs = params.toString()
      const url = `/api/it-hilfe/helper/matching-requests${qs ? `?${qs}` : ''}`

      const result = await apiFetch<{
        requests: MatchingRequest[]
        total: number
      }>(url)

      if (result.success && result.data) {
        setRequests(result.data.requests)
        setRequestsTotal(result.data.total)
      } else {
        setError(result.error || 'Fehler beim Laden der Anfragen')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setRequestsLoading(false)
    }
  }, [filterCategory, filterUrgency, filterCanton])

  const fetchOffers = useCallback(async () => {
    setOffersLoading(true)
    try {
      const result = await apiFetch<{
        offers: HelperOffer[]
        total: number
      }>('/api/it-hilfe/helper/my-offers')

      if (result.success && result.data) {
        setOffers(result.data.offers)
        setOffersTotal(result.data.total)
      } else {
        setError(result.error || 'Fehler beim Laden der Angebote')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setOffersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatchingRequests()
  }, [fetchMatchingRequests])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  // -------------------------------------------------------------------------
  // Stats (computed from offers)
  // -------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = offers.length
    const accepted = offers.filter(o => o.status === 'accepted').length
    const pending = offers.filter(o => o.status === 'pending').length
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0
    return { total, accepted, pending, rate }
  }, [offers])

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getOfferStatusBadge = (status: string) => {
    const s = OFFER_STATUSES.find(os => os.id === status)
    return s ? { label: s.name, className: s.badgeClass } : { label: status, className: 'bg-gray-100 text-gray-700' }
  }

  const getRequestStatusBadge = (status: string) => {
    const s = REQUEST_STATUSES.find(rs => rs.id === status)
    return s ? { label: s.name, className: s.badgeClass } : { label: status, className: 'bg-gray-100 text-gray-700' }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'matching', label: 'Passende Anfragen', icon: <Search className="h-4 w-4" />, count: requestsTotal },
    { id: 'offers', label: 'Meine Angebote', icon: <Send className="h-4 w-4" />, count: offersTotal },
    { id: 'stats', label: 'Statistiken', icon: <BarChart3 className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            IT-Hilfe Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Finden Sie passende Anfragen und verwalten Sie Ihre Angebote
          </p>
        </div>
        <button
          onClick={() => {
            fetchMatchingRequests()
            fetchOffers()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Passende Anfragen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{requestsTotal}</p>
            </div>
            <Search className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Angebote gesendet</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Send className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Akzeptiert</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Erfolgsquote</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rate}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
              (activeTab === tab.id
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700')
            }
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'matching' && (
        <MatchingRequestsTab
          requests={requests}
          loading={requestsLoading}
          filterCategory={filterCategory}
          filterUrgency={filterUrgency}
          filterCanton={filterCanton}
          onFilterCategory={setFilterCategory}
          onFilterUrgency={setFilterUrgency}
          onFilterCanton={setFilterCanton}
        />
      )}

      {activeTab === 'offers' && (
        <MyOffersTab
          offers={offers}
          loading={offersLoading}
          getOfferStatusBadge={getOfferStatusBadge}
          getRequestStatusBadge={getRequestStatusBadge}
        />
      )}

      {activeTab === 'stats' && (
        <StatsTab stats={stats} offers={offers} getOfferStatusBadge={getOfferStatusBadge} />
      )}
    </div>
  )
}

// ===========================================================================
// Tab 1: Matching Requests
// ===========================================================================

function MatchingRequestsTab({
  requests,
  loading,
  filterCategory,
  filterUrgency,
  filterCanton,
  onFilterCategory,
  onFilterUrgency,
  onFilterCanton,
}: {
  requests: MatchingRequest[]
  loading: boolean
  filterCategory: string
  filterUrgency: string
  filterCanton: string
  onFilterCategory: (v: string) => void
  onFilterUrgency: (v: string) => void
  onFilterCanton: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterCategory}
            onChange={e => onFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Alle Kategorien</option>
            {DEVICE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterUrgency}
            onChange={e => onFilterUrgency(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Alle Dringlichkeiten</option>
            {URGENCY_LEVELS.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={filterCanton}
            onChange={e => onFilterCanton(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Alle Kantone</option>
            {SWISS_CANTONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <HelpCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">Keine passenden Anfragen gefunden</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Erweitern Sie Ihre Skills unter{' '}
            <Link href={IT_HILFE.routes.register} className="text-blue-600 hover:underline">
              Profil / Skills
            </Link>
            , um mehr Anfragen zu sehen.
          </p>
        </div>
      )}

      {/* Request Cards */}
      {!loading && requests.map(req => {
        const category = getCategoryById(req.categoryId)
        const urgency = getUrgencyById(req.urgency || 'normal')
        const budgetTier = req.budgetTier ? getBudgetTierById(req.budgetTier) : null

        return (
          <div
            key={req.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {category && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {category.name}
                    </span>
                  )}
                  {urgency && (
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + urgency.badgeClass}>
                      {urgency.name}
                    </span>
                  )}
                  {budgetTier && (
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + budgetTier.badgeClass}>
                      {budgetTier.name}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                  {formatDateShort(req.createdAt)}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{req.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{req.description}</p>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{req.city}, {req.canton}</span>
                {req.offerCount > 0 && (
                  <span>{req.offerCount} Angebot{req.offerCount !== 1 ? 'e' : ''}</span>
                )}
              </div>

              {/* Skills */}
              {req.skillsNeeded.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {req.skillsNeeded.map(skillId => {
                    const skill = getSkillById(skillId)
                    return (
                      <span
                        key={skillId}
                        className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {skill?.name || skillId}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href={IT_HILFE.routes.detail(req.id)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Angebot erstellen
                </Link>
                <Link
                  href={IT_HILFE.routes.detail(req.id)}
                  className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 ml-auto"
                >
                  Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ===========================================================================
// Tab 2: My Offers
// ===========================================================================

function MyOffersTab({
  offers,
  loading,
  getOfferStatusBadge,
  getRequestStatusBadge,
}: {
  offers: HelperOffer[]
  loading: boolean
  getOfferStatusBadge: (s: string) => { label: string; className: string }
  getRequestStatusBadge: (s: string) => { label: string; className: string }
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <Send className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">Noch keine Angebote erstellt</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Schauen Sie sich die passenden Anfragen an und erstellen Sie Ihr erstes Angebot.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {offers.map(offer => {
        const offerBadge = getOfferStatusBadge(offer.status)
        const requestBadge = getRequestStatusBadge(offer.request.status)
        const category = getCategoryById(offer.request.categoryId)

        return (
          <div
            key={offer.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={'px-3 py-1 rounded-full text-sm font-medium ' + offerBadge.className}>
                    {offerBadge.label}
                  </span>
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + requestBadge.className}>
                    Anfrage: {requestBadge.label}
                  </span>
                  {category && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {category.name}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                  {formatDateShort(offer.createdAt)}
                </span>
              </div>

              {/* Request title */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {offer.request.title}
              </h3>

              {/* Offer message preview */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {offer.message}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                {offer.proposedCompensation && (
                  <span>Vergütung: {offer.proposedCompensation}</span>
                )}
                {offer.estimatedTime && (
                  <span>Geschätzte Zeit: {offer.estimatedTime}</span>
                )}
                <span>{offer.request.city}, {offer.request.canton}</span>
              </div>

              {/* Link */}
              <div className="flex items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href={IT_HILFE.routes.detail(offer.request.id)}
                  className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 ml-auto"
                >
                  Anfrage ansehen
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ===========================================================================
// Tab 3: Stats
// ===========================================================================

function StatsTab({
  stats,
  offers,
  getOfferStatusBadge,
}: {
  stats: { total: number; accepted: number; pending: number; rate: number }
  offers: HelperOffer[]
  getOfferStatusBadge: (s: string) => { label: string; className: string }
}) {
  // Group offers by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of offers) {
      counts[o.status] = (counts[o.status] || 0) + 1
    }
    return counts
  }, [offers])

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Angebote</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Akzeptiert</p>
          <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Erfolgsquote</p>
          <p className="text-3xl font-bold text-blue-600">{stats.rate}%</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Aufschlüsselung nach Status</h3>
        {Object.keys(statusCounts).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Noch keine Daten vorhanden</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const badge = getOfferStatusBadge(status)
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={'px-3 py-1 rounded-full text-sm font-medium min-w-[120px] text-center ' + badge.className}>
                    {badge.label}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
