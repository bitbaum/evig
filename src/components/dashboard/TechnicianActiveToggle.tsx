'use client'

import { useState } from 'react'
import { Loader2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

/**
 * Pause / reactivate control for the technician cockpit — the deliberate opt-out
 * that replaced the easy-to-miss default-off toggle on the registration form.
 * Paused hides the technician from search and blocks offering help (the offer
 * boundary checks is_active). The server (PATCH /api/user/technician-profile) is
 * the source of truth; this reflects it optimistically.
 */
export function TechnicianActiveToggle({ initialActive }: { initialActive: boolean }) {
  const [active, setActive] = useState(initialActive)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    const next = !active
    setBusy(true)
    const result = await apiFetch<{ isActive: boolean }>('/api/user/technician-profile', {
      method: 'PATCH',
      body: { isActive: next },
    })
    setBusy(false)
    if (result.success && result.data) {
      setActive(result.data.isActive)
    } else {
      logger.error('Failed to toggle technician active state', { error: result.error })
    }
  }

  const Icon = busy ? Loader2 : active ? Pause : Play

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={busy}
      aria-pressed={active}
      className="gap-2"
    >
      <Icon className={`h-4 w-4 shrink-0${busy ? ' animate-spin' : ''}`} aria-hidden="true" />
      {active ? 'Profil pausieren' : 'Profil aktivieren'}
    </Button>
  )
}
