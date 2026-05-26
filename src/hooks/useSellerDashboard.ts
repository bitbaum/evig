'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSwrFetch } from '@/lib/api/swr'
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

  // Authorization gating: redirect non-sellers + unauthenticated users.
  // Stays in a useEffect (not part of the fetch) — the redirect is a
  // navigation side effect, not a setState, so this useEffect doesn't
  // trip the react-hooks/set-state-in-effect rule.
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
    }
  }, [session, sessionStatus, router])

  // SWR-driven fetch — gated by the auth/role check. When the user
  // isn't authorized (or session hasn't loaded), pass null as the key
  // so SWR skips the fetch entirely (no setState during render).
  const hasAccess = (() => {
    if (sessionStatus !== 'authenticated' || !session?.user) return false
    const userRole = session.user.role as string
    const isAdmin =
      userRole === ROLES.REVAMPIT_ADMIN ||
      session.user.isStaff === true ||
      session.user.isSuperAdmin === true
    return userRole === ROLES.SELLER || isAdmin
  })()

  const {
    data,
    error: swrError,
    isLoading,
    mutate,
  } = useSwrFetch<SellerDashboardData>(hasAccess ? '/api/seller/dashboard' : null)

  return {
    sessionStatus,
    isLoading,
    error: swrError ? unexpectedError : null,
    stats: data?.stats ?? DEFAULT_STATS,
    products: data?.products ?? [],
    // Expose mutate() under the legacy name so the consumer's retry
    // buttons (dashboard/seller/page.tsx:61, 83) keep working without
    // a parallel change. SWR mutate() revalidates the cache against
    // the same key.
    fetchDashboardData: () => mutate(),
  }
}
