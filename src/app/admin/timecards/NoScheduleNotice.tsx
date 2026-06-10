'use client'

import Link from 'next/link'
import { ROUTES } from '@/config/routes'

/**
 * Warning shown when the user has no working_hours schedule yet.
 * Links to /admin/team where the schedule is edited.
 *
 * Renders nothing when `hasSchedule` is true — letting the parent
 * unconditionally drop it in the layout and trust this guard.
 */
export function NoScheduleNotice({ hasSchedule }: { hasSchedule: boolean }) {
  if (hasSchedule) return null
  return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-warning-900">
      <p className="text-sm font-medium">Dein offizieller Schedule fehlt noch.</p>
      <p className="mt-1 text-sm text-warning-800">
        Lege ihn im Team-Profil fest. Danach werden Zeitkarten automatisch vorgefüllt
        und du musst nur noch Ausnahmen anfassen.
      </p>
      <Link
        href={ROUTES.admin.team}
        className="mt-3 inline-flex items-center rounded-lg bg-surface-base px-3 py-2 text-sm font-medium text-warning-900 transition-colors hover:bg-warning-100"
      >
        Team-Profil öffnen
      </Link>
    </div>
  )
}
