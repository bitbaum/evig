'use client'

/**
 * Current Focus Hook
 *
 * Mutation hook for updating a team member's current focus
 */

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'

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
      const result = await apiFetch(`/api/admin/team/profiles/${profileId}/focus`, {
        method: 'PUT',
        body: { current_focus: focus },
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
  }, [])

  return { saving, error, updateFocus }
}
