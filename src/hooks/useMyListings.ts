'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'

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

export function useMyListings(errors: UseMyListingsErrors) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [listings, setListings] = useState<MyListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchListings = useCallback(async (fetchPage: number, filter: string) => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (filter) params.set('status', filter)
    params.set('page', String(fetchPage))

    const result = await apiFetch<{
      items: MyListing[]
      page: number
      totalPages: number
      total: number
    }>(`/api/listings/mine?${params.toString()}`)

    if (result.success && result.data) {
      setListings(result.data.items)
      setPage(result.data.page)
      setTotalPages(result.data.totalPages)
      setTotal(result.data.total)
    } else {
      setError(result.error || errors.loadError)
    }
    setIsLoading(false)
  }, [errors.loadError])

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    let cancelled = false
    fetchListings(1, statusFilter).then(() => {
      if (cancelled) {
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [session, sessionStatus, router, statusFilter, fetchListings])

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
      setListings(prev => prev.filter(l => l.id !== id))
      setTotal(prev => prev - 1)
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
    fetchListings,
    handleStatusFilterChange,
    doDelete,
    handleDuplicate,
    setPendingDeleteId,
  }
}
