import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Users, Pencil, Mail, HeartPulse, CalendarClock } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { buttonClass } from '@/components/ui/button-class'
import MembershipManager from '@/components/admin/teams/MembershipManager'
import TeamFocusInput from '@/components/admin/teams/TeamFocusInput'
import TeamJoinButton from '@/components/admin/teams/TeamJoinButton'
import TeamGoalsSection from '@/components/admin/teams/TeamGoalsSection'
import TeamMetricsSection from '@/components/admin/teams/TeamMetricsSection'
import { ROUTES } from '@/config/routes'
import { requireSection } from '@/lib/admin/guards'
import { getTeamBySlug, getTeamMembers, listStaffCandidates, listTeams } from '@/lib/services/teams'
import { listGoals, listMetrics } from '@/lib/services/team-coordination'
import { getAccentClasses } from '@/config/teams'
import { WORK_STATES, WORK_STATE_LABELS, WORK_STATE_COLORS, type WorkState } from '@/config/team'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const team = await getTeamBySlug(slug)
  return { title: team ? team.name : 'Team' }
}

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await requireSection('teams')
  const { slug } = await params

  const team = await getTeamBySlug(slug)
  if (!team) notFound()

  const [members, candidates, allTeams, goals, metrics] = await Promise.all([
    getTeamMembers(team.id),
    listStaffCandidates(),
    listTeams(),
    listGoals(team.id),
    listMetrics(team.id),
  ])
  const teamRefs = allTeams.map((t) => ({ id: t.id, name: t.name, accent: t.accent }))

  // The viewer's own live membership in this team (drives the join/leave button).
  const viewerMembership = members.find((m) => m.user_id === session.user.id) ?? null

  // Coverage: how many members are currently available (work_state) vs. away.
  const stateCount = (state: string) => members.filter((m) => (m.work_state ?? 'active') === state).length
  const available = stateCount(WORK_STATES.ACTIVE)
  const awayStates = ([WORK_STATES.ON_LEAVE, WORK_STATES.UNAVAILABLE, WORK_STATES.INACTIVE] as WorkState[])
    .map((s) => ({ state: s, count: stateCount(s) }))
    .filter((s) => s.count > 0)

  return (
    <AdminPageWrapper
      title={team.name}
      description={team.purpose ?? undefined}
      icon={Users}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.teams, label: 'Alle Teams' }}
      actions={
        <div className="flex items-center gap-2">
          <TeamJoinButton
            teamId={team.id}
            viewerUserId={session.user.id}
            viewerMembershipId={viewerMembership?.membership_id ?? null}
          />
          {session.user.isSuperAdmin && (
            <Link href={ROUTES.admin.teamEdit(team.slug)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              <Pencil className="w-4 h-4" />
              Bearbeiten
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Meta strip: accent + mail folders + team focus */}
        <div className="bg-surface-base rounded-lg border p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getAccentClasses(team.accent)}`}>
              {team.name}
            </span>
            {!team.is_active && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-tertiary">
                Inaktiv
              </span>
            )}
          </div>

          {team.mail_folders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Betreute Mailordner</p>
              <div className="flex flex-wrap gap-1.5">
                {team.mail_folders.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-raised text-text-secondary text-xs">
                    <Mail className="w-3 h-3" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coverage */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1">
              <HeartPulse className="w-3 h-3" />
              Verfügbarkeit
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-text-primary">
                <span className="font-semibold tabular-nums">{available}</span> von{' '}
                <span className="tabular-nums">{members.length}</span> verfügbar
              </span>
              {awayStates.map(({ state, count }) => (
                <span key={state} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${WORK_STATE_COLORS[state]}`}>
                  {count}× {WORK_STATE_LABELS[state]}
                </span>
              ))}
            </div>
          </div>

          {/* Team focus (editable) */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Aktueller Fokus</p>
            <TeamFocusInput
              teamId={team.id}
              initialFocus={team.current_focus}
              initialUpdatedAt={team.current_focus_updated_at}
            />
          </div>

          {team.meeting_cadence && (
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <CalendarClock className="w-4 h-4 shrink-0" aria-hidden />
              <span>Sitzungsrhythmus: {team.meeting_cadence}</span>
            </div>
          )}
        </div>

        {/* Coordination: goals + KPI metrics */}
        <div className="grid gap-5 lg:grid-cols-2">
          <TeamGoalsSection teamId={team.id} goals={goals} />
          <TeamMetricsSection teamId={team.id} metrics={metrics} />
        </div>

        {/* Members */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Mitglieder <span className="text-text-tertiary font-normal">({members.length})</span>
          </h2>
          <MembershipManager
            teamId={team.id}
            teamName={team.name}
            teamAccent={team.accent}
            members={members}
            candidates={candidates}
            allTeams={teamRefs}
            isSuperAdmin={session.user.isSuperAdmin}
          />
        </div>
      </div>
    </AdminPageWrapper>
  )
}
