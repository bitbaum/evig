/**
 * Create New Team Profile Page
 *
 * Server component that fetches available users and passes to form.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
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
  const session = await auth()
  const { user_id: preselectedUserId } = await searchParams

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team/new')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'team')) {
    redirect('/admin?error=no_team_access')
  }

  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)
  const availableUsers = await getStaffWithoutProfiles()

  // Check if preselected user is valid
  const validPreselection = preselectedUserId
    ? availableUsers.find(u => u.id === preselectedUserId)
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
          Neues Team-Profil erstellen
        </Heading>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Erstelle ein Profil für ein Staff-Mitglied
        </p>
      </div>

      {availableUsers.length === 0 ? (
        <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center">
          <Heading level={2} className="text-lg font-medium text-yellow-900 dark:text-yellow-200 mb-2">
            Alle Staff-Mitglieder haben bereits ein Profil
          </Heading>
          <p className="text-yellow-700 dark:text-yellow-300">
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
