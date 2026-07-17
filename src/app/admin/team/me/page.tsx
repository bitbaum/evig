/**
 * /admin/team/me — read-only view of one's OWN team profile.
 *
 * Any staff member can see their own profile at a glance (skills, availability,
 * teams, focus) without entering the editor or the sensitive `team` route.
 * Gated only on isStaff (like /me/edit); shows non-sensitive fields only.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Pencil, Target, Sparkles, Clock, Phone, Compass } from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { buttonClass } from '@/components/ui/button-class'
import MemberTeamsCard from '@/components/admin/team/MemberTeamsCard'
import { ROUTES } from '@/config/routes'
import { getMembershipsForUser, listTeams } from '@/lib/services/teams'
import {
  EMPLOYMENT_TYPE_LABELS,
  CONTACT_METHOD_LABELS,
  type EmploymentType,
  type ContactMethod,
} from '@/config/team'
import { focusFreshness } from '@/lib/team/focus-freshness'
import { getPersonSaldo } from '@/lib/services/saldo'
import { SaldoStrip } from '@/components/timecards/SaldoStrip'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Mein Profil',
  description: 'Dein Team-Profil auf einen Blick.',
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-raised text-text-secondary">
          {s}
        </span>
      ))}
    </div>
  )
}

function Card({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-base rounded-lg border p-5">
      <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-text-secondary" />
        {title}
      </h2>
      {children}
    </div>
  )
}

export default async function MyTeamProfilePage() {
  const session = await auth()
  if (!session?.user?.id || !session.user.isStaff) {
    redirect('/auth/login?callbackUrl=/admin/team/me')
  }
  const userId = session.user.id

  const t = await getTranslations('admin.timecards')
  const [[row], memberships, teams, saldo] = await Promise.all([
    db
      .select({
        position: teamProfiles.position,
        employment_type: teamProfiles.employmentType,
        skills: teamProfiles.skills,
        interests: teamProfiles.interests,
        goals: teamProfiles.goals,
        strengths: teamProfiles.strengths,
        development_areas: teamProfiles.developmentAreas,
        availability: teamProfiles.availability,
        working_hours: teamProfiles.workingHours,
        preferred_contact: teamProfiles.preferredContact,
        phone: teamProfiles.phone,
        current_focus: teamProfiles.currentFocus,
        current_focus_updated_at: teamProfiles.currentFocusUpdatedAt,
      })
      .from(teamProfiles)
      .where(eq(teamProfiles.userId, userId)),
    getMembershipsForUser(userId).catch(() => []),
    listTeams().catch(() => []),
    getPersonSaldo(userId).catch(() => null),
  ])
  const currentMonth = new Date().toISOString().slice(0, 7)

  const name = session.user.name || session.user.email
  const skills = row?.skills ?? []
  const interests = row?.interests ?? []
  const fresh = focusFreshness(row?.current_focus_updated_at ?? null)
  const hasDevelopment = row?.goals || row?.strengths || row?.development_areas

  return (
    <AdminPageWrapper
      title="Mein Profil"
      description={[row?.position, row?.employment_type ? EMPLOYMENT_TYPE_LABELS[row.employment_type as EmploymentType] : null].filter(Boolean).join(' · ') || name || undefined}
      icon={Compass}
      iconColor="blue"
      actions={
        <Link href={ROUTES.admin.team + '/me/edit'} className={buttonClass({ variant: 'primary', size: 'sm' })}>
          <Pencil className="w-4 h-4" />
          Bearbeiten
        </Link>
      }
    >
      {/* Own Zeit-/Feriensaldo + the actions behind it — same numbers as the
          Zeiterfassung page and the HR detail view (one engine, three views). */}
      {saldo && (
        <div className="mb-5 space-y-2">
          <SaldoStrip data={saldo} reportHref={`/admin/team/report/${userId}/${currentMonth}`} />
          <div className="flex flex-wrap gap-x-4 text-sm">
            <Link href="/admin/zeiterfassung" className="inline-flex min-h-11 items-center font-medium text-action hover:underline">
              {t('selfTitle')} →
            </Link>
            <Link href="/admin/zeiterfassung#abwesenheit" className="inline-flex min-h-11 items-center font-medium text-action hover:underline">
              {t('saldoRequestAbsence')} →
            </Link>
            <Link href={`/admin/team/report/${userId}/${currentMonth}`} className="inline-flex min-h-11 items-center font-medium text-action hover:underline">
              {t('reportLink')} →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Focus */}
        <Card icon={Target} title="Aktueller Fokus">
          {row?.current_focus ? (
            <>
              <p className="text-sm text-text-primary">{row.current_focus}</p>
              {fresh && (
                <p className={`text-xs mt-1 ${fresh.isStale ? 'text-warning-600' : 'text-text-tertiary'}`}>
                  {fresh.isStale ? 'veraltet' : fresh.label}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-text-tertiary">Kein Fokus gesetzt — in «Bearbeiten» ergänzen.</p>
          )}
        </Card>

        {/* Teams (join/leave/move own memberships) */}
        <MemberTeamsCard
          person={{ userId, name, avatarUrl: null }}
          memberships={memberships}
          allTeams={teams.map((t) => ({ id: t.id, name: t.name, slug: t.slug, accent: t.accent }))}
        />

        {/* Skills + interests */}
        <Card icon={Sparkles} title="Fähigkeiten & Interessen">
          {skills.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-text-tertiary mb-1.5">Fähigkeiten</p>
              <Chips items={skills} />
            </div>
          )}
          {interests.length > 0 && (
            <div>
              <p className="text-xs text-text-tertiary mb-1.5">Interessen</p>
              <Chips items={interests} />
            </div>
          )}
          {skills.length === 0 && interests.length === 0 && (
            <p className="text-sm text-text-tertiary">Noch nichts erfasst.</p>
          )}
        </Card>

        {/* Availability + contact */}
        <Card icon={Clock} title="Erreichbarkeit">
          <dl className="space-y-2 text-sm">
            {row?.availability && (
              <div>
                <dt className="text-xs text-text-tertiary">Verfügbarkeit</dt>
                <dd className="text-text-primary whitespace-pre-wrap">{row.availability}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-text-tertiary">Bevorzugter Kontakt</dt>
              <dd className="text-text-primary">{CONTACT_METHOD_LABELS[(row?.preferred_contact ?? 'email') as ContactMethod]}</dd>
            </div>
            {row?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-text-tertiary" />
                <dd className="text-text-primary">{row.phone}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Development */}
        {hasDevelopment && (
          <Card icon={Compass} title="Entwicklung">
            <dl className="space-y-3 text-sm">
              {row?.goals && (
                <div><dt className="text-xs text-text-tertiary">Ziele</dt><dd className="text-text-primary whitespace-pre-wrap">{row.goals}</dd></div>
              )}
              {row?.strengths && (
                <div><dt className="text-xs text-text-tertiary">Stärken</dt><dd className="text-text-primary whitespace-pre-wrap">{row.strengths}</dd></div>
              )}
              {row?.development_areas && (
                <div><dt className="text-xs text-text-tertiary">Entwicklungsfelder</dt><dd className="text-text-primary whitespace-pre-wrap">{row.development_areas}</dd></div>
              )}
            </dl>
          </Card>
        )}
      </div>
    </AdminPageWrapper>
  )
}
