'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'
import {
  APPLICATION_STATUS,
  APPLICATION_FORWARD_TRANSITIONS,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import type { ApplicationActionDialogState, ApplicationListItem } from './types'

export function useHrApplications(initialPostingFilter?: string) {
  const searchParams = useSearchParams()
  const postingFromUrl = searchParams.get('job_posting_id') ?? initialPostingFilter ?? ''

  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(APPLICATION_STATUS.NEW)
  const [searchQuery, setSearchQuery] = useState('')
  const [postingFilter] = useState(postingFromUrl)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hireProfileUrl, setHireProfileUrl] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<ApplicationActionDialogState | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showSuccess = (msg: string, profileUrl?: string) => {
    setSuccessMessage(msg)
    setHireProfileUrl(profileUrl ?? null)
    setTimeout(() => {
      setSuccessMessage(null)
      setHireProfileUrl(null)
    }, UI_FEEDBACK_MS.SUCCESS * 2)
  }

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      if (postingFilter) params.set('job_posting_id', postingFilter)
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
  }, [statusFilter, searchQuery, postingFilter])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])
  /* eslint-enable react-hooks/set-state-in-effect */

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

    try {
      if (type === 'hire') {
        const result = await apiFetch<{ team_profile_url: string }>(
          `/api/admin/hr/applications/${applicationId}/hire`,
          { method: 'POST', body: JSON.stringify({ spawn_onboarding_tasks: true }) },
        )
        if (!result.success) throw new Error(result.error || 'Einstellung fehlgeschlagen')
        closeDialog()
        showSuccess('Person eingestellt — Team-Profil erstellt', result.data?.team_profile_url)
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
        closeDialog()
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
    postingFilter,
    actionLoading,
    successMessage,
    hireProfileUrl,
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
