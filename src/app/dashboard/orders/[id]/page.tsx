'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ORDER_STATUS } from '@/config/marketplace'
import { useOrderDetail } from '@/hooks/useOrderDetail'
import {
  OrderHeader,
  PendingPaymentBanner,
  StatusTimelineCard,
  ListingInfoCard,
  PriceBreakdownCard,
  CounterpartyCard,
  ShippingAddressCard,
  ActionsCard,
  ReviewCard,
} from './sections'

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
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl font-bold text-text-primary mb-2">{error}</Heading>
        <Link href="/dashboard/orders" className="text-action hover:text-action font-medium">
          {t('backToOrders')}
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <ArrowLeft className="h-3 w-3" />
        {t('backToOrders')}
      </Link>

      <OrderHeader order={order} />

      {/* Live error banner — surfaces fetch failures triggered after mount */}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-300">
          {error}
        </div>
      )}

      <PendingPaymentBanner order={order} />
      <StatusTimelineCard order={order} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ListingInfoCard order={order} />
        <PriceBreakdownCard order={order} />
        <CounterpartyCard order={order} />
        <ShippingAddressCard order={order} />
      </div>

      <ActionsCard
        order={order}
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        updatingStatus={updatingStatus}
        confirmReceipt={confirmReceipt}
        updateStatus={updateStatus}
        setConfirmCancel={setConfirmCancel}
      />

      <ReviewCard order={order} onSubmitted={markReviewed} />

      <ConfirmDialog
        isOpen={confirmCancel}
        title={t('cancelButton')}
        message={t('confirmCancel')}
        itemName={order?.listingTitle}
        onConfirm={() => { setConfirmCancel(false); updateStatus(ORDER_STATUS.CANCELLED) }}
        onClose={() => setConfirmCancel(false)}
      />
    </article>
  )
}
