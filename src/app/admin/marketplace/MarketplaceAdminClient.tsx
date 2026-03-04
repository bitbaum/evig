'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, AlertTriangle, ShoppingBag, ShieldCheck, Store,
  Search, Loader2, ExternalLink, Trash2, Edit3, Eye, X, Clock,
} from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { formatPrice } from '@/config/marketplace'
import { getCategoryLabel, LISTING_STATUS_CONFIG, ORDER_STATUS_CONFIG, REPORT_REASONS } from '@/config/marketplace'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { getConditionLabel } from '@/config/erfassung/conditions'
import { VerifyActions } from './VerifyActions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingRow {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string | null
  status: string
  is_revampit: boolean
  verified_at: string | null
  admin_notes: string | null
  created_at: string
  seller_name: string | null
  seller_email: string
  report_count: string
}

interface ReportRow {
  id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  reviewed_at: string | null
  resolution_notes: string | null
  resolution_action: string | null
  listing_id: string
  listing_title: string
  listing_status: string
  reporter_name: string | null
  reporter_email: string
  seller_name: string | null
  seller_email: string
}

interface OrderRow {
  id: string
  status: string
  total_cents: number
  delivery_method: string
  tracking_number: string | null
  created_at: string
  listing_id: string
  listing_title: string
  buyer_name: string | null
  buyer_email: string
  seller_name: string | null
  seller_email: string
}

