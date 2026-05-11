'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'

export function useDecisionHeaderCard(
  decisionId: string,
  onDeleteSuccess: () => void,
  onError: (msg: string) => void,
) {
  const [showCloseInput, setShowCloseInput] = useState(false)
  const [closeSummary, setCloseSummary] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [sendingInvitations, setSendingInvitations] = useState(false)
  const [invitationsResult, setInvitationsResult] = useState<{ sent: number; skipped: number } | null>(null)

  function handleCopyLink() {
    const url = `${window.location.origin}/vote/${decisionId}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), UI_FEEDBACK_MS.LINK_COPY)
    })
  }

  async function handleSendInvitations() {
    setSendingInvitations(true)
    setInvitationsResult(null)
    const result = await apiFetch<{ sent: number; skipped: number }>(
      `/api/decisions/${decisionId}/send-invitations`,
      { method: 'POST' },
    )
    setSendingInvitations(false)
    if (result.success && result.data) {
      setInvitationsResult(result.data)
      setTimeout(() => setInvitationsResult(null), UI_FEEDBACK_MS.NOTIFICATION)
    } else {
      onError(result.error || 'Fehler beim Senden der Einladungen')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await apiFetch<void>(`/api/decisions/${decisionId}`, { method: 'DELETE' })
    if (!result.success) {
      onError(result.error || 'Fehler beim Löschen')
      setDeleting(false)
      setShowDeleteDialog(false)
      return
    }
    onDeleteSuccess()
  }

  return {
    showCloseInput,
    closeSummary,
    showCancelInput,
    cancelReason,
    showDeleteDialog,
    deleting,
    linkCopied,
    sendingInvitations,
    invitationsResult,
    setShowCloseInput,
    setCloseSummary,
    setShowCancelInput,
    setCancelReason,
    setShowDeleteDialog,
    handleCopyLink,
    handleSendInvitations,
    handleDelete,
  }
}
