'use client'

/**
 * Activity Stream Hooks
 *
 * Data fetching hooks for activity stream, updates, help requests, and digest
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  UnifiedActivity,
  ActivityUpdate,
  HelpRequest,
  DigestSummary,
  ActivityStreamFilter,
  HelpRequestFilter,
} from './types'

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
    limit: 50,
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

      const response = await fetch(`/api/admin/team/activity?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
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

// ============================================================================
// Activity Updates
// ============================================================================

interface UseActivityUpdatesReturn {
  updates: ActivityUpdate[]
  loading: boolean
  error: string | null
  total: number
  refetch: () => Promise<void>
}

export function useActivityUpdates(userId?: string): UseActivityUpdatesReturn {
  const [updates, setUpdates] = useState<ActivityUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchUpdates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (userId) params.set('user_id', userId)

      const response = await fetch(`/api/admin/team/activity/updates?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Laden')
      }

      setUpdates(result.data?.items || [])
      setTotal(result.data?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  return { updates, loading, error, total, refetch: fetchUpdates }
}

// ============================================================================
// Activity Updates Mutations
// ============================================================================

interface UseActivityUpdateMutationsReturn {
  saving: boolean
  error: string | null
  createUpdate: (data: {
    update_type: string
    title: string
    description?: string | null
    category?: string | null
    visibility?: string
    occurred_at?: string
  }) => Promise<{ id: string } | null>
  editUpdate: (
    id: string,
    data: Partial<{
      update_type: string
      title: string
      description: string | null
      category: string | null
      visibility: string
      occurred_at: string
    }>
  ) => Promise<boolean>
  deleteUpdate: (id: string) => Promise<boolean>
}

export function useActivityUpdateMutations(): UseActivityUpdateMutationsReturn {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUpdate = useCallback(
    async (data: {
      update_type: string
      title: string
      description?: string | null
      category?: string | null
      visibility?: string
      occurred_at?: string
    }) => {
      setSaving(true)
      setError(null)

      try {
        const response = await fetch('/api/admin/team/activity/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        if (!response.ok) {
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

  const editUpdate = useCallback(
    async (
      id: string,
      data: Partial<{
        update_type: string
        title: string
        description: string | null
        category: string | null
        visibility: string
        occurred_at: string
      }>
    ) => {
      setSaving(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/team/activity/updates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        if (!response.ok) {
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

  const deleteUpdate = useCallback(async (id: string) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/team/activity/updates/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Löschen')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, error, createUpdate, editUpdate, deleteUpdate }
}

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
    limit: 50,
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

      const response = await fetch(`/api/admin/team/help-requests?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
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
        const response = await fetch('/api/admin/team/help-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        if (!response.ok) {
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
        const response = await fetch(`/api/admin/team/help-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        if (!response.ok) {
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
      const response = await fetch(`/api/admin/team/help-requests/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes }),
      })
      const result = await response.json()

      if (!response.ok) {
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

// ============================================================================
// Current Focus
// ============================================================================

interface UseCurrentFocusReturn {
  saving: boolean
  error: string | null
  updateFocus: (profileId: string, focus: string | null) => Promise<boolean>
}

export function useCurrentFocus(): UseCurrentFocusReturn {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFocus = useCallback(async (profileId: string, focus: string | null) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/team/profiles/${profileId}/focus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_focus: focus }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Aktualisieren')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, error, updateFocus }
}

// ============================================================================
// Digest
// ============================================================================

interface UseDigestReturn {
  digest: DigestSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDigest(since?: string, until?: string, department?: string): UseDigestReturn {
  const [digest, setDigest] = useState<DigestSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDigest = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (since) params.set('since', since)
      if (until) params.set('until', until)
      if (department) params.set('department', department)

      const response = await fetch(`/api/admin/team/digest?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Laden')
      }

      setDigest(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [since, until, department])

  useEffect(() => {
    fetchDigest()
  }, [fetchDigest])

  return { digest, loading, error, refetch: fetchDigest }
}
