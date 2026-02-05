/**
 * API: Team Profile Detail
 *
 * GET    /api/admin/team/profiles/[id] - Get profile details
 * PUT    /api/admin/team/profiles/[id] - Update profile
 * DELETE /api/admin/team/profiles/[id] - Delete profile
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { validateUpdateTeamProfile } from '@/lib/schemas/team'

interface RequestContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/team/profiles/[id]
 * Get detailed team profile information
 */
export async function GET(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'team')) {
      return apiForbidden('Kein Zugriff auf Team-Bereich')
    }

    const { id } = await context.params
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Select columns - exclude hr_notes for non-super-admins
    const hrNotesColumn = isSuperAdminUser ? ', tp.hr_notes' : ''

    const result = await query<{
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
      hr_notes?: string | null
      is_active: boolean
      created_at: string
      updated_at: string
    }>(
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
        tp.is_active${hrNotesColumn},
        tp.created_at,
        tp.updated_at
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Team-Profil')
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht geladen werden')
  }
}

/**
 * PUT /api/admin/team/profiles/[id]
 * Update team profile
 */
export async function PUT(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'team')) {
      return apiForbidden('Kein Zugriff auf Team-Bereich')
    }

    const { id } = await context.params
    const body = await request.json()

    // Validate input
    const validation = validateUpdateTeamProfile(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Check if profile exists
    const existingProfile = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.TEAM_PROFILES} WHERE id = $1`,
      [id]
    )

    if (existingProfile.rows.length === 0) {
      return apiNotFound('Team-Profil')
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: (string | number | boolean | string[] | null)[] = []
    let paramIndex = 1

    const allowedFields = [
      'position',
      'department',
      'employment_type',
      'start_date',
      'contract_hours',
      'skills',
      'interests',
      'goals',
      'strengths',
      'development_areas',
      'availability',
      'working_hours',
      'preferred_contact',
      'phone',
      'emergency_contact_name',
      'emergency_contact_phone',
      'emergency_contact_relation',
      'is_active',
    ]

    // Add hr_notes only for super admins
    if (isSuperAdminUser) {
      allowedFields.push('hr_notes')
    }

    for (const field of allowedFields) {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = $${paramIndex}`)
        values.push(data[field as keyof typeof data] as string | number | boolean | string[] | null)
        paramIndex++
      }
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Felder zum Aktualisieren')
    }

    values.push(id)

    await query(
      `UPDATE ${TABLE_NAMES.TEAM_PROFILES}
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}`,
      values
    )

    logger.info('Team profile updated', {
      profileId: id,
      updatedBy: session.user.email,
      fields: Object.keys(data),
    })

    return apiSuccess({ message: 'Team-Profil aktualisiert' })
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht aktualisiert werden')
  }
}

/**
 * DELETE /api/admin/team/profiles/[id]
 * Delete team profile
 */
export async function DELETE(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'team')) {
      return apiForbidden('Kein Zugriff auf Team-Bereich')
    }

    const { id } = await context.params

    // Check if profile exists
    const existingProfile = await query<{ id: string; user_id: string }>(
      `SELECT tp.id, tp.user_id, u.email as user_email
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.id = $1`,
      [id]
    )

    if (existingProfile.rows.length === 0) {
      return apiNotFound('Team-Profil')
    }

    // Delete profile
    await query(
      `DELETE FROM ${TABLE_NAMES.TEAM_PROFILES} WHERE id = $1`,
      [id]
    )

    logger.info('Team profile deleted', {
      profileId: id,
      userId: existingProfile.rows[0].user_id,
      deletedBy: session.user.email,
    })

    return apiSuccess({ message: 'Team-Profil gelöscht' })
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht gelöscht werden')
  }
}
