'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Loader2, Check, X, Pencil, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { focusFreshness } from '@/lib/team/focus-freshness'

interface Props {
  teamId: string
  initialFocus: string | null
  initialUpdatedAt: string | null
}

/** Editable team-level focus headline (reuses the focus-freshness SSOT badge). */
export default function TeamFocusInput({ teamId, initialFocus, initialUpdatedAt }: Props) {
  const router = useRouter()
  const [focus, setFocus] = useState(initialFocus ?? '')
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fresh = focusFreshness(updatedAt)

  async function save() {
    const value = focus.trim() || null
    setSaving(true)
    setError(null)
    const res = await apiFetch(`/api/admin/teams/${teamId}/focus`, {
      method: 'PATCH',
      body: { current_focus: value },
    })
    setSaving(false)
    if (!res.success) {
      setError(res.error || 'Speichern fehlgeschlagen')
      return
    }
    setUpdatedAt(value ? new Date().toISOString() : null)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            maxLength={200}
            autoFocus
            placeholder="Woran arbeitet dieses Team gerade?"
            onKeyDown={(e) => { if (e.key === 'Enter') save() }}
          />
          <Button size="icon" onClick={save} disabled={saving} aria-label="Speichern">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => { setFocus(initialFocus ?? ''); setEditing(false) }} disabled={saving} aria-label="Abbrechen">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-error-600 dark:text-error-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <Target className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {focus.trim() ? (
          <>
            <p className="text-sm text-text-primary">{focus}</p>
            {fresh && (
              <p className={`text-xs mt-0.5 flex items-center gap-1 ${fresh.isStale ? 'text-warning-600' : 'text-text-tertiary'}`}>
                {fresh.isStale && <AlertTriangle className="w-3 h-3" />}
                {fresh.isStale ? 'Fokus veraltet' : fresh.label}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-text-tertiary">Kein Fokus gesetzt</p>
        )}
      </div>
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Fokus bearbeiten">
        <Pencil className="w-3.5 h-3.5" />
        {focus.trim() ? 'Bearbeiten' : 'Setzen'}
      </Button>
    </div>
  )
}
