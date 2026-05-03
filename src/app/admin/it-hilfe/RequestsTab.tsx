// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Requests tab
// ---------------------------------------------------------------------------

import { Search, ExternalLink, Edit3 } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import {
  DEVICE_CATEGORIES, URGENCY_LEVELS, REQUEST_STATUSES,
  getCategoryById, formatBudget,
} from '@/config/it-hilfe'
import { SWISS_CANTONS } from '@/config/swiss-cantons'
import type { RequestRow, PaginatedResponse, RequestFilter } from './types'
import { UrgencyBadge, RequestStatusBadge, CategoryIcon } from './shared'

interface RequestsTabProps {
  requests: PaginatedResponse<RequestRow> | null
  reqFilter: RequestFilter
  setReqFilter: React.Dispatch<React.SetStateAction<RequestFilter>>
  reqOffset: number
  setReqOffset: React.Dispatch<React.SetStateAction<number>>
  onEdit: (id: string, status: string, urgency: string, admin_notes: string | null) => void
}

export function RequestsTab({
  requests, reqFilter, setReqFilter, reqOffset, setReqOffset, onEdit,
}: RequestsTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={reqFilter.status} onChange={e => { setReqFilter(f => ({ ...f, status: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Alle Status</option>
          {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={reqFilter.category} onChange={e => { setReqFilter(f => ({ ...f, category: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Alle Kategorien</option>
          {DEVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={reqFilter.urgency} onChange={e => { setReqFilter(f => ({ ...f, urgency: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Alle Dringlichkeiten</option>
          {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={reqFilter.canton} onChange={e => { setReqFilter(f => ({ ...f, canton: e.target.value })); setReqOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="">Alle Kantone</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Suchen..."
            value={reqFilter.search}
            onChange={e => { setReqFilter(f => ({ ...f, search: e.target.value })); setReqOffset(0) }}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left">
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Titel</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Kategorie</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Dringlichkeit</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Ersteller</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Kanton</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Budget</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Angebote</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Datum</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {requests?.items.map(r => (
              <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                <td className="px-4 py-3">
                  <a href={`/it-hilfe/${r.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-900 dark:text-white hover:text-info-600 flex items-center gap-1">
                    {r.title} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon categoryId={r.category_id} />
                    <span className="text-neutral-600 dark:text-neutral-400">{getCategoryById(r.category_id)?.name ?? r.category_id}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><UrgencyBadge urgency={r.urgency} /></td>
                <td className="px-4 py-3"><RequestStatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{r.requester_name || r.requester_email}</td>
                <td className="px-4 py-3 text-neutral-500">{r.canton}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{formatBudget(r.budget_amount_cents, r.budget_type)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${Number(r.offer_count) > 0 ? 'bg-info-100 text-info-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {r.offer_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDateShort(r.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onEdit(r.id, r.status, r.urgency, r.admin_notes)}
                    className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    title="Bearbeiten"
                  >
                    <Edit3 className="w-4 h-4 text-info-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests && requests.items.length === 0 && (
          <div className="p-8 text-center text-neutral-500">Keine Anfragen gefunden</div>
        )}
      </div>

      {requests && requests.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">{requests.pagination.total} Anfragen</span>
          <div className="flex gap-2">
            <button disabled={reqOffset === 0} onClick={() => setReqOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
            <button disabled={!requests.pagination.hasMore} onClick={() => setReqOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
          </div>
        </div>
      )}
    </div>
  )
}
