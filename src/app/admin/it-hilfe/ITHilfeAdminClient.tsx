'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  HelpCircle, Users, Search, Loader2, ExternalLink,
  Edit3, X, Clock, ShieldCheck, UserX, UserCheck, Ban,
} from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import {
  DEVICE_CATEGORIES, URGENCY_LEVELS, REQUEST_STATUSES,
  getCategoryById, getUrgencyById, getRequestStatusById,
  getSkillById, formatBudget,
} from '@/config/it-hilfe'
import { SWISS_CANTONS } from '@/config/swiss-cantons'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestRow {
  id: string
  title: string
  category_id: string
  urgency: string
  status: string
  postal_code: string
  city: string
  canton: string
  budget_amount_cents: number | null
  budget_type: string
  offer_count: number
  admin_notes: string | null
  created_at: string
  requester_name: string | null
  requester_email: string
}

interface HelperRow {
  id: string
  user_id: string
  bio: string | null
  hourly_rate_cents: number | null
  accepts_gratis: boolean
  accepts_kulturlegi: boolean
  service_types: string[]
  location_city: string | null
  location_canton: string | null
  is_active: boolean
  is_verified: boolean
  verified_at: string | null
  suspended_at: string | null
  admin_notes: string | null
  total_helps_completed: number
  average_rating: number | null
  created_at: string
  helper_name: string | null
  helper_email: string
  skills: string[] | null
}

