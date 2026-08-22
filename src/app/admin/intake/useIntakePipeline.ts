'use client'

import { useState, useCallback } from 'react'
import { useSwrFetch } from '@/lib/api/swr'
import type { PipelineItem } from './types'

interface PaginationState {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface StatusCounts {
  inProgress: number
  failed: number
  ready: number
  published: number
  total: number
}

const EMPTY_PAGINATION: PaginationState = { total: 0, limit: 48, offset: 0, hasMore: false }
const EMPTY_COUNTS: StatusCounts = { inProgress: 0, failed: 0, ready: 0, published: 0, total: 0 }

export function useIntakePipeline(active: boolean) {
  const [offset, setOffset] = useState(0)

  // Filters. Changing one resets to the first page (matching the previous
  // auto-fetch-at-offset-0 behavior).
  const [tierFilter, setTierFilterState] = useState('')
  const [statusFilter, setStatusFilterState] = useState('')
  const [categoryFilter, setCategoryFilterState] = useState('')
  const [searchFilter, setSearchFilterState] = useState('')

  const setTierFilter = useCallback((v: string) => { setTierFilterState(v); setOffset(0) }, [])
  const setStatusFilter = useCallback((v: string) => { setStatusFilterState(v); setOffset(0) }, [])
  const setCategoryFilter = useCallback((v: string) => { setCategoryFilterState(v); setOffset(0) }, [])
  const setSearchFilter = useCallback((v: string) => { setSearchFilterState(v); setOffset(0) }, [])

  // Filters + offset are encoded in the SWR key (null while the tab is
  // inactive) — any change refetches automatically.
  const params = new URLSearchParams({ limit: '48', offset: String(offset) })
  if (tierFilter) params.set('tier', tierFilter)
  if (statusFilter) params.set('status', statusFilter)
  if (categoryFilter) params.set('category', categoryFilter)
  if (searchFilter) params.set('search', searchFilter)

  const { data, isLoading: loading, mutate } = useSwrFetch<{
    items: PipelineItem[]
    pagination: PaginationState
    statusCounts?: StatusCounts
  }>(active ? `/api/admin/intake?${params}` : null)

  // fetchItems(offset) keeps its old signature: same offset = revalidate,
  // new offset = page change (which refetches via the key).
  const fetchItems = useCallback(
    async (newOffset = 0) => {
      if (newOffset === offset) {
        await mutate()
      } else {
        setOffset(newOffset)
      }
    },
    [offset, mutate],
  )

  return {
    items: data?.items ?? [],
    loading,
    pagination: data?.pagination ?? EMPTY_PAGINATION,
    statusCounts: data?.statusCounts ?? EMPTY_COUNTS,
    tierFilter, setTierFilter,
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
    searchFilter, setSearchFilter,
    fetchItems,
  }
}
