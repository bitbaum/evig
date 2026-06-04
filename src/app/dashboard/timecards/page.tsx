/**
 * /dashboard/timecards — team-member self-service
 *
 * Phase 1 of the team + timecards rebuild. Previously the only timecard UI
 * lived at /admin/timecards, which gated submission on the "timecards"
 * staff permission. The goal here is a dedicated self-service surface that
 * any signed-in user with a team profile can use, optimized for the
 * "submit my hours, see what I submitted" loop rather than the admin's
 * "review everyone's hours" loop.
 *
 * What lives here:
 *   - Current period (defaults to this week) — uses the existing
 *     TimecardsClient form, which already has month/week toggle and
 *     AI assist baked in.
 *   - History sidebar — last 8 timecards with status badge so the user
 *     can see at a glance "yes, my April card was approved".
 *
 * What deliberately does NOT live here yet:
 *   - Approval queue — admin-only, stays at /admin/timecards (Phase 2
 *     will split that into its own /admin/team/approvals page).
 *   - PDF export — Phase 5 (needs accountant-conversation first).
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { teamProfiles, timecards as timecardsTable } from '@/db/schema'
import Heading from '@/components/ui/Heading'
import { TimecardsClient } from '@/app/admin/timecards/TimecardsClient'
import { TimecardHistorySidebar } from '@/components/dashboard/timecards/TimecardHistorySidebar'

export const metadata: Metadata = {
  title: 'Meine Zeiterfassung',
  description: 'Eigene Arbeitszeiten erfassen und einreichen.',
}

export default async function DashboardTimecardsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard/timecards')
  }

  // Pull workingHours so the TimecardsClient can prefill entries from the
  // user's regular schedule. Returns null if there's no team profile yet —
  // the client handles that case (shows an empty grid the user can fill in).
  const [profile] = await db
    .select({ workingHours: teamProfiles.workingHours })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, session.user.id))
    .limit(1)

  // History: last 8 timecards across all periods, newest first. Keep it to a
  // narrow column on desktop, collapsible on mobile.
  const history = await db
    .select({
      id: timecardsTable.id,
      periodType: timecardsTable.periodType,
      periodStart: timecardsTable.periodStart,
      periodEnd: timecardsTable.periodEnd,
      status: timecardsTable.status,
      submittedAt: timecardsTable.submittedAt,
      reviewedAt: timecardsTable.reviewedAt,
      reviewNotes: timecardsTable.reviewNotes,
    })
    .from(timecardsTable)
    .where(eq(timecardsTable.userId, session.user.id))
    .orderBy(desc(timecardsTable.periodStart), desc(timecardsTable.createdAt))
    .limit(8)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <Heading level={1} className="text-2xl sm:text-3xl font-bold text-text-primary">
            Meine Zeiterfassung
          </Heading>
          <p className="mt-1 text-sm text-text-secondary">
            Erfasse deine Arbeitszeiten und reiche sie zur Genehmigung ein.
          </p>
        </div>
        <Link
          href="/dashboard/shift"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-action text-white text-sm font-semibold hover:bg-action transition-colors"
        >
          Schicht starten
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
        <div className="min-w-0">
          <TimecardsClient
            workingHours={profile?.workingHours ?? null}
            userName={session.user.name || session.user.email || 'Du'}
          />
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <TimecardHistorySidebar history={history} />
        </aside>
      </div>
    </div>
  )
}
