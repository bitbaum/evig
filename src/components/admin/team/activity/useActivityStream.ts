'use client'

/**
 * Activity Stream Hook
 *
 * Unified activity stream with filters. Sub-hooks are in dedicated files.
 */

import { useState, useCallback } from 'react'
import { API_DEFAULTS } from '@/config/api-defaults'
import { useSwrFetch } from '@/lib/api/swr'
import type { UnifiedActivity, ActivityStreamFilter } from './types'

// Re-export sub-hooks for backward compatibility with barrel index
export { useActivityUpdates, useActivityUpdateMutations } from './useActivityUpdates'
export { useHelpRequests, useHelpRequestMutations } from './useHelpRequests'
export { useCurrentFocus } from './useCurrentFocus'
export { useDigest } from './useDigest'

// ============================================================================
// Unified Activity Stream
// ============================================================================

interface UseActivityStreamReturn {
  activities: UnifiedActivity[]
  loading: boolean
  error: string | null
  total: number
  filters: ActivityStreamFilter
  setFilters: (filters: Partial<ActivityStreamFilter>) => void
  refetch: () => Promise<void>
}

export function useActivityStream(
  initialFilters?: Partial<ActivityStreamFilter>
): UseActivityStreamReturn {
  const [filters, setFiltersState] = useState<ActivityStreamFilter>({
    limit: API_DEFAULTS.PAGINATION_LIMIT,
    offset: 0,
    ...initialFilters,
  })

  // Filters (incl. pagination) are encoded in the SWR key — changing them refetches.
  const params = new URLSearchParams()
  if (filters.user_id) params.set('user_id', filters.user_id)
  if (filters.source_type) params.set('source_type', filters.source_type)
  if (filters.category) params.set('category', filters.category)
  if (filters.since) params.set('since', filters.since)
  if (filters.until) params.set('until', filters.until)
  params.set('limit', String(filters.limit))
  params.set('offset', String(filters.offset))

  const { data, error, isLoading, mutate } = useSwrFetch<{ items: UnifiedActivity[]; total: number }>(
    `/api/admin/team/activity?${params.toString()}`,
  )

  const setFilters = useCallback((newFilters: Partial<ActivityStreamFilter>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const refetch = useCallback(async () => {
    await mutate()
  }, [mutate])

  return {
    activities: data?.items ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    total: data?.total ?? 0,
    filters,
    setFilters,
    refetch,
  }
}
