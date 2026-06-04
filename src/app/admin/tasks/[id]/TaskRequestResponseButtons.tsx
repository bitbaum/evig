'use client'

/**
 * Accept / Decline buttons for an open task request.
 *
 * Renders inline inside the "Offene Anfragen" panel on the task detail
 * page. Only shows when the current viewer is allowed to respond:
 *   - targeted requests: the requested_user_id matches the viewer
 *   - broadcast requests (requested_user_id is null): any viewer can take
 *     it (server still rejects the original requester per safety check)
 * The viewer also cannot be the requester (server enforces; we hide too).
 *
 * On success the page is refreshed so the server-side query re-runs and
 * the request disappears from the pending list.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api/client'
import { REQUEST_STATUSES } from '@/config/tasks'

interface Props {
  requestId: string
  /** Whether the current viewer is allowed to respond (computed server-side). */
  canRespond: boolean
}

export function TaskRequestResponseButtons({ requestId, canRespond }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineMessage, setDeclineMessage] = useState('')

  if (!canRespond) return null

  const respond = async (status: 'accepted' | 'declined', message?: string) => {
    setBusy(status === 'accepted' ? 'accept' : 'decline')
    setError(null)
    const result = await apiFetch(`/api/task-requests/${requestId}`, {
      method: 'PATCH',
      body: { status, response_message: message?.trim() || undefined },
    })
    setBusy(null)
    if (!result.success) {
      setError(result.error || 'Antwort konnte nicht gespeichert werden.')
      return
    }
    router.refresh()
  }

  if (showDeclineForm) {
    return (
      <div className="mt-2 space-y-2">
        <Textarea
          value={declineMessage}
          onChange={(e) => setDeclineMessage(e.target.value)}
          placeholder="Grund (optional)"
          rows={2}
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => respond(REQUEST_STATUSES.DECLINED, declineMessage)}
            disabled={busy !== null}
          >
            {busy === 'decline' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Ablehnen bestätigen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowDeclineForm(false); setDeclineMessage('') }}
            disabled={busy !== null}
          >
            Abbrechen
          </Button>
        </div>
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => respond(REQUEST_STATUSES.ACCEPTED)}
        disabled={busy !== null}
      >
        {busy === 'accept' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Annehmen
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDeclineForm(true)}
        disabled={busy !== null}
      >
        <X className="w-3.5 h-3.5" />
        Ablehnen
      </Button>
      {error && <p className="text-xs text-error-600 w-full">{error}</p>}
    </div>
  )
}
