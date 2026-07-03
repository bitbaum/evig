'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api/client'

/**
 * "Zahlung erfassen" — staff confirm a received bank transfer for a member.
 * Inline per-row control: button expands to a date field (default: one year
 * from the current paid-until, or from today), PATCHes the membership API,
 * then refreshes the server-rendered table.
 */
export function MemberPaymentAction({
  memberId,
  paidUntil,
}: {
  memberId: string
  paidUntil: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState(() => defaultPaidUntil(paidUntil))

  const save = async () => {
    setBusy(true)
    setError(null)
    const result = await apiFetch(`/api/admin/membership/${memberId}`, {
      method: 'PATCH',
      body: { paid_until: date },
    })
    setBusy(false)
    if (!result.success) {
      setError(result.error || 'Zahlung konnte nicht erfasst werden.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5"
      >
        <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
        Zahlung erfassen
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`paid-until-${memberId}`}>Bezahlt bis</label>
      <Input
        id={`paid-until-${memberId}`}
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="h-8 w-40 text-sm"
      />
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={save}
        disabled={busy || !date}
        className="inline-flex items-center gap-1"
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? 'Speichere…' : 'OK'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => { setOpen(false); setError(null) }}
        disabled={busy}
        aria-label="Abbrechen"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      {error && <span className="w-full text-xs text-error-600 dark:text-error-400">{error}</span>}
    </div>
  )
}

/** One year on from the current coverage (or from today if none/expired). */
function defaultPaidUntil(paidUntil: string | null): string {
  const base = paidUntil && new Date(paidUntil) > new Date() ? new Date(paidUntil) : new Date()
  base.setUTCFullYear(base.getUTCFullYear() + 1)
  return base.toISOString().slice(0, 10)
}
