'use client'

/**
 * OrderStatusTimeline
 *
 * Visual progress indicator for a marketplace order.
 * Steps: ordered -> paid -> shipped -> delivered -> reviewed.
 * Completed steps show a checkmark (with date when available);
 * the current step is highlighted; future steps are greyed out.
 */

import { CheckCircle, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ORDER_STATUS } from '@/config/marketplace'
import { formatDateShort } from '@/lib/date-formats'

export interface OrderTimestamps {
  createdAt?: string | null
  // Order transitioned out of pending_payment
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  completedAt?: string | null
  reviewedAt?: string | null
}

interface OrderStatusTimelineProps {
  status: string
  timestamps?: OrderTimestamps
  hasReview?: boolean
  className?: string
}

type StepKey = 'ordered' | 'paid' | 'shipped' | 'delivered' | 'reviewed'

const STEP_KEYS: StepKey[] = ['ordered', 'paid', 'shipped', 'delivered', 'reviewed']

/**
 * Determine how far along the order is.
 * Returns the index (inclusive) of the highest step the order has reached.
 */
function getCurrentStepIndex(status: string, hasReview: boolean): number {
  if (hasReview) return 4
  switch (status) {
    case ORDER_STATUS.COMPLETED:
      return hasReview ? 4 : 3
    case ORDER_STATUS.DELIVERED:
      return 3
    case ORDER_STATUS.SHIPPED:
      return 2
    case ORDER_STATUS.PAID:
      return 1
    case ORDER_STATUS.PENDING_PAYMENT:
      return 0
    default:
      return 0
  }
}

export function OrderStatusTimeline({
  status,
  timestamps,
  hasReview = false,
  className = '',
}: OrderStatusTimelineProps) {
  const t = useTranslations('marketplace.orderStatus')
  const steps = STEP_KEYS.map(key => ({ key, label: t(key) }))
  const currentIdx = getCurrentStepIndex(status, hasReview)

  const stepDate = (key: StepKey): string | null => {
    if (!timestamps) return null
    switch (key) {
      case 'ordered':   return timestamps.createdAt ?? null
      case 'paid':      return timestamps.paidAt ?? null
      case 'shipped':   return timestamps.shippedAt ?? null
      case 'delivered': return timestamps.deliveredAt ?? timestamps.completedAt ?? null
      case 'reviewed':  return timestamps.reviewedAt ?? null
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, idx) => {
        const reached = idx <= currentIdx
        const isCurrent = idx === currentIdx
        const date = stepDate(step.key)
        return (
          <div key={step.key} className="flex-1 flex items-center">
            <div className="flex flex-col items-center shrink-0 min-w-[60px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                reached
                  ? 'bg-action text-white'
                  : 'bg-surface-overlay text-text-muted'
              }`}>
                {reached
                  ? <CheckCircle className="w-4 h-4" />
                  : <Circle className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1 text-center ${
                isCurrent
                  ? 'font-semibold text-action'
                  : reached
                    ? 'text-text-secondary'
                    : 'text-text-muted'
              }`}>
                {step.label}
              </span>
              {reached && date && (
                <span className="text-[10px] text-text-muted mt-0.5">
                  {formatDateShort(date)}
                </span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                idx < currentIdx ? 'bg-action' : 'bg-surface-overlay'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
