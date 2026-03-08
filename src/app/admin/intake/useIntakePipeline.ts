'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PipelineItem } from './types'

interface PaginationState {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export function useIntakePipeline(active: boolean) {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0, limit: 20, offset: 0, hasMore: false,
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

      const res = await fetch(`/api/admin/intake?${params}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data.items)
        setPagination(json.data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }, [tierFilter, statusFilter, categoryFilter, searchFilter])

  // Auto-fetch when active or filters change
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!active) return
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: '20', offset: '0' })
        if (tierFilter) params.set('tier', tierFilter)
        if (statusFilter) params.set('status', statusFilter)
        if (categoryFilter) params.set('category', categoryFilter)
        if (searchFilter) params.set('search', searchFilter)

        const res = await fetch(`/api/admin/intake?${params}`)
        const json = await res.json()
        if (!cancelled && json.success) {
          setItems(json.data.items)
          setPagination(json.data.pagination)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [active, tierFilter, statusFilter, categoryFilter, searchFilter])

  return {
    items,
    loading,
    pagination,
    tierFilter, setTierFilter,
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
    searchFilter, setSearchFilter,
    fetchItems,
  }
}
