/**
 * Presentation sections for /dashboard/orders/[id].
 *
 * Pure JSX + props. State and mutations stay in the useOrderDetail
 * hook; this file is read-only with respect to behaviour.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Shield,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import {
  DELIVERY_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_CONFIG,
  formatCHF,
} from '@/config/marketplace'
import type { DeliveryOption, OrderStatus } from '@/config/marketplace'
import { OrderStatusTimeline } from '@/components/marketplace/OrderStatusTimeline'
import { OrderReviewForm } from '@/components/marketplace/OrderReviewForm'

/** Single SSOT for the order detail page card chrome. */
const CARD_CLASS = 'card-shell p-6'
const SECTION_TITLE_CLASS = 'text-sm font-semibold text-text-primary mb-4'

type Order = ReturnType<typeof import('@/hooks/useOrderDetail').useOrderDetail>['order']
type NonNullOrder = NonNullable<Order>

/* ─────────────────────────── Header ─────────────────────────── */

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

/* ─────────────────────────── Pending payment banner ─────────────────────────── */

export function PendingPaymentBanner({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) return null
  return (
    <div className="mb-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-4 flex items-start gap-3">
      <Clock className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <Heading level={3} className="font-medium text-warning-800 dark:text-warning-200">
          {t('pendingPaymentTitle')}
        </Heading>
        <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
          {order.role === 'buyer' ? t('pendingPaymentBuyer') : t('pendingPaymentSeller')}
        </p>
        {order.role === 'buyer' && (
          <Button
            as={Link}
            href={`/marketplace/checkout/${order.listingId}`}
            variant="warning"
            size="sm"
            className="gap-2 mt-3"
          >
            <Shield className="w-4 h-4" />
            {t('retryPayment')}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── Status timeline card ─────────────────────────── */

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

/* ─────────────────────────── Listing info ─────────────────────────── */

export function ListingInfoCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  const deliveryLabel = DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] || order.deliveryMethod
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>{t('articleSection')}</Heading>
      <Link
        href={`/marketplace/${order.listingId}`}
        className="flex gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-raised">
          {order.thumbnail ? (
            <Image src={order.thumbnail} alt={order.listingTitle || t('itemImage')} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-text-muted" />
            </div>
          )}
        </div>
        <div>
          <Heading level={3} className="font-medium text-text-primary">{order.listingTitle}</Heading>
          <p className="text-sm text-text-tertiary flex items-center gap-1 mt-1">
            {order.deliveryMethod === 'shipping' ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            {deliveryLabel}
          </p>
        </div>
      </Link>

      {order.shippingAddress?.tracking_number && (
        <div className="mt-4 p-3 bg-surface-raised rounded-lg">
          <p className="text-sm font-medium text-text-primary">
            {t('trackingNumber', { number: order.shippingAddress.tracking_number })}
          </p>
          {order.shippingAddress.tracking_url && (
            <a
              href={order.shippingAddress.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-action hover:text-action flex items-center gap-1 mt-1"
            >
              {t('trackShipment')} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Price breakdown ─────────────────────────── */

export function PriceBreakdownCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>{t('priceSection')}</Heading>
      <div className="space-y-2 text-sm font-mono tabular-nums">
        <PriceRow label={t('amountLabel')} value={formatCHF(Number(order.amountChf))} />
        <PriceRow label={t('serviceFee')} value={formatCHF(Number(order.commissionChf))} />
        {order.role === 'seller' && (
          <div className="flex justify-between font-medium pt-2 border-t border-subtle">
            <span className="text-text-secondary">{t('yourPayout')}</span>
            <span className="text-action">{formatCHF(Number(order.sellerPayoutChf))}</span>
          </div>
        )}
        {order.role === 'buyer' && (
          <div className="flex justify-between font-bold pt-2 border-t border-subtle">
            <span className="text-text-primary">{t('totalPaid')}</span>
            <span className="text-text-primary">{formatCHF(Number(order.amountChf))}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
        <Shield className="w-3.5 h-3.5 text-action" />
        {t('buyerProtection')}
      </div>
    </div>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  )
}

/* ─────────────────────────── Counterparty ─────────────────────────── */

export function CounterpartyCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {order.role === 'buyer' ? t('counterpartySeller') : t('counterpartyBuyer')}
      </Heading>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-text-tertiary" />
        </div>
        <div>
          <p className="font-medium text-text-primary">{order.counterpartyName}</p>
          {order.role === 'buyer' && (
            <Link
              href={`/sellers/${order.sellerId}`}
              className="text-sm text-action hover:text-action"
            >
              {t('viewProfile')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Shipping address ─────────────────────────── */

export function ShippingAddressCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  if (order.deliveryMethod !== 'shipping' || !order.shippingAddress) return null
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>{t('shippingAddress')}</Heading>
      <div className="text-sm text-text-secondary space-y-1">
        {order.shippingAddress.name && <p className="font-medium">{order.shippingAddress.name}</p>}
        {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
        {(order.shippingAddress.postal_code || order.shippingAddress.city) && (
          <p>{order.shippingAddress.postal_code} {order.shippingAddress.city}</p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── Actions card ─────────────────────────── */

interface ActionsProps {
  order: NonNullOrder
  trackingNumber: string
  setTrackingNumber: (v: string) => void
  updatingStatus: boolean
  confirmReceipt: () => void
  updateStatus: (s: OrderStatus) => void
  setConfirmCancel: (v: boolean) => void
}

export function ActionsCard({
  order, trackingNumber, setTrackingNumber, updatingStatus, confirmReceipt, updateStatus, setConfirmCancel,
}: ActionsProps) {
  const t = useTranslations('dashboard.orders')
  const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED
  const spinner = updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : null

  return (
    <div className={`${CARD_CLASS} mt-6`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>{t('actionsSection')}</Heading>
      <div className="space-y-3">
        {/* Seller: paid → shipped */}
        {order.role === 'seller' && order.status === ORDER_STATUS.PAID && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('trackingOptional')}
              </label>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="z.B. 99.12.345678.90123456"
              />
            </div>
            <Button onClick={() => updateStatus(ORDER_STATUS.SHIPPED)} disabled={updatingStatus} variant="primary" className="w-full">
              {spinner ?? <Truck className="w-4 h-4" />}
              {t('markShipped')}
            </Button>
          </div>
        )}

        {/* Seller: shipped → delivered */}
        {order.role === 'seller' && order.status === ORDER_STATUS.SHIPPED && (
          <Button onClick={() => updateStatus(ORDER_STATUS.DELIVERED)} disabled={updatingStatus} variant="primary" className="w-full">
            {spinner ?? <Package className="w-4 h-4" />}
            {t('markDelivered')}
          </Button>
        )}

        {/* Buyer: shipped or delivered → completed */}
        {order.role === 'buyer' && (order.status === ORDER_STATUS.SHIPPED || order.status === ORDER_STATUS.DELIVERED) && (
          <Button onClick={confirmReceipt} disabled={updatingStatus} variant="primary" className="w-full">
            {spinner ?? <CheckCircle className="w-4 h-4" />}
            {t('confirmReceipt')}
          </Button>
        )}

        {/* Cancel (buyer: pending_payment or paid) */}
        {order.role === 'buyer' && (order.status === ORDER_STATUS.PENDING_PAYMENT || order.status === ORDER_STATUS.PAID) && (
          <Button
            variant="destructive-outline"
            onClick={() => setConfirmCancel(true)}
            disabled={updatingStatus}
            className="w-full gap-2"
          >
            {spinner ?? <XCircle className="w-4 h-4" />}
            {t('cancelButton')}
          </Button>
        )}

        {isCancelled && (
          <p className="text-sm text-text-tertiary text-center py-2">
            {order.status === ORDER_STATUS.CANCELLED ? t('cancelledNote') : t('refundedNote')}
          </p>
        )}

        {order.status === ORDER_STATUS.COMPLETED && (
          <p className="text-sm text-action text-center py-2 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {t('completedNote')}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── Review section ─────────────────────────── */

export function ReviewCard({ order, onSubmitted }: { order: NonNullOrder; onSubmitted: () => void }) {
  const t = useTranslations('dashboard.orders')
  if (order.role !== 'buyer' || order.status !== ORDER_STATUS.COMPLETED) return null
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
