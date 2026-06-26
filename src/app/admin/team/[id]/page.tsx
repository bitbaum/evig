/**
 * Team Profile Detail Page
 *
 * Server component that fetches profile data and passes to view component.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isSuperAdmin } from '@/lib/permissions'
import { requireSection } from '@/lib/admin/guards'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { TeamProfileDetailClient } from './TeamProfileDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)

  return {
    title: profile
      ? `${profile.user_name || profile.user_email} | Team`
      : 'Team-Profil',
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
  current_focus: string | null
  current_focus_updated_at: string | null
  // Phase 4 (migration 080)
  hourly_rate_cents: number | null
  salary_chf: string | number | null
  salary_effective_date: string | null
  end_date: string | null
  exit_reason: string | null
  ahv_number: string | null
  canton_tax_code: string | null
  work_state: string
  is_active: boolean
  show_on_about: boolean
  created_at: string
  updated_at: string
}

async function getProfile(id: string, includeHrNotes = false): Promise<ProfileData | null> {
  try {
    // hr_notes + the new comp/Swiss-employment fields stay super-admin-only.
    // Non-super-admin staff still see lifecycle (end_date, exit_reason,
    // work_state) since those govern who can pick up shifts and aren't
    // financially sensitive.
    const sensitiveColumns = includeHrNotes
      ? ', tp.hr_notes, tp.hourly_rate_cents, tp.salary_chf, tp.salary_effective_date, tp.ahv_number, tp.canton_tax_code'
      : ''

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
        tp.emergency_contact_relation,
        tp.current_focus,
        tp.current_focus_updated_at,
        tp.end_date,
        tp.exit_reason,
        tp.work_state
        ${sensitiveColumns},
        tp.is_active,
        tp.show_on_about,
        tp.created_at,
        tp.updated_at
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.id = $1`,
      [id]
    )

    return result.rows[0] || null
  } catch (error) {
    logger.error('Failed to fetch team profile', { error, profileId: id })
    return null
  }
}

export default async function TeamProfilePage({ params }: PageProps) {
  const session = await requireSection('team')
  const { id } = await params
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
