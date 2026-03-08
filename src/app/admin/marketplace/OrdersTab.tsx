'use client'

import { formatDateShort } from '@/lib/date-formats'
import { formatPrice, ORDER_STATUS_CONFIG } from '@/config/marketplace'
import { StatusBadge } from './StatusBadge'
import type { OrderRow, PaginatedResponse } from './types'

interface OrdersTabProps {
  orders: PaginatedResponse<OrderRow> | null
  filter: { status: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
}

export function OrdersTab({ orders, filter, setFilter, offset, setOffset }: OrdersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={filter.status} onChange={e => { setFilter({ status: e.target.value }); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
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
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
            <button disabled={!orders.pagination.hasMore} onClick={() => setOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
          </div>
        </div>
      )}
    </div>
  )
}
