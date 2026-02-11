'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingBag,
  Package,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { ORDER_STATUS_CONFIG, formatCHF } from '@/config/marketplace'
import type { OrderStatus } from '@/config/marketplace'
import { formatDateShort } from '@/lib/date-formats'

interface OrderItem {
  id: string
  listing_id: string
  listing_title: string
  thumbnail: string | null
  amount_chf: number
  status: string
  delivery_method: string
  counterparty_name: string | null
  counterparty_id: string
  created_at: string
}

const TABS = [
  { key: '', label: 'Alle' },
  { key: 'pending_payment', label: 'Ausstehend' },
  { key: 'paid', label: 'Bezahlt' },
  { key: 'shipped', label: 'Versendet' },
  { key: 'completed', label: 'Abgeschlossen' },
] as const

export default function DashboardOrdersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ role })
      if (activeTab) params.set('status', activeTab)

      const response = await fetch(`/api/marketplace/orders?${params}`)
      const data = await response.json()

      if (data.success && data.data) {
        setOrders(data.data.items)
        setTotal(data.data.pagination.total)
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, role])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (sessionStatus === 'authenticated') {
      fetchOrders()
    }
  }, [sessionStatus, fetchOrders, router])

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Meine Bestellungen
        </h1>

        {/* Role toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setRole('buyer')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === 'buyer'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Käufe
          </button>
          <button
            onClick={() => setRole('seller')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === 'seller'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Verkäufe
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Noch keine Bestellungen
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {role === 'buyer'
              ? 'Stöbern Sie im Marketplace und finden Sie tolle Angebote.'
              : 'Sobald jemand eines Ihrer Inserate kauft, erscheint die Bestellung hier.'}
          </p>
          {role === 'buyer' && (
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Zum Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus]
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:ring-1 hover:ring-green-200 dark:hover:ring-green-800 transition-all"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                  {order.thumbnail ? (
                    <img src={order.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{order.listing_title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{role === 'buyer' ? 'Verkäufer' : 'Käufer'}: {order.counterparty_name}</span>
                    <span>{formatDateShort(order.created_at)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 dark:text-white">{formatCHF(Number(order.amount_chf))}</p>
                  {statusConfig && (
                    <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
