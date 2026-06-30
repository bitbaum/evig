/**
 * /admin/team/approvals — dedicated bulk-friendly approval queue.
 *
 * Replaces the per-row "approve one, type, click" pattern of the legacy
 * `/admin/timecards` approval block. Now: checkboxes on the rows, "Alle
 * auswählen" header checkbox, "Genehmigen (N)" / "Zurückweisen (N)"
 * batch buttons, optional shared review note. Each row also shows
 * department + position + employment type next to the name (the
 * listTimecards service was extended in this commit to join
 * teamProfiles), so HR has the context they need without clicking
 * through to each person's profile.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckSquare } from 'lucide-react'
import { auth } from '@/auth'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { canAccessSection } from '@/lib/permissions'
import { TimecardApprovalsClient } from '@/components/admin/timecards/TimecardApprovalsClient'
import { TimeOffApprovals } from '@/components/admin/timecards/TimeOffApprovals'
import { ApprovalTabs } from '@/components/admin/approvals/ApprovalTabs'

export const metadata: Metadata = {
  title: 'Freigaben · Zeitkarten',
  description: 'Eingereichte Zeitkarten im Stapel prüfen.',
}

export default async function TimecardApprovalsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team/approvals')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
    is_super_admin: session.user.isSuperAdmin,
  }

  if (!canAccessSection(user, 'timecards')) {
    redirect('/admin?error=no_timecards_access')
  }

  return (
    <AdminPageWrapper
      title="Freigaben"
      description="Eingereichte Zeitkarten und Abwesenheiten prüfen und genehmigen."
      icon={CheckSquare}
      iconColor="green"
    >
      <ApprovalTabs />
      <TimecardApprovalsClient />
      <div className="mt-10 border-t border-subtle pt-8">
        <TimeOffApprovals />
      </div>
    </AdminPageWrapper>
  )
}
