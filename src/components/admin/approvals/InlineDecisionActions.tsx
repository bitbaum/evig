'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Shared approve/reject row actions for the Freigaben hub — one decision UX
 * for every inline domain (content submissions, workshop proposals,
 * locations). Approve fires directly; reject expands an inline reason field
 * first so the submitter learns WHY. The caller owns the API call and returns
 * an error message (or null) — this component only renders states.
 */
export function InlineDecisionActions({
  onDecide,
  rejectReasonRequired = false,
}: {
  onDecide: (decision: 'approve' | 'reject', reason: string) => Promise<string | null>
  rejectReasonRequired?: boolean
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decide = async (decision: 'approve' | 'reject') => {
    setBusy(decision)
    setError(null)
    const err = await onDecide(decision, reason.trim())
    setBusy(null)
    if (err) setError(err)
  }

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={rejectReasonRequired ? 'Begründung (erforderlich)' : 'Begründung (optional)'}
          maxLength={1000}
          className="h-8 w-56 text-sm"
          autoFocus
        />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => decide('reject')}
          disabled={busy !== null || (rejectReasonRequired && reason.trim().length === 0)}
          className="flex items-center gap-1"
        >
          {busy === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Ablehnen
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setRejecting(false); setError(null) }}
          disabled={busy !== null}
          aria-label="Abbrechen"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
        {error && <span className="w-full text-right text-xs text-error-600 dark:text-error-400">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        onClick={() => decide('approve')}
        disabled={busy !== null}
        size="sm"
        className="flex items-center gap-1"
      >
        {busy === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        Genehmigen
      </Button>
      <Button
        type="button"
        onClick={() => setRejecting(true)}
        disabled={busy !== null}
        variant="destructive-outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <XCircle className="w-3 h-3" />
        Ablehnen
      </Button>
      {error && <span className="w-full text-right text-xs text-error-600 dark:text-error-400">{error}</span>}
    </div>
  )
}
