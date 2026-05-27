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
import { HelpCircle, ArrowLeft, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { HelpRequestsPageClient } from './HelpRequestsPageClient'
import Heading from '@/components/admin/AdminHeading'
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
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.HELP_REQUESTS} WHERE status = $1 AND urgency = '${URGENCY.URGENT}'`,
        [HELP_REQUEST_STATUS.OPEN]
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.admin.team}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-warning-600 dark:text-warning-200" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
              Hilfsanfragen
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400">
              Hilfe anfordern und Kollegen unterstützen
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-warning-600 dark:text-warning-200" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.open}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Offen</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.in_progress}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">In Bearbeitung</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.resolved_this_week}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Diese Woche gelöst</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error-100 dark:bg-error-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.urgent_open}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Dringend</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Requests (Client Component) */}
      <HelpRequestsPageClient
        teamMembers={teamMembers}
        currentUserEmail={session.user.email}
      />
    </div>
  )
}
