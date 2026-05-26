'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useSwrFetch } from '@/lib/api/swr'
import { APPROVAL_STATUS } from '@/config/approval-status'

export interface MySubmission {
  id: string
  title: string
  slug: string | null
  status: string
  statusLabel: string
  submissionType: string
  reviewNotes: string | null
  rejectionReason: string | null
  adminFeedback: string | null
  nextAction: string | null
  publishedPostId: string | null
  publishedPostSlug: string | null
  publishedAt: string | null
  submittedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface UseBlogSubmissionsErrors {
  loadError: string
  emptyContent: string
  resubmitError: string
}

export function useBlogSubmissions(errors: UseBlogSubmissionsErrors) {
  // Submissions list — SWR replaces the prior useState + useEffect +
  // setState pattern (which tripped react-hooks/set-state-in-effect).
  // The wrapper bridges apiFetch's { success, data, error } envelope
  // into SWR's throw-on-error contract; see src/lib/api/swr.ts.
  const {
    data,
    error: swrError,
    isLoading,
    mutate,
  } = useSwrFetch<{ submissions: MySubmission[] }>('/api/blog/my-submissions')

  const submissions = data?.submissions ?? []

  // Local UI state that's independent of the fetch
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set())

  // Surface SWR fetch errors via the same `error` field consumers
  // already check. Falls back to the localized loadError message.
  const displayError = error || (swrError ? errors.loadError : '')

  const toggleFeedback = (id: string) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startEditing = (submission: MySubmission) => {
    setEditingId(submission.id)
    setEditTitle(submission.title)
    setEditContent('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const resubmit = async (id: string) => {
    if (!editContent.trim()) {
      setError(errors.emptyContent)
      return
    }
    setSaving(true)
    const result = await apiFetch<{ id: string; status: string }>(
      `/api/blog/submissions/${id}/resubmit`,
      { method: 'POST', body: { title: editTitle, content: editContent } },
    )
    setSaving(false)
    if (result.success) {
      cancelEditing()
      // Revalidate SWR cache so the list reflects the resubmitted entry's
      // updated status without a full re-mount.
      await mutate()
    } else {
      setError(result.error || errors.resubmitError)
    }
  }

  const stats = {
    pending: submissions.filter(
      (s) => s.status === APPROVAL_STATUS.PENDING || s.status === APPROVAL_STATUS.APPROVED,
    ).length,
    published: submissions.filter((s) => s.status === APPROVAL_STATUS.PUBLISHED).length,
    rejected: submissions.filter((s) => s.status === APPROVAL_STATUS.REJECTED).length,
    requiresChanges: submissions.filter((s) => s.status === APPROVAL_STATUS.REQUIRES_CHANGES).length,
  }

  return {
    submissions,
    loading: isLoading,
    error: displayError,
    editingId,
    editTitle,
    editContent,
    saving,
    expandedFeedback,
    stats,
    setEditTitle,
    setEditContent,
    toggleFeedback,
    startEditing,
    cancelEditing,
    resubmit,
  }
}
