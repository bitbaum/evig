/**
 * Help Requests Page - Server Component
 *
 * Dashboard for help requests:
 * - Open requests (broadcast and targeted)
 * - Resolved requests history
 * - Create new help request
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection } from '@/lib/permissions'
import { HELP_REQUEST_STATUS } from '@/config/activity'
import { URGENCY } from '@/config/it-hilfe'
import { HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { HelpRequestsPageClient } from './HelpRequestsPageClient'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminHeroStatus, type HeroKpi } from '@/components/admin/AdminHeroStatus'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Hilfsanfragen',
  description: 'Team-Hilfsanfragen verwalten.',
}

interface HelpStats {
  open: number
  in_progress: number
  resolved_this_week: number
  urgent_open: number
}

async function getHelpStats(): Promise<HelpStats> {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [openResult, inProgressResult, resolvedResult, urgentResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.HELP_REQUESTS} WHERE status = $1`,
        [HELP_REQUEST_STATUS.OPEN]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.HELP_REQUESTS} WHERE status = $1`,
        [HELP_REQUEST_STATUS.IN_PROGRESS]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.HELP_REQUESTS} WHERE status = $1 AND resolved_at >= $2`,
        [HELP_REQUEST_STATUS.RESOLVED, weekAgo]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.HELP_REQUESTS} WHERE status = $1 AND urgency = $2`,
        [HELP_REQUEST_STATUS.OPEN, URGENCY.URGENT]
      ),
    ])

    return {
      open: parseInt(openResult.rows[0]?.count || '0'),
      in_progress: parseInt(inProgressResult.rows[0]?.count || '0'),
      resolved_this_week: parseInt(resolvedResult.rows[0]?.count || '0'),
      urgent_open: parseInt(urgentResult.rows[0]?.count || '0'),
    }
  } catch {
    return { open: 0, in_progress: 0, resolved_this_week: 0, urgent_open: 0 }
  }
}

async function getTeamMembers() {
  try {
    const result = await query<{
      id: string
      user_id: string
      user_name: string | null
      user_email: string
    }>(
      `SELECT tp.id, tp.user_id, u.name as user_name, u.email as user_email
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.is_active = true
       ORDER BY u.name ASC NULLS LAST, u.email ASC`
    )
    return result.rows
  } catch {
    return []
  }
}

/**
 * Hero status for the team help-requests page. Severity ladder:
 *   urgent open > regular open > healthy.
 * The "in_progress" count isn't a CTA target — someone's already on it.
 * "resolved this week" is purely informational, kept in the KPI strip.
 */
function HelpRequestsHero({ stats }: { stats: HelpStats }) {
  const kpis: HeroKpi[] = [
    { label: 'Offen', value: stats.open },
    { label: 'In Bearbeitung', value: stats.in_progress },
    { label: 'Dringend', value: stats.urgent_open },
    { label: 'Diese Woche gelöst', value: stats.resolved_this_week },
  ]

  if (stats.urgent_open > 0) {
    return (
      <AdminHeroStatus
        tone="urgent"
        icon={AlertTriangle}
        headline={`${stats.urgent_open} dringende Anfrage${stats.urgent_open === 1 ? '' : 'n'} im Team`}
        sub="Kollege/Kollegin braucht jetzt Hilfe — übernimm oder vermittle."
        kpis={kpis}
      />
    )
  }
  if (stats.open > 0) {
    return (
      <AdminHeroStatus
        tone="attention"
        icon={HelpCircle}
        headline={`${stats.open} offene Anfrage${stats.open === 1 ? '' : 'n'}`}
        sub="Niemand hat sie übernommen. Auch wenn nicht dringend: jemand wartet."
        kpis={kpis}
      />
    )
  }
  return (
    <AdminHeroStatus
      tone="healthy"
      icon={CheckCircle}
      headline="Keine offenen Hilfsanfragen."
      sub={`${stats.resolved_this_week} Anfrage${stats.resolved_this_week === 1 ? '' : 'n'} diese Woche gelöst.`}
      kpis={kpis}
    />
  )
}

export default async function HelpRequestsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team/help')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'team')) {
    redirect('/admin?error=no_team_access')
  }

  const [stats, teamMembers] = await Promise.all([
    getHelpStats(),
    getTeamMembers(),
  ])

  return (
    <AdminPageWrapper
      title="Hilfsanfragen"
      description="Hilfe anfordern und Kollegen unterstützen"
      icon={HelpCircle}
      iconColor="amber"
      backButton={{ href: ROUTES.admin.team, label: 'Zurück zum Team' }}
    >
      <HelpRequestsHero stats={stats} />

      {/* Help Requests (Client Component) */}
      <HelpRequestsPageClient
        teamMembers={teamMembers}
        currentUserEmail={session.user.email}
      />
    </AdminPageWrapper>
  )
}
