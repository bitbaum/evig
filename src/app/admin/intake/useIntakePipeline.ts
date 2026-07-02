'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { PipelineItem } from './types'

interface PaginationState {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface StatusCounts {
  inProgress: number
  ready: number
  published: number
  total: number
}

export function useIntakePipeline(active: boolean) {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0, limit: 20, offset: 0, hasMore: false,
  })
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    inProgress: 0, ready: 0, published: 0, total: 0,
  })

  // Filters
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  const fetchItems = useCallback(async (offset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20', offset: String(offset) })
      if (tierFilter) params.set('tier', tierFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (searchFilter) params.set('search', searchFilter)

      const result = await apiFetch<{
        items: PipelineItem[]
        pagination: PaginationState
        statusCounts?: StatusCounts
      }>(`/api/admin/intake?${params}`)
      if (result.success && result.data) {
        setItems(result.data.items)
        setPagination(result.data.pagination)
        if (result.data.statusCounts) setStatusCounts(result.data.statusCounts)
      }
    } finally {
      setLoading(false)
    }
  }, [tierFilter, statusFilter, categoryFilter, searchFilter])

  // Auto-fetch when active or filters change. Delegates to fetchItems — the
  // previous hand-copied fetch body drifted (it dropped statusCounts, so the
  // hero KPIs stayed 0 on every initial load until the user paginated).
  useEffect(() => {
    if (!active) return
    void fetchItems(0)
  }, [active, fetchItems])

  return {
    items,
    loading,
    pagination,
    statusCounts,
    tierFilter, setTierFilter,
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
    searchFilter, setSearchFilter,
    fetchItems,
  }
}
