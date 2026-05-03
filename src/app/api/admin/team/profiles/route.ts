/**
 * API: Team Profiles List & Create
 *
 * GET  /api/admin/team/profiles - List all team profiles with filters
 * POST /api/admin/team/profiles - Create a new team profile
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { teamProfiles, users } from '@/db/schema'
import { eq, and, or, ilike, asc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateCreateTeamProfile, teamProfileFilterSchema } from '@/lib/schemas/team'

/**
 * GET /api/admin/team/profiles
 * List team profiles with optional filters
 */
export const GET = withAdmin('team', async (request, session) => {
  try {
    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const filterResult = teamProfileFilterSchema.safeParse({
      department: searchParams.get('department') || undefined,
      employment_type: searchParams.get('employment_type') || undefined,
      is_active: searchParams.get('is_active') || 'all',
      search: searchParams.get('search') || undefined,
    })

    if (!filterResult.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_FILTER_PARAMS)
    }

    const filters = filterResult.data
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Build dynamic filters
    const conditions: SQL[] = []
    if (filters.department) conditions.push(eq(teamProfiles.department, filters.department))
    if (filters.employment_type) conditions.push(eq(teamProfiles.employmentType, filters.employment_type))
    if (filters.is_active !== 'all') conditions.push(eq(teamProfiles.isActive, filters.is_active === 'true'))
    if (filters.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(teamProfiles.position, `%${filters.search}%`)
        )!
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Always select all columns including hr_notes; strip for non-super-admins
    const rows = await db
      .select({
        id: teamProfiles.id,
        user_id: teamProfiles.userId,
        user_name: users.name,
        user_email: users.email,
        position: teamProfiles.position,
        department: teamProfiles.department,
        employment_type: teamProfiles.employmentType,
        start_date: teamProfiles.startDate,
        contract_hours: teamProfiles.contractHours,
        skills: teamProfiles.skills,
        interests: teamProfiles.interests,
        goals: teamProfiles.goals,
        strengths: teamProfiles.strengths,
        development_areas: teamProfiles.developmentAreas,
        availability: teamProfiles.availability,
        working_hours: teamProfiles.workingHours,
        preferred_contact: teamProfiles.preferredContact,
        phone: teamProfiles.phone,
        emergency_contact_name: teamProfiles.emergencyContactName,
        emergency_contact_phone: teamProfiles.emergencyContactPhone,
        emergency_contact_relation: teamProfiles.emergencyContactRelation,
        hr_notes: teamProfiles.hrNotes,
        is_active: teamProfiles.isActive,
        created_at: teamProfiles.createdAt,
        updated_at: teamProfiles.updatedAt,
      })
      .from(teamProfiles)
      .innerJoin(users, eq(teamProfiles.userId, users.id))
      .where(where)
      .orderBy(asc(users.name), asc(users.email))

    // Strip hr_notes for non-super-admins
    const result = isSuperAdminUser
      ? rows
      : rows.map(({ hr_notes, ...rest }) => rest)

    return apiSuccess(result)
  } catch (error) {
    return apiError(error, 'Team-Profile konnten nicht geladen werden')
  }
})

/**
 * POST /api/admin/team/profiles
 * Create a new team profile for a user
 */
export const POST = withAdmin('team', async (request, session) => {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateCreateTeamProfile(body)
    if (!validation.success) {
      return apiBadRequest(
        ERROR_MESSAGES.VALIDATION_ERROR,
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
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, data.user_id))

    if (!user) {
      return apiBadRequest(ERROR_MESSAGES.USER_NOT_FOUND)
    }

    // Check if profile already exists for this user
    const [existingProfile] = await db
      .select({ id: teamProfiles.id })
      .from(teamProfiles)
      .where(eq(teamProfiles.userId, data.user_id))

    if (existingProfile) {
      return apiBadRequest('Für diesen Benutzer existiert bereits ein Team-Profil')
    }

    // Insert new profile
    const [created] = await db
      .insert(teamProfiles)
      .values({
        userId: data.user_id,
        position: data.position || null,
        department: data.department || null,
        employmentType: data.employment_type || null,
        startDate: data.start_date || null,
        contractHours: data.contract_hours || null,
        skills: data.skills || [],
        interests: data.interests || [],
        goals: data.goals || null,
        strengths: data.strengths || null,
        developmentAreas: data.development_areas || null,
        availability: data.availability || null,
        workingHours: data.working_hours || null,
        preferredContact: data.preferred_contact || 'email',
        phone: data.phone || null,
        emergencyContactName: data.emergency_contact_name || null,
        emergencyContactPhone: data.emergency_contact_phone || null,
        emergencyContactRelation: data.emergency_contact_relation || null,
        hrNotes: data.hr_notes || null,
        isActive: data.is_active ?? true,
      })
      .returning({ id: teamProfiles.id })

    logger.info('Team profile created', {
      profileId: created.id,
      userId: data.user_id,
      createdBy: session.user.email,
    })

    return apiSuccess({ id: created.id, message: 'Team-Profil erstellt' }, 201)
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht erstellt werden')
  }
})