interface Stats {
  total: number
  byStatus: Record<string, number>
  verified: number
  unverified: number
  revampit: number
  community: number
  openReports: number
  totalOrders: number
  revenueCents: number
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tab = 'listings' | 'reports' | 'orders'

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'listings', label: 'Inserate', icon: Package },
  { id: 'reports', label: 'Meldungen', icon: AlertTriangle },
  { id: 'orders', label: 'Bestellungen', icon: ShoppingBag },
]

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; color: string }> }) {
  const cfg = config[status]
  if (!cfg) return <span className="text-xs text-gray-500">{status}</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Package; color: string }) {
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

function getReportReasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketplaceAdminClient() {
  const [tab, setTab] = useState<Tab>('listings')
  const [stats, setStats] = useState<Stats | null>(null)

  // Listings state
  const [listings, setListings] = useState<PaginatedResponse<ListingRow> | null>(null)
  const [listingsFilter, setListingsFilter] = useState({ status: 'all', category: '', seller_type: 'all', verified: 'all', reported: 'all', search: '' })
  const [listingsOffset, setListingsOffset] = useState(0)

  // Reports state
  const [reports, setReports] = useState<PaginatedResponse<ReportRow> | null>(null)
  const [reportsFilter, setReportsFilter] = useState({ status: 'pending' })
  const [reportsOffset, setReportsOffset] = useState(0)

  // Orders state
  const [orders, setOrders] = useState<PaginatedResponse<OrderRow> | null>(null)
  const [ordersFilter, setOrdersFilter] = useState({ status: 'all' })
  const [ordersOffset, setOrdersOffset] = useState(0)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ admin_notes: string; status: string }>({ admin_notes: '', status: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Report handling
  const [handlingReportId, setHandlingReportId] = useState<string | null>(null)
  const [reportAction, setReportAction] = useState<string>('dismiss')
  const [reportNotes, setReportNotes] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const [loading, setLoading] = useState(true)

  // Fetch stats
  useEffect(() => {
    fetch('/api/admin/marketplace/stats')
      .then(r => r.json())
      .then(r => { if (r.success) setStats(r.data) })
  }, [])

  // Fetch helpers (no setState in effect — called from event handlers and via key)
  const fetchListings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: listingsFilter.status,
      seller_type: listingsFilter.seller_type,
      verified: listingsFilter.verified,
      reported: listingsFilter.reported,
      limit: '50',
      offset: String(listingsOffset),
    })
    if (listingsFilter.category) params.set('category', listingsFilter.category)
    if (listingsFilter.search) params.set('search', listingsFilter.search)
    const r = await fetch(`/api/admin/marketplace?${params}`)
    const data = await r.json()
    if (data.success) setListings(data.data)
    setLoading(false)
  }, [listingsFilter, listingsOffset])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: reportsFilter.status,
      limit: '50',
      offset: String(reportsOffset),
    })
    const r = await fetch(`/api/admin/marketplace/reports?${params}`)
    const data = await r.json()
    if (data.success) setReports(data.data)
    setLoading(false)
  }, [reportsFilter, reportsOffset])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: ordersFilter.status,
      limit: '50',
      offset: String(ordersOffset),
    })
    const r = await fetch(`/api/admin/marketplace/orders?${params}`)
    const data = await r.json()
    if (data.success) setOrders(data.data)
    setLoading(false)
  }, [ordersFilter, ordersOffset])

  // Data fetching — subscribe to external API data (valid effect usage)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (tab === 'listings') {
        const params = new URLSearchParams({
          status: listingsFilter.status,
          seller_type: listingsFilter.seller_type,
          verified: listingsFilter.verified,
          reported: listingsFilter.reported,
          limit: '50',
          offset: String(listingsOffset),
        })
        if (listingsFilter.category) params.set('category', listingsFilter.category)
        if (listingsFilter.search) params.set('search', listingsFilter.search)
        const r = await fetch(`/api/admin/marketplace?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setListings(data.data)
      } else if (tab === 'reports') {
        const params = new URLSearchParams({ status: reportsFilter.status, limit: '50', offset: String(reportsOffset) })
        const r = await fetch(`/api/admin/marketplace/reports?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setReports(data.data)
      } else if (tab === 'orders') {
        const params = new URLSearchParams({ status: ordersFilter.status, limit: '50', offset: String(ordersOffset) })
        const r = await fetch(`/api/admin/marketplace/orders?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setOrders(data.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tab, listingsFilter, listingsOffset, reportsFilter, reportsOffset, ordersFilter, ordersOffset])

  // Actions
  async function handleEditSave() {
    if (!editId) return
    setEditLoading(true)
    await fetch(`/api/admin/marketplace/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setEditLoading(false)
    setEditId(null)
    fetchListings()
    fetch('/api/admin/marketplace/stats').then(r => r.json()).then(r => { if (r.success) setStats(r.data) })
  }

  async function handleRemove(id: string, title: string) {
    if (!confirm(`Inserat "${title}" entfernen?`)) return
    await fetch(`/api/admin/marketplace/${id}`, { method: 'DELETE' })
    fetchListings()
    fetch('/api/admin/marketplace/stats').then(r => r.json()).then(r => { if (r.success) setStats(r.data) })
  }

  async function handleReport() {
    if (!handlingReportId) return
    setReportLoading(true)
    await fetch(`/api/admin/marketplace/reports/${handlingReportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: reportAction, admin_notes: reportNotes || null }),
    })
    setReportLoading(false)
    setHandlingReportId(null)
    setReportNotes('')
    fetchReports()
    fetch('/api/admin/marketplace/stats').then(r => r.json()).then(r => { if (r.success) setStats(r.data) })
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Aktive Inserate" value={stats.byStatus.active ?? 0} icon={Package} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" />
          <StatsCard label="Ungeprüft" value={stats.unverified} icon={Clock} color="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200" />
          <StatsCard label="Offene Meldungen" value={stats.openReports} icon={AlertTriangle} color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" />
          <StatsCard label="RevampIT" value={stats.revampit} icon={Store} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setListingsOffset(0); setReportsOffset(0); setOrdersOffset(0) }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-green-600 text-green-700 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'reports' && stats && stats.openReports > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {stats.openReports}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading && !listings && !reports && !orders ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* ---- LISTINGS TAB ---- */}
          {tab === 'listings' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={listingsFilter.status} onChange={e => { setListingsFilter(f => ({ ...f, status: e.target.value })); setListingsOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Status</option>
                  {Object.entries(LISTING_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={listingsFilter.category} onChange={e => { setListingsFilter(f => ({ ...f, category: e.target.value })); setListingsOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="">Alle Kategorien</option>
                  {KATEGORIEN.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
                <select value={listingsFilter.seller_type} onChange={e => { setListingsFilter(f => ({ ...f, seller_type: e.target.value })); setListingsOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Verkäufer</option>
                  <option value="revampit">RevampIT</option>
                  <option value="community">Community</option>
                </select>
                <select value={listingsFilter.verified} onChange={e => { setListingsFilter(f => ({ ...f, verified: e.target.value })); setListingsOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Verifizierung</option>
                  <option value="yes">Geprüft</option>
                  <option value="no">Ungeprüft</option>
                </select>
                <select value={listingsFilter.reported} onChange={e => { setListingsFilter(f => ({ ...f, reported: e.target.value })); setListingsOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Meldungen</option>
                  <option value="yes">Gemeldet</option>
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={listingsFilter.search}
                    onChange={e => { setListingsFilter(f => ({ ...f, search: e.target.value })); setListingsOffset(0) }}
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
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Preis</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Verkäufer</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Datum</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {listings?.items.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-white">{l.title}</span>
                            {l.verified_at && <ShieldCheck className="w-3.5 h-3.5 text-green-600" />}
                            {l.is_revampit && <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">RIT</span>}
                            {parseInt(l.report_count) > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                {l.report_count} Meldung{parseInt(l.report_count) > 1 ? 'en' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {getCategoryLabel(l.category)}
                          {l.condition && <span className="text-xs ml-1">· {getConditionLabel(l.condition)}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{formatPrice(Number(l.price_chf))}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{l.seller_name || l.seller_email}</td>
                        <td className="px-4 py-3"><StatusBadge status={l.status} config={LISTING_STATUS_CONFIG} /></td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDateShort(l.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a href={`/marketplace/${l.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Ansehen">
                              <Eye className="w-4 h-4 text-gray-500" />
                            </a>
                            <button onClick={() => { setEditId(l.id); setEditData({ admin_notes: l.admin_notes || '', status: l.status }) }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Bearbeiten">
                              <Edit3 className="w-4 h-4 text-blue-500" />
                            </button>
                            <VerifyActions listingId={l.id} isVerified={!!l.verified_at} title={l.title} />
                            {l.status !== 'removed' && (
                              <button onClick={() => handleRemove(l.id, l.title)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Entfernen">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {listings && listings.items.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Keine Inserate gefunden</div>
                )}
              </div>

              {/* Pagination */}
              {listings && listings.pagination.total > 50 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{listings.pagination.total} Inserate</span>
                  <div className="flex gap-2">
                    <button disabled={listingsOffset === 0} onClick={() => setListingsOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
                    <button disabled={!listings.pagination.hasMore} onClick={() => setListingsOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- REPORTS TAB ---- */}
          {tab === 'reports' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <select value={reportsFilter.status} onChange={e => { setReportsFilter({ status: e.target.value }); setReportsOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="pending">Offen</option>
                  <option value="reviewed">Bearbeitet</option>
                  <option value="all">Alle</option>
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Inserat</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Grund</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Melder</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Datum</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reports?.items.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <a href={`/marketplace/${r.listing_id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 dark:text-white hover:text-green-600 flex items-center gap-1">
                            {r.listing_title} <ExternalLink className="w-3 h-3" />
                          </a>
                          <p className="text-xs text-gray-500">Verkäufer: {r.seller_name || r.seller_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{getReportReasonLabel(r.reason)}</span>
                          {r.details && <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{r.details}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.reporter_name || r.reporter_email}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateShort(r.created_at)}</td>
                        <td className="px-4 py-3">
                          {r.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Offen</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{r.resolution_action ?? 'Bearbeitet'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'pending' && (
                            <button
                              onClick={() => { setHandlingReportId(r.id); setReportAction('dismiss'); setReportNotes('') }}
                              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Bearbeiten
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reports && reports.items.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Keine Meldungen gefunden</div>
                )}
              </div>

              {reports && reports.pagination.total > 50 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{reports.pagination.total} Meldungen</span>
                  <div className="flex gap-2">
                    <button disabled={reportsOffset === 0} onClick={() => setReportsOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
                    <button disabled={!reports.pagination.hasMore} onClick={() => setReportsOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- ORDERS TAB ---- */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <select value={ordersFilter.status} onChange={e => { setOrdersFilter({ status: e.target.value }); setOrdersOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <option value="all">Alle Status</option>
                  {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Bestell-ID</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Inserat</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Käufer</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Verkäufer</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Betrag</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orders?.items.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{o.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{o.listing_title}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{o.buyer_name || o.buyer_email}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{o.seller_name || o.seller_email}</td>
                        <td className="px-4 py-3 font-medium">{formatPrice(o.total_cents / 100)}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} config={ORDER_STATUS_CONFIG} /></td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateShort(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders && orders.items.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Keine Bestellungen gefunden</div>
                )}
              </div>

              {orders && orders.pagination.total > 50 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{orders.pagination.total} Bestellungen</span>
                  <div className="flex gap-2">
                    <button disabled={ordersOffset === 0} onClick={() => setOrdersOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
                    <button disabled={!orders.pagination.hasMore} onClick={() => setOrdersOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Inserat bearbeiten</h3>
              <button onClick={() => setEditId(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  {Object.entries(LISTING_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
                <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Handling Modal */}
      {handlingReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setHandlingReportId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Meldung bearbeiten</h3>
              <button onClick={() => setHandlingReportId(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktion</label>
                <select value={reportAction} onChange={e => setReportAction(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  <option value="dismiss">Abweisen</option>
                  <option value="warn_seller">Verkäufer verwarnen</option>
                  <option value="remove_listing">Inserat entfernen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
                <textarea
                  value={reportNotes}
                  onChange={e => setReportNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Begründung..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setHandlingReportId(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
                <button onClick={handleReport} disabled={reportLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ausführen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
