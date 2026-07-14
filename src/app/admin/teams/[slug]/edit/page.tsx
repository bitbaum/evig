import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import TeamFormClient from '@/components/admin/teams/TeamFormClient'
import { ROUTES } from '@/config/routes'
import { requireSection } from '@/lib/admin/guards'
import { getTeamBySlug } from '@/lib/services/teams'

export const metadata: Metadata = { title: 'Team bearbeiten' }

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function EditTeamPage({ params }: PageProps) {
  const session = await requireSection('teams')
  if (!session.user.isSuperAdmin) redirect(ROUTES.admin.teams)

  const { slug } = await params
  const team = await getTeamBySlug(slug)
  if (!team) notFound()

  return (
    <AdminPageWrapper
      title={`${team.name} bearbeiten`}
      icon={Users}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.teamBySlug(team.slug), label: team.name }}
    >
      <TeamFormClient team={team} />
    </AdminPageWrapper>
  )
}
