/** Page header — order title, order date and status badge. */

'use client'

import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import { ORDER_STATUS_CONFIG } from '@/config/marketplace'
import type { OrderStatus } from '@/config/marketplace'
import type { NonNullOrder } from './shared'

export function OrderHeader({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus]
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <Heading level={1} className="text-2xl font-bold text-text-primary">
          {t('orderDetails')}
        </Heading>
        <p className="text-sm text-text-tertiary mt-1">
          {t('orderedOn', { date: formatDateShort(order.createdAt) })}
        </p>
      </div>
      {statusConfig && (
        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      )}
    </div>
  )
}
