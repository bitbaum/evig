/** Card wrapping the order status timeline (hidden for cancelled/refunded orders). */

'use client'

import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ORDER_STATUS } from '@/config/marketplace'
import { OrderStatusTimeline } from '@/components/marketplace/OrderStatusTimeline'
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared'
import type { NonNullOrder } from './shared'

export function StatusTimelineCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED
  if (isCancelled) return null
  return (
    <div className={`${CARD_CLASS} mb-6`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>{t('orderTimeline')}</Heading>
      <OrderStatusTimeline
        status={order.status}
        hasReview={Boolean(order.reviewedAt)}
        timestamps={{
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          completedAt: order.completedAt,
          reviewedAt: order.reviewedAt,
        }}
      />
    </div>
  )
}
