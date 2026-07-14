import { Metadata } from 'next'
import { LayoutGrid } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import AssignmentBoard, { type BoardColumn } from '@/components/admin/teams/AssignmentBoard'
import { ROUTES } from '@/config/routes'
import { requireSection } from '@/lib/admin/guards'
import { listTeams, getTeamMembers, listStaffWithoutTeam } from '@/lib/services/teams'

export const metadata: Metadata = { title: 'Team-Zuordnung' }
export const dynamic = 'force-dynamic'

export default async function TeamAssignmentPage() {
  await requireSection('teams')

  const teams = await listTeams()
  const [membersPerTeam, ohneTeam] = await Promise.all([
    Promise.all(teams.map((t) => getTeamMembers(t.id))),
    listStaffWithoutTeam(),
  ])

  const columns: BoardColumn[] = [
    { teamId: null, teamName: 'Ohne Team', accent: 'neutral', members: ohneTeam },
    ...teams.map((t, i) => ({
      teamId: t.id,
      teamName: t.name,
      accent: t.accent,
      members: membersPerTeam[i],
    })),
  ]
  const allTeams = teams.map((t) => ({ id: t.id, name: t.name, accent: t.accent }))

  return (
    <AdminPageWrapper
      title="Team-Zuordnung"
      description="Wer gehört zu welchem Team — per Ziehen (Desktop) oder Tippen verschieben."
      icon={LayoutGrid}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.teams, label: 'Alle Teams' }}
    >
      <AssignmentBoard columns={columns} allTeams={allTeams} />
    </AdminPageWrapper>
  )
}
