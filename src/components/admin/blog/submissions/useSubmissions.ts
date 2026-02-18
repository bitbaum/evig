'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Submission, FilterStatus, SubmissionAction, StatusCounts } from './types'

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<FilterStatus>('pending')
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
      const response = await fetch('/api/blog/submit')
      const data = await response.json()
      if (data.success) {
        setSubmissions(data.data?.submissions || [])
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
        const res = await fetch(`/api/admin/blog/submissions/${submissionId}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (data.success) {
          setSuccess('Einreichung gelöscht')
          setSelectedSubmission(null)
          fetchSubmissions()
        } else {
          setError(data.error || 'Fehler beim Löschen')
        }
      } else {
        const res = await fetch(`/api/admin/blog/submissions/${submissionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...extraData }),
        })
        const data = await res.json()
        if (data.success) {
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
          setError(data.error || 'Fehler bei der Aktion')
        }
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSubmissions = submissions.filter(
    (sub) => filter === 'all' || sub.status === filter
  )

  const counts: StatusCounts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    published: submissions.filter((s) => s.status === 'published').length,
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
