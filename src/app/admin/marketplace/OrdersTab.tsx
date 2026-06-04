'use client'

import { formatDateShort } from '@/lib/date-formats'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
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
        <Select value={filter.status} onChange={e => { setFilter({ status: e.target.value }); setOffset(0) }} className="w-auto">
          <option value="all">Alle Status</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>

      <div className="bg-surface-base rounded-xl border border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">Bestell-ID</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Inserat</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Käufer</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Verkäufer</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Betrag</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-white/[0.04]">
            {orders?.items.map(o => (
              <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.06]/50">
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{o.listing_title}</td>
                <td className="px-4 py-3 text-text-secondary">{o.buyer_name || o.buyer_email}</td>
                <td className="px-4 py-3 text-text-secondary">{o.seller_name || o.seller_email}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(o.total_cents / 100)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} config={ORDER_STATUS_CONFIG} /></td>
                <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">{formatDateShort(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders && orders.items.length === 0 && (
          <div className="p-8 text-center text-text-tertiary">Keine Bestellungen gefunden</div>
        )}
      </div>

      {orders && orders.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">{orders.pagination.total} Bestellungen</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>Zurück</Button>
            <Button variant="outline" size="sm" disabled={!orders.pagination.hasMore} onClick={() => setOffset(o => o + 50)}>Weiter</Button>
          </div>
        </div>
      )}
    </div>
  )
}
