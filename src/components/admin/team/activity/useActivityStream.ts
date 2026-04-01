'use client'

/**
 * Activity Stream Hook
 *
 * Unified activity stream with filters. Sub-hooks are in dedicated files.
 */

import { useState, useEffect, useCallback } from 'react'
import { API_DEFAULTS } from '@/config/api-defaults'
import { apiFetch } from '@/lib/api/client'
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
  const [activities, setActivities] = useState<UnifiedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [filters, setFiltersState] = useState<ActivityStreamFilter>({
    limit: API_DEFAULTS.PAGINATION_LIMIT,
    offset: 0,
    ...initialFilters,
  })

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.user_id) params.set('user_id', filters.user_id)
      if (filters.source_type) params.set('source_type', filters.source_type)
      if (filters.category) params.set('category', filters.category)
      if (filters.since) params.set('since', filters.since)
      if (filters.until) params.set('until', filters.until)
      params.set('limit', String(filters.limit))
      params.set('offset', String(filters.offset))

      const result = await apiFetch<{ items: UnifiedActivity[]; total: number }>(`/api/admin/team/activity?${params.toString()}`)

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden der Aktivitäten')
      }

      setActivities(result.data?.items || [])
      setTotal(result.data?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const setFilters = useCallback((newFilters: Partial<ActivityStreamFilter>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  return { activities, loading, error, total, filters, setFilters, refetch: fetchActivities }
}
