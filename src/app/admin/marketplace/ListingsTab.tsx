'use client'

import { Search, ShieldCheck, Eye, Edit3, Trash2 } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { formatPrice } from '@/config/marketplace'
import { getCategoryLabel, LISTING_STATUS, LISTING_STATUS_CONFIG, MARKETPLACE_SELLER_TYPE } from '@/config/marketplace'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { getConditionLabel } from '@/config/erfassung/conditions'
import { VerifyActions } from './VerifyActions'
import { StatusBadge } from './StatusBadge'
import type { ListingRow, PaginatedResponse } from './types'

interface ListingsTabProps {
  listings: PaginatedResponse<ListingRow> | null
  filter: { status: string; category: string; seller_type: string; verified: string; reported: string; search: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string; category: string; seller_type: string; verified: string; reported: string; search: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
  onEdit: (id: string, admin_notes: string, status: string) => void
  onRemove: (id: string, title: string) => void
}

export function ListingsTab({ listings, filter, setFilter, offset, setOffset, onEdit, onRemove }: ListingsTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Alle Status</option>
          {Object.entries(LISTING_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.category} onChange={e => { setFilter(f => ({ ...f, category: e.target.value })); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="">Alle Kategorien</option>
          {KATEGORIEN.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <select value={filter.seller_type} onChange={e => { setFilter(f => ({ ...f, seller_type: e.target.value })); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Alle Verkäufer</option>
          <option value={MARKETPLACE_SELLER_TYPE.REVAMPIT}>RevampIT</option>
          <option value={MARKETPLACE_SELLER_TYPE.COMMUNITY}>Community</option>
        </select>
        <select value={filter.verified} onChange={e => { setFilter(f => ({ ...f, verified: e.target.value })); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Verifizierung</option>
          <option value="yes">Geprüft</option>
          <option value="no">Ungeprüft</option>
        </select>
        <select value={filter.reported} onChange={e => { setFilter(f => ({ ...f, reported: e.target.value })); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Meldungen</option>
          <option value="yes">Gemeldet</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Suchen..."
            value={filter.search}
            onChange={e => { setFilter(f => ({ ...f, search: e.target.value })); setOffset(0) }}
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
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Preis</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Verkäufer</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Datum</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {listings?.items.map(l => (
              <tr key={l.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-neutral-900 dark:text-white">{l.title}</span>
                    {l.verified_at && <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />}
                    {l.is_revampit && <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">RIT</span>}
                    {parseInt(l.report_count) > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {l.report_count} Meldung{parseInt(l.report_count) > 1 ? 'en' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {getCategoryLabel(l.category)}
                  {l.condition && <span className="text-xs ml-1">· {getConditionLabel(l.condition)}</span>}
                </td>
                <td className="px-4 py-3 text-neutral-900 dark:text-white font-medium">{formatPrice(Number(l.price_chf))}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{l.seller_name || l.seller_email}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} config={LISTING_STATUS_CONFIG} /></td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDateShort(l.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <a href={`/marketplace/${l.id}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Ansehen">
                      <Eye className="w-4 h-4 text-neutral-500" />
                    </a>
                    <button onClick={() => onEdit(l.id, l.admin_notes || '', l.status)} className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Bearbeiten">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                    </button>
                    <VerifyActions listingId={l.id} isVerified={!!l.verified_at} title={l.title} />
                    {l.status !== LISTING_STATUS.REMOVED && (
                      <button onClick={() => onRemove(l.id, l.title)} className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700" title="Entfernen">
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
          <div className="p-8 text-center text-neutral-500">Keine Inserate gefunden</div>
        )}
      </div>

      {/* Pagination */}
      {listings && listings.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">{listings.pagination.total} Inserate</span>
          <div className="flex gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
            <button disabled={!listings.pagination.hasMore} onClick={() => setOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
          </div>
        </div>
      )}
    </div>
  )
}
