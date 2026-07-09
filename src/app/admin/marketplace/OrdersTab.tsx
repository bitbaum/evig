'use client'

import { useTranslations } from 'next-intl'
import { Truck, MapPin } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatPrice, ORDER_STATUS_CONFIG, DELIVERY_LABELS } from '@/config/marketplace'
import type { DeliveryOption } from '@/config/marketplace'
import { StatusBadge } from './StatusBadge'
import type { OrderRow, PaginatedResponse } from './types'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'

interface OrdersTabProps {
  orders: PaginatedResponse<OrderRow> | null
  filter: { status: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
}

export function OrdersTab({ orders, filter, setFilter, offset, setOffset }: OrdersTabProps) {
  const t = useTranslations('admin.marketplace.orders')
  const tPag = useTranslations('admin.pagination')

  const columns: AdminTableColumn<OrderRow>[] = [
    {
      header: t('columns.orderId'),
      cell: (o) => <span className="font-mono text-xs text-text-secondary">{o.id.slice(0, 8)}</span>,
    },
    {
      header: t('columns.listing'),
      cell: (o) => <span className="font-medium text-text-primary">{o.listing_title || t('cartItems', { count: o.item_count })}</span>,
    },
    {
      header: t('columns.buyer'),
      cell: (o) => <span className="text-text-secondary">{o.buyer_name || o.buyer_email}</span>,
    },
    {
      header: t('columns.seller'),
      cell: (o) => <span className="text-text-secondary">{o.seller_name || o.seller_email}</span>,
    },
    {
      header: t('columns.delivery'),
      className: 'align-top text-text-secondary',
      cell: (o) => (
        <>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            {o.delivery_method === 'shipping'
              ? <Truck className="w-3.5 h-3.5 shrink-0" />
              : <MapPin className="w-3.5 h-3.5 shrink-0" />}
            {DELIVERY_LABELS[o.delivery_method as DeliveryOption] || o.delivery_method}
          </span>
          {o.delivery_method === 'shipping' && o.shipping_address && (
            <div className="mt-1 text-xs text-text-tertiary leading-tight">
              {o.shipping_address.name && <div>{o.shipping_address.name}</div>}
              {o.shipping_address.street && <div>{o.shipping_address.street}</div>}
              {(o.shipping_address.postal_code || o.shipping_address.city) && (
                <div>{o.shipping_address.postal_code} {o.shipping_address.city}</div>
              )}
            </div>
          )}
        </>
      ),
    },
    {
      header: t('columns.amount'),
      cell: (o) => <span className="font-medium">{formatPrice(o.total_cents / 100)}</span>,
    },
    {
      header: t('columns.status'),
      cell: (o) => <StatusBadge status={o.status} config={ORDER_STATUS_CONFIG} />,
    },
    {
      header: t('columns.date'),
      className: 'whitespace-nowrap text-text-tertiary',
      cell: (o) => formatDateShort(o.created_at),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={filter.status} onChange={e => { setFilter({ status: e.target.value }); setOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allStatus')}</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>

      {orders && orders.items.length === 0 ? (
        <div className="rounded-lg border border-default bg-surface-base p-12 text-center text-text-tertiary">{t('empty')}</div>
      ) : (
        <AdminTable columns={columns} rows={orders?.items ?? []} rowKey={(o) => o.id} />
      )}

      {orders && orders.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">{t('countLabel', { count: orders.pagination.total })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>{tPag('prev')}</Button>
            <Button variant="outline" size="sm" disabled={!orders.pagination.hasMore} onClick={() => setOffset(o => o + 50)}>{tPag('next')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
