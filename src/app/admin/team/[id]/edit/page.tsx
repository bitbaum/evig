/**
 * Team Profile Edit Page
 *
 * Server component that fetches profile data and passes to form.
 */

import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { TeamProfileForm } from '@/components/admin/team'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)

  return {
    title: profile
      ? `${profile.user_name || profile.user_email} bearbeiten | Team | RevampIT Admin`
      : 'Profil bearbeiten | RevampIT Admin',
    description: 'Team-Profil bearbeiten',
  }
}

interface ProfileData {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  position: string | null
  department: string | null
  employment_type: string | null
  start_date: string | null
  contract_hours: number | null
  skills: string[]
  interests: string[]
  goals: string | null
  strengths: string | null
  development_areas: string | null
  availability: string | null
  working_hours: string | null
  preferred_contact: string
  phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  hr_notes: string | null
  is_active: boolean
}

async function getProfile(id: string, includeHrNotes = false): Promise<ProfileData | null> {
  try {
    const hrNotesColumn = includeHrNotes ? ', tp.hr_notes' : ''

    const result = await query<ProfileData>(
      `SELECT
        tp.id,
        tp.user_id,
        u.name as user_name,
        u.email as user_email,
        tp.position,
        tp.department,
        tp.employment_type,
        tp.start_date,
        tp.contract_hours,
        tp.skills,
        tp.interests,
        tp.goals,
        tp.strengths,
        tp.development_areas,
        tp.availability,
        tp.working_hours,
        tp.preferred_contact,
        tp.phone,
        tp.emergency_contact_name,
        tp.emergency_contact_phone,
        tp.emergency_contact_relation
        ${hrNotesColumn},
        tp.is_active
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.id = $1`,
      [id]
    )

    return result.rows[0] || null
  } catch {
    return null
  }
}

export default async function TeamProfileEditPage({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team')
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
  const profile = await getProfile(id, currentUserIsSuperAdmin)

  if (!profile) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profil bearbeiten
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {profile.user_name || profile.user_email}
        </p>
      </div>

      <TeamProfileForm
        initialData={profile}
        isEdit
        profileId={id}
        isSuperAdmin={currentUserIsSuperAdmin}
      />
    </div>
  )
}
