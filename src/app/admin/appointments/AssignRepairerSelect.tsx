'use client'

/**
 * Inline assign-repairer dropdown for a single appointment row.
 *
 * Renders inside the action cell of /admin/appointments. Picking a
 * repairer + submitting calls POST /api/admin/appointments/[id]/assign
 * and refreshes the page so the row's status flips to "Angenommen" and
 * the repairer column populates.
 *
 * Hidden once the booking has a repairer or has moved past status='requested'
 * — those are no longer admin-assignment moments.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { apiFetch } from '@/lib/api/client'

interface RepairerOption {
  user_id: string
  name: string | null
  email: string
  city: string | null
  canton: string | null
}

interface Props {
  appointmentId: string
  /** Already-assigned repairer name, if any — hides the picker. */
  alreadyAssigned: boolean
  repairers: RepairerOption[]
}

export function AssignRepairerSelect({ appointmentId, alreadyAssigned, repairers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [repairerId, setRepairerId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (alreadyAssigned) return null

  const submit = async () => {
    if (!repairerId) return
    setBusy(true)
    setError(null)
    const result = await apiFetch(`/api/admin/appointments/${appointmentId}/assign`, {
      method: 'POST',
      body: { repairer_id: repairerId },
    })
    setBusy(false)
    if (!result.success) {
      setError(result.error || 'Zuweisung fehlgeschlagen')
      return
    }
    setOpen(false)
    setRepairerId('')
    router.refresh()
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={repairers.length === 0}
        title={repairers.length === 0 ? 'Keine aktiven Repairer verfügbar' : undefined}
      >
        <UserPlus className="w-3.5 h-3.5" />
        Zuweisen
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={repairerId}
        onChange={(e) => setRepairerId(e.target.value)}
        disabled={busy}
        className="min-w-[180px]"
      >
        <option value="">Techniker wählen…</option>
        {repairers.map((r) => {
          const loc = [r.city, r.canton].filter(Boolean).join(', ')
          return (
            <option key={r.user_id} value={r.user_id}>
              {r.name || r.email}{loc ? ` — ${loc}` : ''}
            </option>
          )
        })}
      </Select>
      <Button
        variant="primary"
        size="sm"
        onClick={submit}
        disabled={busy || !repairerId}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Bestätigen
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setOpen(false); setRepairerId(''); setError(null) }}
        disabled={busy}
      >
        Abbrechen
      </Button>
      {error && <p className="text-xs text-error-600 w-full">{error}</p>}
    </div>
  )
}
