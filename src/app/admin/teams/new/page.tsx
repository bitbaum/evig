import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import TeamFormClient from '@/components/admin/teams/TeamFormClient'
import { ROUTES } from '@/config/routes'
import { requireSection } from '@/lib/admin/guards'

export const metadata: Metadata = { title: 'Neues Team' }

export default async function NewTeamPage() {
  const session = await requireSection('teams')
  // Creating a team is structural — super admins only (matches the API guard).
  if (!session.user.isSuperAdmin) redirect(ROUTES.admin.teams)

  return (
    <AdminPageWrapper
      title="Neues Team"
      description="Ein Team mit Zuständigkeit und Mailordnern anlegen."
      icon={Users}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.teams, label: 'Alle Teams' }}
    >
      <TeamFormClient />
    </AdminPageWrapper>
  )
}
