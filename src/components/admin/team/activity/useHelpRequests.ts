'use client'

/**
 * Help Requests Hooks
 *
 * Data fetching and mutation hooks for help requests
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { API_DEFAULTS } from '@/config/api-defaults'
import type { HelpRequest, HelpRequestFilter } from './types'

// ============================================================================
// Help Requests
// ============================================================================

interface UseHelpRequestsReturn {
  requests: HelpRequest[]
  loading: boolean
  error: string | null
  total: number
  filters: HelpRequestFilter
  setFilters: (filters: Partial<HelpRequestFilter>) => void
  refetch: () => Promise<void>
}

export function useHelpRequests(
  initialFilters?: Partial<HelpRequestFilter>
): UseHelpRequestsReturn {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [filters, setFiltersState] = useState<HelpRequestFilter>({
    limit: API_DEFAULTS.PAGINATION_LIMIT,
    offset: 0,
    ...initialFilters,
  })

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.urgency) params.set('urgency', filters.urgency)
      if (filters.category) params.set('category', filters.category)
      if (filters.requester_id) params.set('requester_id', filters.requester_id)
      if (filters.requested_user_id) params.set('requested_user_id', filters.requested_user_id)
      if (filters.is_broadcast !== undefined) params.set('is_broadcast', String(filters.is_broadcast))
      params.set('limit', String(filters.limit))
      params.set('offset', String(filters.offset))

      const result = await apiFetch<{ items: HelpRequest[]; total: number }>(`/api/admin/team/help-requests?${params.toString()}`)

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden')
      }

      setRequests(result.data?.items || [])
      setTotal(result.data?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const setFilters = useCallback((newFilters: Partial<HelpRequestFilter>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  return { requests, loading, error, total, filters, setFilters, refetch: fetchRequests }
}

// ============================================================================
// Help Request Mutations
// ============================================================================

interface UseHelpRequestMutationsReturn {
  saving: boolean
  error: string | null
  createRequest: (data: {
    title: string
    description?: string | null
    category?: string | null
    urgency?: string
    requested_user_id?: string | null
  }) => Promise<{ id: string } | null>
  updateRequest: (
    id: string,
    data: Partial<{
      title: string
      description: string | null
      category: string | null
      urgency: string
      status: string
    }>
  ) => Promise<boolean>
  resolveRequest: (id: string, resolution_notes?: string | null) => Promise<boolean>
}

export function useHelpRequestMutations(): UseHelpRequestMutationsReturn {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRequest = useCallback(
    async (data: {
      title: string
      description?: string | null
      category?: string | null
      urgency?: string
      requested_user_id?: string | null
    }) => {
      setSaving(true)
      setError(null)

      try {
        const result = await apiFetch<{ id: string }>('/api/admin/team/help-requests', {
          method: 'POST',
          body: data,
        })

        if (!result.success) {
          throw new Error(result.error || 'Fehler beim Erstellen')
        }

        return result.data as { id: string }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
        return null
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const updateRequest = useCallback(
    async (
      id: string,
      data: Partial<{
        title: string
        description: string | null
        category: string | null
        urgency: string
        status: string
      }>
    ) => {
      setSaving(true)
      setError(null)

      try {
        const result = await apiFetch<unknown>(`/api/admin/team/help-requests/${id}`, {
          method: 'PUT',
          body: data,
        })

        if (!result.success) {
          throw new Error(result.error || 'Fehler beim Aktualisieren')
        }

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
        return false
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const resolveRequest = useCallback(async (id: string, resolution_notes?: string | null) => {
    setSaving(true)
    setError(null)

    try {
      const result = await apiFetch<unknown>(`/api/admin/team/help-requests/${id}/resolve`, {
        method: 'POST',
        body: { resolution_notes },
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Lösen')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, error, createRequest, updateRequest, resolveRequest }
}
