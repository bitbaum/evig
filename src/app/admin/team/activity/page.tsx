/**
 * Team Activity Page - Server Component
 *
 * Unified activity stream showing:
 * - Task completions
 * - Manual activity updates
 * - Help requests
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { Activity } from 'lucide-react'
import { ActivityPageClient } from './ActivityPageClient'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Aktivitäten',
  description: 'Team-Aktivitäten und Updates.',
}

export default async function TeamActivityPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team/activity')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'team')) {
    redirect('/admin?error=no_team_access')
  }

  return (
    <AdminPageWrapper
      title="Team-Aktivitäten"
      description="Was im Team passiert - Aufgaben, Updates, Meilensteine"
      icon={Activity}
      iconColor="green"
      backButton={{ href: ROUTES.admin.team, label: 'Zurück zum Team' }}
    >
      <ActivityPageClient />
    </AdminPageWrapper>
  )
}
