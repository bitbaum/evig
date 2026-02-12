'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react'
import { formatCHF } from '@/config/marketplace'
import { ORDER_STATUS_CONFIG } from '@/config/marketplace'
import type { OrderStatus } from '@/config/marketplace'

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
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(!!orderId)

  useEffect(() => {
    if (!orderId) return

    fetch(`/api/marketplace/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setOrder(data.data)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  const statusConfig = order ? ORDER_STATUS_CONFIG[order.status as OrderStatus] : null

  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Bestellung erfolgreich!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ihre Zahlung wurde autorisiert. Der Betrag wird erst freigegeben, wenn Sie den Empfang bestätigen.
        </p>

        {order && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600">
                {order.thumbnail ? (
                  <img src={order.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">{order.listing_title}</h3>
                <p className="text-lg font-bold text-green-600 mt-0.5">{formatCHF(Number(order.amount_chf))}</p>
              </div>
            </div>
            {statusConfig && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
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
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Bestellung ansehen
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Weiter einkaufen
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
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
