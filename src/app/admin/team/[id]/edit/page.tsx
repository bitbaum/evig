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
import { logger } from '@/lib/logger'
import { TeamProfileForm } from '@/components/admin/team'
import Heading from '@/components/admin/AdminHeading'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)

  return {
    title: profile
      ? `${profile.user_name || profile.user_email} bearbeiten | Team`
      : 'Profil bearbeiten',
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
  // Lifecycle (visible to any team admin)
  end_date: string | null
  exit_reason: string | null
  work_state: string
  // Sensitive (super-admin only; null otherwise)
  hourly_rate_cents: number | null
  salary_chf: string | number | null
  salary_effective_date: string | null
  ahv_number: string | null
  canton_tax_code: string | null
}

async function getProfile(id: string, includeSensitive = false): Promise<ProfileData | null> {
  try {
    // hr_notes + compensation + AHV/canton are all super-admin-only.
    // Lifecycle (end_date / exit_reason / work_state) is admin-level.
    const sensitiveColumns = includeSensitive
      ? `,
        tp.hr_notes,
        tp.hourly_rate_cents,
        tp.salary_chf,
        tp.salary_effective_date,
        tp.ahv_number,
        tp.canton_tax_code`
      : ''

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
        tp.emergency_contact_relation,
        tp.end_date,
        tp.exit_reason,
        tp.work_state,
        tp.is_active${sensitiveColumns}
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.id = $1`,
      [id]
    )

    return result.rows[0] || null
  } catch (error) {
    logger.error('Failed to fetch team profile for edit', { error, profileId: id })
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
        <Heading level={1} className="text-2xl font-bold text-text-primary">
          Profil bearbeiten
        </Heading>
        <p className="text-text-secondary mt-1">
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
