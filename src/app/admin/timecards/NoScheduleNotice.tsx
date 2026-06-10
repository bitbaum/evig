'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { apiFetch } from '@/lib/api/client'

/**
 * Self-service "set up my schedule" CTA shown when the current user
 * has no working_hours yet on their team profile.
 *
 * One-click flow:
 *   POST /api/admin/team/profiles/me/bootstrap → creates a team_profile
 *   for the caller with the standard Mo–Fr 09–17 schedule, then we
 *   reload the page so the timecard pre-fills from the new schedule.
 *
 * Why a reload instead of an SPA refetch:
 *   The parent page is a server component — it reads workingHours via
 *   Drizzle on the request and passes it down. The cheapest way to see
 *   the new value is a `location.reload()`. A more sophisticated path
 *   would refactor the page to fetch workingHours client-side, but the
 *   reload is one cycle, ~150 ms, and runs once per user lifetime.
 *
 * Returns null when `hasSchedule` is true so the parent can drop this
 * in unconditionally and trust the guard.
 */
export function NoScheduleNotice({ hasSchedule }: { hasSchedule: boolean }) {
  const [isApplying, setIsApplying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (hasSchedule) return null

  const applyDefault = async () => {
    setIsApplying(true)
    setErrorMessage(null)
    const result = await apiFetch<{ applied: boolean }>(
      '/api/admin/team/profiles/me/bootstrap',
      { method: 'POST' },
    )
    if (!result.success) {
      setErrorMessage(result.error || 'Schedule konnte nicht angewendet werden.')
      setIsApplying(false)
      return
    }
    // Soft reload — the server component re-reads workingHours and the
    // timecard renders pre-filled from this point on. Future months
    // will autoload too.
    window.location.reload()
  }

  return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-warning-900">
      <p className="text-sm font-medium">Dein offizieller Schedule fehlt noch.</p>
      <p className="mt-1 text-sm text-warning-800">
        Übernimm einmalig den Standard-Schedule (Mo–Fr 09:00–17:00) — danach füllen sich
        Zeitkarten automatisch und du musst nur Ausnahmen anpassen. Feineinstellungen
        kannst du jederzeit im Team-Profil vornehmen.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={applyDefault}
          disabled={isApplying}
          className="inline-flex items-center gap-2 rounded-lg bg-warning-600 px-3 py-2 text-sm font-medium text-white hover:bg-warning-700 disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {isApplying ? 'Wende an…' : 'Standard-Schedule übernehmen'}
        </Button>

        <Link
          href={ROUTES.admin.team}
          className="inline-flex items-center gap-2 rounded-lg bg-surface-base px-3 py-2 text-sm font-medium text-warning-900 transition-colors hover:bg-warning-100"
        >
          <Settings className="h-4 w-4" />
          Eigene Zeiten setzen
        </Link>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-error-700">{errorMessage}</p>
      )}
    </div>
  )
}
