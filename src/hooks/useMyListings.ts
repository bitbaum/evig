'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { useSwrFetch } from '@/lib/api/swr'

export interface MyListing {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  status: string
  view_count: number
  favorite_count: number
  created_at: string
  thumbnail: string | null
}

interface UseMyListingsErrors {
  loadError: string
}

interface ListingsResponse {
  items: MyListing[]
  page: number
  totalPages: number
  total: number
}

export function useMyListings(errors: UseMyListingsErrors) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // Unauthenticated redirect: separate useEffect that only navigates,
  // no setState, so the react-hooks/set-state-in-effect rule doesn't
  // fire. SWR key gating below skips the fetch when no session, so
  // this just handles the navigation side effect.
  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
    }
  }, [session, sessionStatus, router])

  // SWR key built from page + statusFilter. SWR refetches automatically
  // when either changes (replacing the prior useEffect + fetchListings
  // dance). Conditional null key skips the fetch until session is ready.
  const swrKey = (() => {
    if (sessionStatus !== 'authenticated' || !session?.user) return null
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    return `/api/listings/mine?${params.toString()}`
  })()

  const {
    data,
    error: swrError,
    isLoading,
    mutate,
  } = useSwrFetch<ListingsResponse>(swrKey)

  const listings = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const error = swrError ? errors.loadError : null

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const doDelete = async () => {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    setDeletingId(id)
    const result = await apiFetch<void>(`/api/listings/${id}`, { method: 'DELETE' })
    if (result.success) {
      // Optimistic local update: drop the deleted row + decrement total
      // without a full refetch. SWR's mutate with a function lets us
      // patch the cached response in place; the next natural refetch
      // (page change, filter change, or manual refresh) brings the
      // backend back into sync.
      await mutate(
        (current) => current ? {
          ...current,
          items: current.items.filter((l) => l.id !== id),
          total: current.total - 1,
        } : current,
        { revalidate: false },
      )
    }
    setDeletingId(null)
  }

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id)
    const result = await apiFetch<{ id: string }>(`/api/listings/${id}/duplicate`, { method: 'POST' })
    if (result.success && result.data?.id) {
      router.push(`/marketplace/sell?edit=${result.data.id}`)
    }
    setDuplicatingId(null)
  }

  return {
    sessionStatus,
    listings,
    isLoading,
    error,
    statusFilter,
    deletingId,
    duplicatingId,
    pendingDeleteId,
    page,
    totalPages,
    total,
    setPage,
    // Manual refresh for retry buttons — revalidates the current key
    // (preserves the user's filter + page context).
    refresh: () => mutate(),
    handleStatusFilterChange,
    doDelete,
    handleDuplicate,
    setPendingDeleteId,
  }
}
