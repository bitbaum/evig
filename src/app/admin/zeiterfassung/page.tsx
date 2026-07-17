/**
 * /admin/zeiterfassung — team-member self-service Zeiterfassung
 *
 * Zeiterfassung is an EMPLOYEE tool, so it lives in the admin area (the staff
 * surface), not on the customer dashboard. It sits in the "Heute" sidebar
 * group and on the admin mobile bottom nav — the two places staff actually
 * start their day from. Access: every staff member (alwaysForStaff in the
 * sections SSOT) — permission narrowing never removes someone's own tools.
 *
 * What lives here:
 *   - Monthly timecard form (`TimecardsClient`) — calendar-first with inline
 *     day editor below the grid.
 *   - Weekly schedule editor — prefills entries from the regular schedule.
 *   - History sidebar — last 8 timecards with status badge.
 *
 * The APPROVAL queue (reviewing everyone's hours) is a different loop and
 * stays at /admin/team/approvals.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/permissions'
import { db } from '@/db'
import { teamProfiles, timecards as timecardsTable } from '@/db/schema'
import Heading from '@/components/ui/Heading'
import { TimecardsClient } from '@/components/timecards/TimecardsClient'
import { SaldoStrip } from '@/components/timecards/SaldoStrip'
import { ReminderSetting } from '@/components/timecards/ReminderSetting'
import { getPersonSaldo } from '@/lib/services/saldo'
import { TimecardHistorySidebar } from '@/components/dashboard/timecards/TimecardHistorySidebar'
import { WeeklyScheduleEditor } from '@/components/timecards/WeeklyScheduleEditor'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.timecards')
  return {
    title: t('selfTitle'),
    description: t('selfDescription'),
  }
}

export default async function AdminZeiterfassungPage() {
  const t = await getTranslations('admin.timecards')
  const session = await auth()

  // The admin layout already enforces staff; this is the defensive branch for
  // direct navigation edge cases.
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/zeiterfassung')
  }
  if (!session.user.isStaff) {
    redirect('/')
  }

  // Approvers (superadmins / timecard-permission staff) can reopen a card that
  // was reviewed/approved by mistake — see the "Wieder öffnen" action.
  const u = session.user as typeof session.user & { isSuperAdmin?: boolean; staffPermissions?: string[] }
  const canApprove =
    isSuperAdmin(u.email, u.isSuperAdmin) ||
    (u.staffPermissions ?? []).some(p => ['timecards', 'timecard-approvals', '*'].includes(p))

  // Pull workingHours so the TimecardsClient can prefill entries from the
  // user's regular schedule. Returns null if there's no team profile yet —
  // the client handles that case (shows an empty grid the user can fill in).
  const [profile] = await db
    .select({
      workingHours: teamProfiles.workingHours,
      reminderDay: teamProfiles.zeiterfassungReminderDay,
    })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, session.user.id))
    .limit(1)

  // Zeit-/Feriensaldo — null (hidden) for people without a Pensum on file.
  const saldo = await getPersonSaldo(session.user.id).catch(() => null)

  // History: last 8 timecards across all periods, newest first. Narrow column
  // on desktop, collapsible on mobile.
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
    <article className="mx-auto max-w-7xl space-y-6">
      {/* One-line page title — every vertical pixel here pushes the actual
          time entry further off a phone screen. The month header inside
          TimecardsClient carries status + totals. */}
      <Heading level={1} className="text-2xl font-semibold text-text-primary sm:text-3xl">
        {t('selfTitle')}
      </Heading>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Mobile-first ordering: the ACTION (the timecard editor) leads on
            phones; saldo shrinks to a glance line; plan/reminder settings sink
            below. Desktop (lg) keeps saldo → plan → editor. */}
        <div className="flex min-w-0 flex-col gap-6">
          {saldo && (
            <div className="order-2 lg:order-none">
              <SaldoStrip data={saldo} ownView />
            </div>
          )}
          <div id="arbeitsplan" className="order-3 scroll-mt-24 space-y-2 lg:order-none">
            <WeeklyScheduleEditor workingHours={profile?.workingHours ?? null} />
            <ReminderSetting initialDay={profile?.reminderDay ?? null} />
          </div>
          <div className="order-1 lg:order-none">
            <TimecardsClient
              workingHours={profile?.workingHours ?? null}
              userName={session.user.name || session.user.email || t('userFallback')}
              canApprove={canApprove}
            />
          </div>
        </div>
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <TimecardHistorySidebar history={history} />
        </aside>
      </div>
    </article>
  )
}
