/**
 * Weekly Digest Page - Server Component
 *
 * Management summary showing:
 * - Weekly activity totals
 * - Top contributors
 * - Category breakdown
 * - Recent milestones
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { BarChart3 } from 'lucide-react'
import { DigestPageClient } from './DigestPageClient'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Wochenübersicht',
  description: 'Wöchentliche Team-Aktivitätsübersicht.',
}

export default async function DigestPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team/digest')
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
      title="Wochenübersicht"
      description="Zusammenfassung der Team-Aktivitäten"
      icon={BarChart3}
      iconColor="green"
      backButton={{ href: ROUTES.admin.team, label: 'Zurück zum Team' }}
    >
      <DigestPageClient />
    </AdminPageWrapper>
  )
}
