import { Metadata } from 'next'
import Link from 'next/link'
import { PeopleTeamsTabs } from '@/components/admin/team/PeopleTeamsTabs'
import { Users, Plus, Mail, UserRound, UserRoundX, LayoutGrid } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsStrip } from '@/components/admin/AdminStatsStrip'
import { buttonClass } from '@/components/ui/button-class'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/config/routes'
import { requireSection } from '@/lib/admin/guards'
import { listTeams, listStaffWithoutTeam } from '@/lib/services/teams'
import { getAccentClasses } from '@/config/teams'
import type { TeamListItem } from '@/lib/schemas/teams'
import { logger } from '@/lib/logger'

export const metadata: Metadata = {
  title: 'Teams',
  description: 'Teams, Zuständigkeiten und Mitglieder.',
}

export default async function TeamsAdminPage() {
  const session = await requireSection('teams')
  const isSuperAdmin = session.user.isSuperAdmin

  let teams: TeamListItem[] = []
  let ohneTeamCount = 0
  let listError = false
  try {
    const [t, ohne] = await Promise.all([listTeams(), listStaffWithoutTeam()])
    teams = t
    ohneTeamCount = ohne.length
  } catch (error) {
    logger.error('Error loading teams', { error })
    listError = true
  }
  const totalMemberships = teams.reduce((sum, t) => sum + t.member_count, 0)

  return (
    <AdminPageWrapper
      title="Teams"
      description="Wer gehört zu welchem Team, und wofür ist es zuständig."
      icon={Users}
      iconColor="blue"
      actions={
        <div className="flex items-center gap-2">
          <Link href={ROUTES.admin.teamsAssignment} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            <LayoutGrid className="w-4 h-4" />
            Zuordnung
          </Link>
          {isSuperAdmin && (
            <Link href={ROUTES.admin.teamsNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
              <Plus className="w-4 h-4" />
              Neues Team
            </Link>
          )}
        </div>
      }
    >
      <PeopleTeamsTabs />

      {listError ? (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300">
          Fehler beim Laden der Teams.
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Noch keine Teams"
          description="Lege ein Team an, um Zuständigkeiten und Mitglieder abzubilden."
          action={
            isSuperAdmin ? (
              <Link href={ROUTES.admin.teamsNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
                <Plus className="w-4 h-4" />
                Neues Team
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          <AdminStatsStrip
            items={[
              { icon: Users, color: 'blue', label: 'Teams', value: teams.length },
              { icon: UserRound, color: 'green', label: 'Zuordnungen', value: totalMemberships },
              {
                icon: UserRoundX,
                color: ohneTeamCount > 0 ? 'amber' : 'gray',
                label: 'Ohne Team',
                value: ohneTeamCount,
                href: ROUTES.admin.teamsAssignment,
              },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <Link
              key={t.id}
              href={ROUTES.admin.teamBySlug(t.slug)}
              className="bg-surface-base rounded-lg border p-5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors block"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-text-primary leading-snug">{t.name}</h2>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getAccentClasses(t.accent)}`}>
                  <UserRound className="w-3 h-3" />
                  {t.member_count}
                </span>
              </div>

              {t.purpose && <p className="text-sm text-text-secondary line-clamp-2 mb-3">{t.purpose}</p>}

              {t.lead_names.length > 0 && (
                <p className="text-xs text-text-tertiary mb-2">
                  <span className="font-medium text-text-secondary">Verantwortlich:</span>{' '}
                  {t.lead_names.join(', ')}
                </p>
              )}

              {t.mail_folders.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.mail_folders.slice(0, 4).map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-raised text-text-secondary text-[11px]"
                    >
                      <Mail className="w-3 h-3" />
                      {f}
                    </span>
                  ))}
                  {t.mail_folders.length > 4 && (
                    <span className="px-1.5 py-0.5 text-[11px] text-text-tertiary">
                      +{t.mail_folders.length - 4}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
