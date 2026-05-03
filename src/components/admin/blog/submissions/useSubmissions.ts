'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'
import type { Submission, FilterStatus, SubmissionAction, StatusCounts } from './types'

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<FilterStatus>(APPROVAL_STATUS.PENDING)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showChangesModal, setShowChangesModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await apiFetch<{ submissions: Submission[] }>('/api/blog/submit')
      if (result.success) {
        setSubmissions(result.data?.submissions || [])
      }
    } catch {
      setError('Fehler beim Laden der Einreichungen')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleAction = async (
    action: SubmissionAction,
    submissionId: string,
    extraData?: { rejection_reason?: string; review_notes?: string }
  ) => {
    setActionLoading(action)
    setError('')
    setSuccess('')

    try {
      if (action === 'delete') {
        const result = await apiFetch<void>(`/api/admin/blog/submissions/${submissionId}`, {
          method: 'DELETE',
        })
        if (result.success) {
          setSuccess('Einreichung gelöscht')
          setSelectedSubmission(null)
          fetchSubmissions()
        } else {
          setError(result.error || 'Fehler beim Löschen')
        }
      } else {
        const result = await apiFetch<void>(`/api/admin/blog/submissions/${submissionId}`, {
          method: 'PATCH',
          body: { action, ...extraData },
        })
        if (result.success) {
          const messages: Record<string, string> = {
            approve: 'Einreichung genehmigt',
            reject: 'Einreichung abgelehnt',
            publish: 'Beitrag veröffentlicht!',
            request_changes: 'Änderungen angefragt',
          }
          setSuccess(messages[action] || 'Aktion erfolgreich')
          setSelectedSubmission(null)
          setShowRejectModal(false)
          setShowChangesModal(false)
          setRejectionReason('')
          setReviewNotes('')
          fetchSubmissions()
        } else {
          setError(result.error || 'Fehler bei der Aktion')
        }
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSubmissions = submissions.filter(
    (sub) => filter === 'all' || sub.status === filter
  )

  const counts: StatusCounts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === APPROVAL_STATUS.PENDING).length,
    approved: submissions.filter((s) => s.status === APPROVAL_STATUS.APPROVED).length,
    rejected: submissions.filter((s) => s.status === APPROVAL_STATUS.REJECTED).length,
    published: submissions.filter((s) => s.status === APPROVAL_STATUS.PUBLISHED).length,
  }

  return {
    // Data
    filteredSubmissions,
    counts,
    selectedSubmission,
    isLoading,
    actionLoading,
    error,
    success,
    filter,

    // Modal state
    showRejectModal,
    showChangesModal,
    showEditModal,
    rejectionReason,
    reviewNotes,

    // Setters
    setFilter,
    setSelectedSubmission,
    setShowRejectModal,
    setShowChangesModal,
    setShowEditModal,
    setRejectionReason,
    setReviewNotes,

    // Actions
    handleAction,
    fetchSubmissions,
  }
}
