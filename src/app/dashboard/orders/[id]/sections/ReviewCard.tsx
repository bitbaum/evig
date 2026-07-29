/** Review card — buyer review form or reviewed-note for completed single-listing orders. */

'use client'

import { CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import { ORDER_STATUS } from '@/config/marketplace'
import { OrderReviewForm } from '@/components/marketplace/OrderReviewForm'
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared'
import type { NonNullOrder } from './shared'

export function ReviewCard({ order, onSubmitted }: { order: NonNullOrder; onSubmitted: () => void }) {
  const t = useTranslations('dashboard.orders')
  // Reviews are a P2P seller-trust signal targeting a single listing; multi-item
  // RevampIT cart orders (items present, no single listingId) don't participate.
  if (order.role !== 'buyer' || order.status !== ORDER_STATUS.COMPLETED || order.items.length > 0) return null
  const hasReview = Boolean(order.reviewedAt)
  return (
    <div className={`${CARD_CLASS} mt-6`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {hasReview ? t('reviewSectionHasReview') : t('reviewSectionNoReview')}
      </Heading>
      {hasReview ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <CheckCircle className="w-4 h-4 text-action" />
          {t('reviewedNote', { date: order.reviewedAt ? formatDateShort(order.reviewedAt) : '' })}
        </div>
      ) : (
        <OrderReviewForm orderId={order.id} onSubmitted={onSubmitted} />
      )}
    </div>
  )
}
