/**
 * API: Team Profiles List & Create
 *
 * GET  /api/admin/team/profiles - List all team profiles with filters
 * POST /api/admin/team/profiles - Create a new team profile
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
  apiBadRequest,
} from '@/lib/api/helpers'
import { validateCreateTeamProfile, teamProfileFilterSchema } from '@/lib/schemas/team'

/**
 * GET /api/admin/team/profiles
 * List team profiles with optional filters
 *
 * Query params:
 * - department: Filter by department
 * - employment_type: Filter by employment type
 * - is_active: 'true', 'false', or 'all' (default)
 * - search: Search by name or position
 */
export async function GET(request: NextRequest) {
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

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const filterResult = teamProfileFilterSchema.safeParse({
      department: searchParams.get('department') || undefined,
      employment_type: searchParams.get('employment_type') || undefined,
      is_active: searchParams.get('is_active') || 'all',
      search: searchParams.get('search') || undefined,
    })

    if (!filterResult.success) {
      return apiBadRequest('Ungültige Filterparameter')
    }

    const filters = filterResult.data
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Build query with filters
    const conditions: string[] = []
    const values: (string | boolean)[] = []
    let paramIndex = 1

    if (filters.department) {
      conditions.push(`tp.department = $${paramIndex}`)
      values.push(filters.department)
      paramIndex++
    }

    if (filters.employment_type) {
      conditions.push(`tp.employment_type = $${paramIndex}`)
      values.push(filters.employment_type)
      paramIndex++
    }

    if (filters.is_active !== 'all') {
      conditions.push(`tp.is_active = $${paramIndex}`)
      values.push(filters.is_active === 'true')
      paramIndex++
    }

    if (filters.search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR tp.position ILIKE $${paramIndex})`)
      values.push(`%${filters.search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Select columns - exclude hr_notes for non-super-admins
    const hrNotesColumn = isSuperAdminUser ? ', tp.hr_notes' : ''

    const result = await query<{
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
       ${whereClause}
       ORDER BY u.name ASC NULLS LAST, u.email ASC`,
      values
    )

    return apiSuccess(result.rows)
  } catch (error) {
    return apiError(error, 'Team-Profile konnten nicht geladen werden')
  }
}

/**
 * POST /api/admin/team/profiles
 * Create a new team profile for a user
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate input
    const validation = validateCreateTeamProfile(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Only super admins can set hr_notes
    if (data.hr_notes && !isSuperAdminUser) {
      delete (data as { hr_notes?: string }).hr_notes
    }

    // Check if user exists
    const userCheck = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [data.user_id]
    )

    if (userCheck.rows.length === 0) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    // Check if profile already exists for this user
    const existingProfile = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.TEAM_PROFILES} WHERE user_id = $1`,
      [data.user_id]
    )

    if (existingProfile.rows.length > 0) {
      return apiBadRequest('Für diesen Benutzer existiert bereits ein Team-Profil')
    }

    // Insert new profile
    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.TEAM_PROFILES} (
        user_id,
        position,
        department,
        employment_type,
        start_date,
        contract_hours,
        skills,
        interests,
        goals,
        strengths,
        development_areas,
        availability,
        working_hours,
        preferred_contact,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        hr_notes,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id`,
      [
        data.user_id,
        data.position || null,
        data.department || null,
        data.employment_type || null,
        data.start_date || null,
        data.contract_hours || null,
        data.skills || [],
        data.interests || [],
        data.goals || null,
        data.strengths || null,
        data.development_areas || null,
        data.availability || null,
        data.working_hours || null,
        data.preferred_contact || 'email',
        data.phone || null,
        data.emergency_contact_name || null,
        data.emergency_contact_phone || null,
        data.emergency_contact_relation || null,
        data.hr_notes || null,
        data.is_active ?? true,
      ]
    )

    logger.info('Team profile created', {
      profileId: result.rows[0].id,
      userId: data.user_id,
      createdBy: session.user.email,
    })

    return apiSuccess({ id: result.rows[0].id, message: 'Team-Profil erstellt' }, 201)
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht erstellt werden')
  }
}
