'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  ShoppingBag,
  Package,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { ORDER_STATUS_CONFIG, ORDER_STATUS, formatCHF } from '@/config/marketplace'
import type { OrderStatus } from '@/config/marketplace'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/config/routes'

interface OrderItem {
  id: string
  listingId: string
  listingTitle: string
  thumbnail: string | null
  amountChf: number
  status: string
  deliveryMethod: string
  counterpartyName: string | null
  counterpartyId: string
  createdAt: string
}

export default function DashboardOrdersPage() {
  const t = useTranslations('dashboard.orders')
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const TABS = [
    { key: '', label: t('tabAll') },
    { key: ORDER_STATUS.PENDING_PAYMENT, label: t('tabPending') },
    { key: ORDER_STATUS.PAID, label: t('tabPaid') },
    { key: ORDER_STATUS.SHIPPED, label: t('tabShipped') },
    { key: ORDER_STATUS.COMPLETED, label: t('tabCompleted') },
  ]
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ role })
      if (activeTab) params.set('status', activeTab)

      const result = await apiFetch<{ items: OrderItem[]; pagination: { total: number } }>(
        `/api/marketplace/orders?${params}`,
      )

      if (result.success && result.data) {
        setOrders(result.data.items)
        setTotal(result.data.pagination.total)
      }
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
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Heading level={1} className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          {t('pageTitle')}
        </Heading>

        {/* Role toggle */}
        <div className="flex bg-surface-raised dark:bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setRole('buyer')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === 'buyer'
                ? 'bg-surface-base dark:bg-neutral-700 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-neutral-700'
            }`}
          >
            {t('roleBuyer')}
          </button>
          <button
            onClick={() => setRole('seller')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === 'seller'
                ? 'bg-surface-base dark:bg-neutral-700 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-neutral-700'
            }`}
          >
            {t('roleSeller')}
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
                ? 'bg-primary-600 text-white'
                : 'bg-surface-raised dark:bg-neutral-800 text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-action animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          iconBg="bg-primary-50 dark:bg-primary-900/20"
          iconColor="text-action"
          title={t('emptyTitle')}
          description={role === 'buyer' ? t('emptyBuyerDesc') : t('emptySellerDesc')}
          action={
            role === 'buyer' ? (
              <Button as={Link} href={ROUTES.public.marketplace} variant="primary">
                {t('goToMarketplace')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus]
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center gap-4 bg-surface-base dark:bg-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary-200 dark:hover:ring-primary-800 transition-all"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-raised dark:bg-neutral-700">
                  {order.thumbnail ? (
                    <Image src={order.thumbnail} alt={order.listingTitle || t('itemImage')} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-text-muted" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Heading level={3} className="font-medium text-text-primary truncate">{order.listingTitle}</Heading>
                  <div className="flex items-center gap-3 mt-1 text-sm text-text-tertiary">
                    <span>{role === 'buyer' ? t('counterpartySeller') : t('counterpartyBuyer')}: {order.counterpartyName}</span>
                    <span>{formatDateShort(order.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-text-primary">{formatCHF(Number(order.amountChf))}</p>
                  {statusConfig && (
                    <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
