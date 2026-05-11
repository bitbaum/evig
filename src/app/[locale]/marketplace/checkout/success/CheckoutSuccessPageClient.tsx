'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatCHF } from '@/config/marketplace'
import { ORDER_STATUS_CONFIG } from '@/config/marketplace'
import type { OrderStatus } from '@/config/marketplace'
import { useTranslations } from 'next-intl'

interface OrderSummary {
  id: string
  listing_title: string
  thumbnail: string | null
  amount_chf: number
  status: string
  delivery_method: string
  counterparty_name: string | null
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const t = useTranslations('marketplace.checkout.success')
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(!!orderId)

  useEffect(() => {
    if (!orderId) return

    apiFetch<OrderSummary>(`/api/marketplace/orders/${orderId}`)
      .then(result => {
        if (result.success && result.data) {
          setOrder(result.data)
        } else if (result.error) {
          logger.warn('Failed to load order details', { error: result.error, orderId })
        }
      })
      .finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  const statusConfig = order ? ORDER_STATUS_CONFIG[order.status as OrderStatus] : null

  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm">
        <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />

        <Heading level={1} className="text-2xl text-neutral-900 dark:text-white mb-2">
          {t('heading')}
        </Heading>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {t('description')}
        </p>

        {order && (
          <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-600">
                {order.thumbnail ? (
                  <Image src={order.thumbnail} alt={order.listing_title || t('imageAlt')} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-neutral-400" />
                  </div>
                )}
              </div>
              <div>
                <Heading level={3} className="text-neutral-900 dark:text-white text-sm">{order.listing_title}</Heading>
                <p className="text-lg font-bold text-primary-600 mt-0.5">{formatCHF(Number(order.amount_chf))}</p>
              </div>
            </div>
            {statusConfig && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('statusLabel')}</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orderId && (
            <Link
              href={`/dashboard/orders/${orderId}`}
              className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('viewOrder')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
