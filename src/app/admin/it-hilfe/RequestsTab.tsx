// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Requests tab
// ---------------------------------------------------------------------------

import { Search, ExternalLink, Edit3, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
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
        <Select value={reqFilter.status} onChange={e => { setReqFilter(f => ({ ...f, status: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="all">Alle Status</option>
          {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={reqFilter.category} onChange={e => { setReqFilter(f => ({ ...f, category: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="all">Alle Kategorien</option>
          {DEVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={reqFilter.urgency} onChange={e => { setReqFilter(f => ({ ...f, urgency: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="all">Alle Dringlichkeiten</option>
          {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select value={reqFilter.canton} onChange={e => { setReqFilter(f => ({ ...f, canton: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="">Alle Kantone</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Suchen..."
            value={reqFilter.search}
            onChange={e => { setReqFilter(f => ({ ...f, search: e.target.value })); setReqOffset(0) }}
            className="pl-9 pr-3"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-white/[0.06] text-left">
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
          <tbody className="divide-y divide-neutral-200 dark:divide-white/[0.04]">
            {requests?.items.map(r => (
              <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.06]/50">
                <td className="px-4 py-3">
                  <a href={`/it-hilfe/${r.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-900 dark:text-white hover:text-primary-600 flex items-center gap-1">
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
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${r.requester_id}`} className="text-primary-600 hover:underline text-sm">
                    {r.requester_name || r.requester_email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-500">{r.canton}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{formatBudget(r.budget_amount_cents, r.budget_type)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${Number(r.offer_count) > 0 ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-neutral-100 text-neutral-500'}`}>
                    {r.offer_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDateShort(r.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(r.id, r.status, r.urgency, r.admin_notes)}
                      className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                      title="Bearbeiten"
                    >
                      <Edit3 className="w-4 h-4 text-primary-600" />
                    </button>
                    <Link
                      href={`/admin/tasks/new?source=it_hilfe&source_id=${r.id}&title=${encodeURIComponent(`IT-Hilfe: ${r.title}`)}&priority=${r.urgency === 'urgent' ? 'urgent' : 'normal'}`}
                      className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                      title="Aufgabe erstellen"
                    >
                      <ClipboardList className="w-4 h-4 text-neutral-500" />
                    </Link>
                  </div>
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
            <Button variant="outline" size="sm" disabled={reqOffset === 0} onClick={() => setReqOffset(o => Math.max(0, o - 50))}>Zurück</Button>
            <Button variant="outline" size="sm" disabled={!requests.pagination.hasMore} onClick={() => setReqOffset(o => o + 50)}>Weiter</Button>
          </div>
        </div>
      )}
    </div>
  )
}
