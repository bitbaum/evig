'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { ROLES } from '@/lib/constants'

export interface SellerProduct {
  id: string
  title: string
  price: number
  status: string
  viewsCount: number
  favoritesCount: number
  condition: string
  category: string
  image: string | null
  createdAt: string
}

export interface SellerStats {
  totalProducts: number
  activeProducts: number
  totalViews: number
  totalFavorites: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
}

export interface SellerDashboardData {
  stats: SellerStats
  products: SellerProduct[]
}

const DEFAULT_STATS: SellerStats = {
  totalProducts: 0,
  activeProducts: 0,
  totalViews: 0,
  totalFavorites: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
}

export function useSellerDashboard(unexpectedError: string) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [data, setData] = useState<SellerDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await apiFetch<SellerDashboardData>('/api/seller/dashboard')
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setError(result.error || unexpectedError)
    }
    setIsLoading(false)
  }, [unexpectedError])

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const userRole = session.user.role as string
    const hasAdminAccess =
      userRole === ROLES.REVAMPIT_ADMIN ||
      session.user.isStaff === true ||
      session.user.isSuperAdmin === true
    const hasAccess = userRole === ROLES.SELLER || hasAdminAccess

    if (!hasAccess) {
      router.push('/dashboard')
      return
    }

    fetchDashboardData()
  }, [session, sessionStatus, router, fetchDashboardData])

  return {
    sessionStatus,
    isLoading,
    error,
    stats: data?.stats ?? DEFAULT_STATS,
    products: data?.products ?? [],
    fetchDashboardData,
  }
}
