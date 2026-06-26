'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'
import {
  APPLICATION_STATUS,
  APPLICATION_FORWARD_TRANSITIONS,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import type { ApplicationActionDialogState, ApplicationListItem } from './types'

export function useHrApplications() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(APPLICATION_STATUS.NEW)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<ApplicationActionDialogState | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), UI_FEEDBACK_MS.SUCCESS)
  }

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      const qs = params.toString()
      const result = await apiFetch<{ applications: ApplicationListItem[] }>(
        `/api/admin/hr/applications${qs ? `?${qs}` : ''}`,
      )
      if (!result.success) throw new Error(result.error || 'Laden fehlgeschlagen')
      setApplications(result.data?.applications ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const openAdvanceDialog = (applicationId: string, currentStatus: ApplicationStatus) => {
    const nextOptions = APPLICATION_FORWARD_TRANSITIONS[currentStatus]
    const targetStatus = nextOptions.find((s) => s !== APPLICATION_STATUS.REJECTED)
    if (!targetStatus) return
    setActionDialog({
      type: 'advance',
      applicationId,
      targetStatus,
      rejectionReason: '',
      adminNotes: '',
    })
  }

  const openRejectDialog = (applicationId: string) => {
    setActionDialog({
      type: 'reject',
      applicationId,
      targetStatus: APPLICATION_STATUS.REJECTED,
      rejectionReason: '',
      adminNotes: '',
    })
  }

  const openHireDialog = (applicationId: string) => {
    setActionDialog({
      type: 'hire',
      applicationId,
      rejectionReason: '',
      adminNotes: '',
    })
  }

  const closeDialog = () => setActionDialog(null)

  const submitAction = async () => {
    if (!actionDialog) return
    const { type, applicationId, targetStatus, rejectionReason, adminNotes } = actionDialog

    if (type === 'reject' && !rejectionReason.trim()) return

    setActionLoading(applicationId)
    closeDialog()

    try {
      if (type === 'hire') {
        const result = await apiFetch<{ team_profile_url: string }>(
          `/api/admin/hr/applications/${applicationId}/hire`,
          { method: 'POST', body: JSON.stringify({ spawn_onboarding_tasks: true }) },
        )
        if (!result.success) throw new Error(result.error || 'Einstellung fehlgeschlagen')
        showSuccess('Person eingestellt — Team-Profil erstellt')
      } else if (targetStatus) {
        const result = await apiFetch(`/api/admin/hr/applications/${applicationId}/transition`, {
          method: 'POST',
          body: JSON.stringify({
            status: targetStatus,
            rejection_reason: type === 'reject' ? rejectionReason : undefined,
            admin_notes: adminNotes || undefined,
          }),
        })
        if (!result.success) throw new Error(result.error || 'Aktualisierung fehlgeschlagen')
        showSuccess('Status aktualisiert')
      }
      await fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen')
    } finally {
      setActionLoading(null)
    }
  }

  return {
    applications,
    loading,
    error,
    setError,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    actionLoading,
    successMessage,
    actionDialog,
    setActionDialog,
    expandedId,
    setExpandedId,
    fetchApplications,
    openAdvanceDialog,
    openRejectDialog,
    openHireDialog,
    closeDialog,
    submitAction,
  }
}
