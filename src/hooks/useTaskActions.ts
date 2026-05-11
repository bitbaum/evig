'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'

interface StaffMember {
  id: string
  name: string | null
  email: string
}

export function useTaskActions(taskId: string) {
  const router = useRouter()

  const [loading, setLoading] = useState<string | null>(null)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [showAttentionForm, setShowAttentionForm] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    apiFetch<{ profiles: { user_id: string; name: string | null; email: string }[] }>(
      '/api/admin/team/profiles',
    ).then((res) => {
      if (res.success && res.data?.profiles) {
        setStaffMembers(res.data.profiles.map((p) => ({ id: p.user_id, name: p.name, email: p.email })))
      }
    })
  }, [])

  const handleComplete = async () => {
    setLoading('complete')
    setError(null)
    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        body: {
          notes: notes || null,
          duration_minutes: duration ? parseInt(duration, 10) : null,
        },
      })
      if (!result.success) throw new Error(result.error || 'Fehler beim Erledigen')
      setShowCompleteForm(false)
      setNotes('')
      setDuration('')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleFlagAttention = async () => {
    setLoading('attention')
    setError(null)
    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}/attention`, {
        method: 'POST',
        body: { message: message || null },
      })
      if (!result.success) throw new Error(result.error || 'Fehler beim Markieren')
      setShowAttentionForm(false)
      setMessage('')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleRequest = async () => {
    setLoading('request')
    setError(null)
    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}/request`, {
        method: 'POST',
        body: {
          requested_user_id: selectedUserId || null,
          message: message || null,
        },
      })
      if (!result.success) throw new Error(result.error || 'Fehler beim Anfragen')
      setShowRequestForm(false)
      setMessage('')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleArchive = async () => {
    setLoading('archive')
    setError(null)
    try {
      const result = await apiFetch<void>(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!result.success) throw new Error(result.error || 'Fehler beim Archivieren')
      router.push('/admin/tasks')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  return {
    loading,
    showCompleteForm,
    showAttentionForm,
    showRequestForm,
    showArchiveConfirm,
    notes,
    duration,
    message,
    error,
    staffMembers,
    selectedUserId,
    setShowCompleteForm,
    setShowAttentionForm,
    setShowRequestForm,
    setShowArchiveConfirm,
    setNotes,
    setDuration,
    setMessage,
    setSelectedUserId,
    handleComplete,
    handleFlagAttention,
    handleRequest,
    handleArchive,
  }
}
