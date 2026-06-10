/**
 * Create New Team Profile Page
 *
 * Server component that fetches available users and passes to form.
 */

import { Metadata } from 'next'
import { isSuperAdmin } from '@/lib/permissions'
import { requireSection } from '@/lib/admin/guards'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { TeamProfileForm } from '@/components/admin/team'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Neues Team-Profil',
  description: 'Neues Team-Profil erstellen',
}

interface PageProps {
  searchParams: Promise<{ user_id?: string }>
}

interface StaffUser {
  id: string
  name: string | null
  email: string
}

async function getStaffWithoutProfiles(): Promise<StaffUser[]> {
  try {
    const result = await query<StaffUser>(
      `SELECT u.id, u.name, u.email
       FROM ${TABLE_NAMES.USERS} u
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON u.id = tp.user_id
       WHERE u.is_staff = true AND tp.id IS NULL
       ORDER BY u.name ASC NULLS LAST, u.email ASC`
    )
    return result.rows
  } catch (error) {
    logger.error('Failed to fetch staff without profiles', { error })
    return []
  }
}

export default async function NewTeamProfilePage({ searchParams }: PageProps) {
  const session = await requireSection('team')
  const { user_id: preselectedUserId } = await searchParams

  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)
  const availableUsers = await getStaffWithoutProfiles()

  // Check if preselected user is valid — chip from /admin/team passes
  // the user_id directly, so this lands on the form with the user
  // already locked in (one fewer click).
  const validPreselection = preselectedUserId
    ? availableUsers.find(u => u.id === preselectedUserId)
    : null

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 border-b border-subtle pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {validPreselection
            ? `Für ${validPreselection.name || validPreselection.email}`
            : 'Staff-Profil anlegen'}
        </p>
        <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
          Neues Team-Profil
        </Heading>
      </header>

      {availableUsers.length === 0 ? (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-6 text-center dark:border-warning-800 dark:bg-warning-900/20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-warning-700 dark:text-warning-400">
            Alle Profile angelegt
          </p>
          <p className="mt-2 text-sm text-warning-800 dark:text-warning-300">
            Es gibt keine Staff-Mitglieder ohne Team-Profil.
          </p>
        </div>
      ) : (
        <TeamProfileForm
          users={availableUsers}
          initialData={validPreselection ? { user_id: validPreselection.id } : undefined}
          isSuperAdmin={currentUserIsSuperAdmin}
        />
      )}
    </div>
  )
}
