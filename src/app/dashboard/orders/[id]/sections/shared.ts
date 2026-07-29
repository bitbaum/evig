/** Shared card chrome constants + order type for the order-detail sections. */

'use client'

/** Single SSOT for the order detail page card chrome. */
export const CARD_CLASS = 'card-shell p-6'
export const SECTION_TITLE_CLASS = 'text-sm font-semibold text-text-primary mb-4'

export type Order = ReturnType<typeof import('@/hooks/useOrderDetail').useOrderDetail>['order']
export type NonNullOrder = NonNullable<Order>
