/**
 * Team Profile Detail Page
 *
 * Server component that fetches profile data and passes to view component.
 */

import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { TeamProfileDetailClient } from './TeamProfileDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)

  return {
    title: profile
      ? `${profile.user_name || profile.user_email} | Team | RevampIT Admin`
      : 'Team-Profil | RevampIT Admin',
    description: 'Team-Profil Details',
  }
}

interface ProfileData {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  user_created_at: string
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
  created_at: string
  updated_at: string
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
        u."createdAt" as user_created_at,
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
        tp.is_active,
        tp.created_at,
        tp.updated_at
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

export default async function TeamProfilePage({ params }: PageProps) {
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
    <TeamProfileDetailClient
      profile={profile}
      isSuperAdmin={currentUserIsSuperAdmin}
    />
  )
}
