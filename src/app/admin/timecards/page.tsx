import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Clock } from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { canAccessSection } from '@/lib/permissions'
import { TimecardsClient } from './TimecardsClient'
import { TimecardApprovalQueue } from './TimecardApprovalQueue'

export const metadata: Metadata = {
  title: 'Zeitkarten',
  description: 'Arbeitszeiten erfassen und genehmigen.',
}

export default async function TimecardsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/timecards')
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

  const [profile] = await db
    .select({ workingHours: teamProfiles.workingHours })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, session.user.id))
    .limit(1)

  return (
    <AdminPageWrapper
      title="Zeitkarten"
      description="Arbeitszeiten erfassen, einreichen und genehmigen"
      icon={Clock}
      iconColor="blue"
    >
      <TimecardsClient
        workingHours={profile?.workingHours ?? null}
        userName={session.user.name || session.user.email || 'Teammitglied'}
      />
      <div className="mt-6">
        <TimecardApprovalQueue />
      </div>
    </AdminPageWrapper>
  )
}
