'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { ORDER_STATUS_CONFIG, ORDER_STATUS, formatCHF, DELIVERY_LABELS } from '@/config/marketplace'
import type { OrderStatus, DeliveryOption } from '@/config/marketplace'
import { useTranslations } from 'next-intl'
import { formatDateShort } from '@/lib/date-formats'
import { OrderStatusTimeline } from '@/components/marketplace/OrderStatusTimeline'
import { OrderReviewForm } from '@/components/marketplace/OrderReviewForm'
import Heading from '@/components/ui/Heading'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useOrderDetail } from '@/hooks/useOrderDetail'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('dashboard.orders')

  const {
    order,
    isLoading,
    error,
    updatingStatus,
    confirmCancel,
    setConfirmCancel,
    trackingNumber,
    setTrackingNumber,
    sessionStatus,
    confirmReceipt,
    updateStatus,
    markReviewed,
  } = useOrderDetail(params, {
    notFound: t('errorNotFound'),
    confirmReceipt: t('errorConfirmReceipt'),
    updateStatus: t('errorUpdateStatus'),
  })

  if (isLoading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{error}</Heading>
        <Link href="/dashboard/orders" className="text-primary-600 hover:text-primary-700 font-medium">
          {t('backToOrders')}
        </Link>
      </div>
    )
  }

  if (!order) return null

  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus]
  const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED
  const deliveryLabel = DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] || order.deliveryMethod
  const hasReview = Boolean(order.reviewedAt)

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToOrders')}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">{t('orderDetails')}</Heading>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t('orderedOn', { date: formatDateShort(order.createdAt) })}
          </p>
        </div>
        {statusConfig && (
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {/* Pending payment info banner */}
      {order.status === ORDER_STATUS.PENDING_PAYMENT && (
        <div className="mb-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <Heading level={3} className="font-medium text-warning-800 dark:text-warning-200">
              {t('pendingPaymentTitle')}
            </Heading>
            <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
              {order.role === 'buyer' ? t('pendingPaymentBuyer') : t('pendingPaymentSeller')}
            </p>
            {order.role === 'buyer' && (
              <Link
                href={`/marketplace/checkout/${order.listingId}`}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-warning-600 hover:bg-warning-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                {t('retryPayment')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Status timeline */}
      {!isCancelled && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm mb-6">
          <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">{t('orderTimeline')}</Heading>
          <OrderStatusTimeline
            status={order.status}
            hasReview={hasReview}
            timestamps={{
              createdAt: order.createdAt,
              deliveredAt: order.deliveredAt,
              completedAt: order.completedAt,
              reviewedAt: order.reviewedAt,
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Listing info */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">{t('articleSection')}</Heading>
          <Link
            href={`/marketplace/${order.listingId}`}
            className="flex gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-700">
              {order.thumbnail ? (
                <Image src={order.thumbnail} alt={order.listingTitle || t('itemImage')} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-neutral-400" />
                </div>
              )}
            </div>
            <div>
              <Heading level={3} className="font-medium text-neutral-900 dark:text-white">{order.listingTitle}</Heading>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1">
                {order.deliveryMethod === 'shipping' ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                {deliveryLabel}
              </p>
            </div>
          </Link>

          {/* Tracking info */}
          {order.shippingAddress?.tracking_number && (
            <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-300">
                {t('trackingNumber', { number: order.shippingAddress.tracking_number })}
              </p>
              {order.shippingAddress.tracking_url && (
                <a
                  href={order.shippingAddress.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-1"
                >
                  {t('trackShipment')} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">{t('priceSection')}</Heading>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">{t('amountLabel')}</span>
              <span className="text-neutral-900 dark:text-white">{formatCHF(Number(order.amountChf))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">{t('serviceFee')}</span>
              <span className="text-neutral-900 dark:text-white">{formatCHF(Number(order.commissionChf))}</span>
            </div>
            {order.role === 'seller' && (
              <div className="flex justify-between font-medium pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-700 dark:text-neutral-300">{t('yourPayout')}</span>
                <span className="text-primary-600">{formatCHF(Number(order.sellerPayoutChf))}</span>
              </div>
            )}
            {order.role === 'buyer' && (
              <div className="flex justify-between font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-900 dark:text-white">{t('totalPaid')}</span>
                <span className="text-neutral-900 dark:text-white">{formatCHF(Number(order.amountChf))}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
            <Shield className="w-3.5 h-3.5 text-primary-600" />
            {t('buyerProtection')}
          </div>
        </div>

        {/* Counterparty info */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            {order.role === 'buyer' ? t('counterpartySeller') : t('counterpartyBuyer')}
          </Heading>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">{order.counterpartyName}</p>
              {order.role === 'buyer' && (
                <Link
                  href={`/sellers/${order.sellerId}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {t('viewProfile')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Shipping address */}
        {order.deliveryMethod === 'shipping' && order.shippingAddress && (
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
            <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">{t('shippingAddress')}</Heading>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
              {order.shippingAddress.name && <p className="font-medium">{order.shippingAddress.name}</p>}
              {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
              {(order.shippingAddress.postal_code || order.shippingAddress.city) && (
                <p>{order.shippingAddress.postal_code} {order.shippingAddress.city}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
        <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">{t('actionsSection')}</Heading>

        <div className="space-y-3">
          {/* Seller: paid → shipped */}
          {order.role === 'seller' && order.status === ORDER_STATUS.PAID && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('trackingOptional')}
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="z.B. 99.12.345678.90123456"
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => updateStatus(ORDER_STATUS.SHIPPED)}
                disabled={updatingStatus}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                {t('markShipped')}
              </button>
            </div>
          )}

          {/* Seller: shipped → delivered */}
          {order.role === 'seller' && order.status === ORDER_STATUS.SHIPPED && (
            <button
              onClick={() => updateStatus(ORDER_STATUS.DELIVERED)}
              disabled={updatingStatus}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              {t('markDelivered')}
            </button>
          )}

          {/* Buyer: shipped or delivered → completed (via confirm-receipt) */}
          {order.role === 'buyer' && (order.status === ORDER_STATUS.SHIPPED || order.status === ORDER_STATUS.DELIVERED) && (
            <button
              onClick={confirmReceipt}
              disabled={updatingStatus}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {t('confirmReceipt')}
            </button>
          )}

          {/* Cancel (buyer: pending_payment or paid) */}
          {order.role === 'buyer' && (order.status === ORDER_STATUS.PENDING_PAYMENT || order.status === ORDER_STATUS.PAID) && (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={updatingStatus}
              className="w-full flex items-center justify-center gap-2 border border-error-300 dark:border-error-800 text-error-600 dark:text-error-400 py-3 px-6 rounded-lg font-medium hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-50 transition-colors"
            >
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {t('cancelButton')}
            </button>
          )}

          {/* No actions available */}
          {isCancelled && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">
              {order.status === ORDER_STATUS.CANCELLED ? t('cancelledNote') : t('refundedNote')}
            </p>
          )}

          {order.status === ORDER_STATUS.COMPLETED && (
            <p className="text-sm text-primary-600 text-center py-2 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {t('completedNote')}
            </p>
          )}
        </div>
      </div>

      {/* Review section — only for buyer once order is completed */}
      {order.role === 'buyer' && order.status === ORDER_STATUS.COMPLETED && (
        <div className="mt-6 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <Heading level={2} className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            {hasReview ? t('reviewSectionHasReview') : t('reviewSectionNoReview')}
          </Heading>
          {hasReview ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              {t('reviewedNote', { date: order.reviewedAt ? formatDateShort(order.reviewedAt) : '' })}
            </div>
          ) : (
            <OrderReviewForm
              orderId={order.id}
              onSubmitted={markReviewed}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmCancel}
        title={t('cancelButton')}
        message={t('confirmCancel')}
        itemName={order?.listingTitle}
        onConfirm={() => { setConfirmCancel(false); updateStatus(ORDER_STATUS.CANCELLED) }}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  )
}