interface Stats {
  total: number
  byStatus: Record<string, number>
  byUrgency: Record<string, number>
  activeHelpers: number
  verifiedHelpers: number
  totalOffers: number
  resolutionRate: number
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tab = 'requests' | 'helpers'

const TABS: { id: Tab; label: string; icon: typeof HelpCircle }[] = [
  { id: 'requests', label: 'Anfragen', icon: HelpCircle },
  { id: 'helpers', label: 'Helfer', icon: Users },
]

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof HelpCircle; color: string }) {
  return (
    <div className={`p-4 ${color} rounded-lg border`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 opacity-70" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </div>
    </div>
  )
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = getUrgencyById(urgency)
  if (!config) return <span className="text-xs text-gray-500">{urgency}</span>
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>{config.name}</span>
}

function RequestStatusBadge({ status }: { status: string }) {
  const config = getRequestStatusById(status)
  if (!config) return <span className="text-xs text-gray-500">{status}</span>
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>{config.name}</span>
}

function CategoryIcon({ categoryId }: { categoryId: string }) {
  const cat = getCategoryById(categoryId)
  if (!cat) return null
  const Icon = cat.icon
  return <Icon className="w-4 h-4 text-gray-500" />
}

function SkillTag({ skillId }: { skillId: string }) {
  const skill = getSkillById(skillId)
  return (
    <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      {skill?.name ?? skillId}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ITHilfeAdminClient() {
  const [tab, setTab] = useState<Tab>('requests')
  const [stats, setStats] = useState<Stats | null>(null)

  // Requests state
  const [requests, setRequests] = useState<PaginatedResponse<RequestRow> | null>(null)
  const [reqFilter, setReqFilter] = useState({ status: 'all', category: 'all', urgency: 'all', canton: '', search: '' })
  const [reqOffset, setReqOffset] = useState(0)

  // Helpers state
  const [helpers, setHelpers] = useState<PaginatedResponse<HelperRow> | null>(null)
  const [helpFilter, setHelpFilter] = useState({ status: 'all', canton: '' })
  const [helpOffset, setHelpOffset] = useState(0)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ status: string; urgency: string; admin_notes: string }>({ status: '', urgency: '', admin_notes: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Helper action
  const [actionHelperId, setActionHelperId] = useState<string | null>(null)
  const [helperAction, setHelperAction] = useState<string>('verify')
  const [helperNotes, setHelperNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [loading, setLoading] = useState(true)

  // Fetch stats
  useEffect(() => {
    fetch('/api/admin/it-hilfe/stats')
      .then(r => r.json())
      .then(r => { if (r.success) setStats(r.data) })
  }, [])

  // Fetch functions (for use in event handlers after mutations)
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: reqFilter.status,
      category: reqFilter.category,
      urgency: reqFilter.urgency,
      limit: '50',
      offset: String(reqOffset),
    })
    if (reqFilter.canton) params.set('canton', reqFilter.canton)
    if (reqFilter.search) params.set('search', reqFilter.search)
    const r = await fetch(`/api/admin/it-hilfe?${params}`)
    const data = await r.json()
    if (data.success) setRequests(data.data)
    setLoading(false)
  }, [reqFilter, reqOffset])

  const fetchHelpers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: helpFilter.status,
      limit: '50',
      offset: String(helpOffset),
    })
    if (helpFilter.canton) params.set('canton', helpFilter.canton)
    const r = await fetch(`/api/admin/it-hilfe/helpers?${params}`)
    const data = await r.json()
    if (data.success) setHelpers(data.data)
    setLoading(false)
  }, [helpFilter, helpOffset])

  // Data fetching — subscribe to external API data (valid effect usage)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (tab === 'requests') {
        const params = new URLSearchParams({
          status: reqFilter.status,
          category: reqFilter.category,
          urgency: reqFilter.urgency,
          limit: '50',
          offset: String(reqOffset),
        })
        if (reqFilter.canton) params.set('canton', reqFilter.canton)
        if (reqFilter.search) params.set('search', reqFilter.search)
        const r = await fetch(`/api/admin/it-hilfe?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setRequests(data.data)
      } else {
        const params = new URLSearchParams({ status: helpFilter.status, limit: '50', offset: String(helpOffset) })
        if (helpFilter.canton) params.set('canton', helpFilter.canton)
        const r = await fetch(`/api/admin/it-hilfe/helpers?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setHelpers(data.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tab, reqFilter, reqOffset, helpFilter, helpOffset])

  const refreshStats = () => {
    fetch('/api/admin/it-hilfe/stats').then(r => r.json()).then(r => { if (r.success) setStats(r.data) })
  }

  // Actions
  async function handleEditSave() {
    if (!editId) return
    setEditLoading(true)
    await fetch(`/api/admin/it-hilfe/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setEditLoading(false)
    setEditId(null)
    fetchRequests()
    refreshStats()
  }

  async function handleHelperAction() {
    if (!actionHelperId) return
    setActionLoading(true)
    await fetch(`/api/admin/it-hilfe/helpers/${actionHelperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: helperAction, admin_notes: helperNotes || null }),
    })
    setActionLoading(false)
    setActionHelperId(null)
    setHelperNotes('')
    fetchHelpers()
    refreshStats()
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Offene Anfragen" value={stats.byStatus.open ?? 0} icon={HelpCircle} color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" />
          <StatsCard label="Aktive Helfer" value={stats.activeHelpers} icon={Users} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" />
          <StatsCard label="Dringend" value={stats.byUrgency.urgent ?? 0} icon={Clock} color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" />
          <StatsCard label="Lösungsrate" value={`${stats.resolutionRate}%`} icon={ShieldCheck} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setReqOffset(0); setHelpOffset(0) }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading && !requests && !helpers ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* ---- REQUESTS TAB ---- */}
          {tab === 'requests' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={reqFilter.status} onChange={e => { setReqFilter(f => ({ ...f, status: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Status</option>
                  {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={reqFilter.category} onChange={e => { setReqFilter(f => ({ ...f, category: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Kategorien</option>
                  {DEVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={reqFilter.urgency} onChange={e => { setReqFilter(f => ({ ...f, urgency: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Dringlichkeiten</option>
                  {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={reqFilter.canton} onChange={e => { setReqFilter(f => ({ ...f, canton: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="">Alle Kantone</option>
                  {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={reqFilter.search}
                    onChange={e => { setReqFilter(f => ({ ...f, search: e.target.value })); setReqOffset(0) }}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Titel</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Kategorie</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Dringlichkeit</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Ersteller</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Kanton</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Budget</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Angebote</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Datum</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {requests?.items.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <a href={`/it-hilfe/${r.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white hover:text-blue-600 flex items-center gap-1">
                            {r.title} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CategoryIcon categoryId={r.category_id} />
                            <span className="text-gray-600 dark:text-gray-400">{getCategoryById(r.category_id)?.name ?? r.category_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><UrgencyBadge urgency={r.urgency} /></td>
                        <td className="px-4 py-3"><RequestStatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.requester_name || r.requester_email}</td>
                        <td className="px-4 py-3 text-gray-500">{r.canton}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatBudget(r.budget_amount_cents, r.budget_type)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${Number(r.offer_count) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.offer_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateShort(r.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setEditId(r.id); setEditData({ status: r.status, urgency: r.urgency, admin_notes: r.admin_notes || '' }) }}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-4 h-4 text-blue-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {requests && requests.items.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Keine Anfragen gefunden</div>
                )}
              </div>

              {requests && requests.pagination.total > 50 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{requests.pagination.total} Anfragen</span>
                  <div className="flex gap-2">
                    <button disabled={reqOffset === 0} onClick={() => setReqOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
                    <button disabled={!requests.pagination.hasMore} onClick={() => setReqOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- HELPERS TAB ---- */}
          {tab === 'helpers' && (
            <div className="space-y-4">
              {/* Helper stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <StatsCard label="Aktiv" value={stats.activeHelpers} icon={UserCheck} color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" />
                  <StatsCard label="Verifiziert" value={stats.verifiedHelpers} icon={ShieldCheck} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" />
                  <StatsCard label="Total Angebote" value={stats.totalOffers} icon={HelpCircle} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={helpFilter.status} onChange={e => { setHelpFilter(f => ({ ...f, status: e.target.value })); setHelpOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Helfer</option>
                  <option value="active">Aktiv</option>
                  <option value="verified">Verifiziert</option>
                  <option value="suspended">Gesperrt</option>
                </select>
                <select value={helpFilter.canton} onChange={e => { setHelpFilter(f => ({ ...f, canton: e.target.value })); setHelpOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="">Alle Kantone</option>
                  {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Fähigkeiten</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Kanton</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Tarif</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Hilfe</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {helpers?.items.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{h.helper_name || h.helper_email}</span>
                            {h.accepts_gratis && <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700">Gratis</span>}
                            {h.accepts_kulturlegi && <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700">KulturLegi</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(h.skills ?? []).slice(0, 5).map(s => <SkillTag key={s} skillId={s} />)}
                            {(h.skills ?? []).length > 5 && <span className="text-[10px] text-gray-400">+{(h.skills ?? []).length - 5}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{h.location_canton ?? '–'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {h.hourly_rate_cents ? `CHF ${(h.hourly_rate_cents / 100).toFixed(0)}/h` : '–'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {h.suspended_at ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Gesperrt</span>
                            ) : h.is_verified ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Verifiziert</span>
                            ) : h.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Aktiv</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inaktiv</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{h.total_helps_completed}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!h.is_verified && !h.suspended_at && (
                              <button
                                onClick={() => { setActionHelperId(h.id); setHelperAction('verify'); setHelperNotes('') }}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Verifizieren"
                              >
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                              </button>
                            )}
                            {!h.suspended_at && (
                              <button
                                onClick={() => { setActionHelperId(h.id); setHelperAction('suspend'); setHelperNotes('') }}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Sperren"
                              >
                                <Ban className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                            {h.suspended_at && (
                              <button
                                onClick={() => { setActionHelperId(h.id); setHelperAction('reactivate'); setHelperNotes('') }}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Reaktivieren"
                              >
                                <UserCheck className="w-4 h-4 text-blue-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {helpers && helpers.items.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Keine Helfer gefunden</div>
                )}
              </div>

              {helpers && helpers.pagination.total > 50 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{helpers.pagination.total} Helfer</span>
                  <div className="flex gap-2">
                    <button disabled={helpOffset === 0} onClick={() => setHelpOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
                    <button disabled={!helpers.pagination.hasMore} onClick={() => setHelpOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Request Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Anfrage bearbeiten</h3>
              <button onClick={() => setEditId(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dringlichkeit</label>
                <select value={editData.urgency} onChange={e => setEditData(d => ({ ...d, urgency: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin-Notizen</label>
                <textarea
                  value={editData.admin_notes}
                  onChange={e => setEditData(d => ({ ...d, admin_notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Interne Notizen..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditId(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
                <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper Action Modal */}
      {actionHelperId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActionHelperId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {helperAction === 'verify' ? 'Helfer verifizieren' : helperAction === 'suspend' ? 'Helfer sperren' : 'Helfer reaktivieren'}
              </h3>
              <button onClick={() => setActionHelperId(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
                <textarea
                  value={helperNotes}
                  onChange={e => setHelperNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Begründung (optional)..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setActionHelperId(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
                <button
                  onClick={handleHelperAction}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
                    helperAction === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bestätigen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
