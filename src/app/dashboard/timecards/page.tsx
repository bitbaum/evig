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
 *   - Monthly timecard form (`TimecardsClient`) — calendar-first with inline
 *     day editor below the grid (no aside detail panel).
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
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { teamProfiles, timecards as timecardsTable } from '@/db/schema'
import Heading from '@/components/ui/Heading'
import { TimecardsClient } from '@/app/admin/timecards/TimecardsClient'
import { TimecardHistorySidebar } from '@/components/dashboard/timecards/TimecardHistorySidebar'
import { WeeklyScheduleEditor } from '@/components/timecards/WeeklyScheduleEditor'

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
    <article className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-subtle pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          Erfasse deine Arbeitszeiten und reiche sie zur Genehmigung ein
        </p>
        <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
          Meine Zeiterfassung
        </Heading>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <WeeklyScheduleEditor workingHours={profile?.workingHours ?? null} />
          <TimecardsClient
            workingHours={profile?.workingHours ?? null}
            userName={session.user.name || session.user.email || 'Du'}
          />
        </div>
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <TimecardHistorySidebar history={history} />
        </aside>
      </div>
    </article>
  )
}
