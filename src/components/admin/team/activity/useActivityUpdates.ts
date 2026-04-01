'use client'

/**
 * Activity Updates Hooks
 *
 * Data fetching and mutation hooks for activity updates
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { ActivityUpdate } from './types'

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

      const result = await apiFetch<{ items: ActivityUpdate[]; total: number }>(`/api/admin/team/activity/updates?${params.toString()}`)

      if (!result.success) {
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
        const result = await apiFetch<{ id: string }>('/api/admin/team/activity/updates', {
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
        const result = await apiFetch<void>(`/api/admin/team/activity/updates/${id}`, {
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

  const deleteUpdate = useCallback(async (id: string) => {
    setSaving(true)
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/admin/team/activity/updates/${id}`, {
        method: 'DELETE',
      })

      if (!result.success) {
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
