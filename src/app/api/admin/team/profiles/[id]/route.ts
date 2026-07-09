/**
 * API: Team Profile Detail
 *
 * GET    /api/admin/team/profiles/[id] - Get profile details
 * PUT    /api/admin/team/profiles/[id] - Update profile
 * DELETE /api/admin/team/profiles/[id] - Delete profile
 *
 * Access: Staff with 'team' permission
 */

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { teamProfiles, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { isSuperAdmin } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateUpdateTeamProfile } from '@/lib/schemas/team'
import { mapTeamProfileUpdate } from '@/lib/services/team-profiles'

/**
 * GET /api/admin/team/profiles/[id]
 * Get detailed team profile information
 */
export const GET = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Build select columns - conditionally include sensitive fields for super admins
    const selectCols = {
      id: teamProfiles.id,
      user_id: teamProfiles.userId,
      user_name: users.name,
      user_email: users.email,
      user_created_at: users.createdAt,
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
      // Lifecycle fields visible to any team admin
      end_date: teamProfiles.endDate,
      exit_reason: teamProfiles.exitReason,
      work_state: teamProfiles.workState,
      is_active: teamProfiles.isActive,
      show_on_about: teamProfiles.showOnAbout,
      created_at: teamProfiles.createdAt,
      updated_at: teamProfiles.updatedAt,
    }

    // Conditionally add sensitive fields for super admins:
    // compensation (hourly_rate / salary), AHV/canton, hr_notes.
    if (isSuperAdminUser) {
      Object.assign(selectCols, {
        hr_notes: teamProfiles.hrNotes,
        hourly_rate_cents: teamProfiles.hourlyRateCents,
        salary_chf: teamProfiles.salaryChf,
        salary_effective_date: teamProfiles.salaryEffectiveDate,
        ahv_number: teamProfiles.ahvNumber,
        canton_tax_code: teamProfiles.cantonTaxCode,
      })
    }

    const [profile] = await db
      .select(selectCols)
      .from(teamProfiles)
      .innerJoin(users, eq(teamProfiles.userId, users.id))
      .where(eq(teamProfiles.id, id))

    if (!profile) {
      return apiNotFound('Team-Profil')
    }

    return apiSuccess(profile)
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht geladen werden')
  }
})

/**
 * PUT /api/admin/team/profiles/[id]
 * Update team profile
 */
export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()

    // Validate input
    const validation = validateUpdateTeamProfile(body)
    if (!validation.success) {
      return apiBadRequest(
        ERROR_MESSAGES.VALIDATION_ERROR,
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data
    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    // Check if profile exists
    const [existingProfile] = await db
      .select({ id: teamProfiles.id })
      .from(teamProfiles)
      .where(eq(teamProfiles.id, id))

    if (!existingProfile) {
      return apiNotFound('Team-Profil')
    }

    // Build update object from validated data (sensitive fields gated on super
    // admin) — the SAME mapping the self-service /profiles/me route uses.
    const update = mapTeamProfileUpdate(data, isSuperAdminUser)

    if (Object.keys(update).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    update.updatedAt = sql`NOW()`

    await db.update(teamProfiles).set(update).where(eq(teamProfiles.id, id))

    logger.info('Team profile updated', {
      profileId: id,
      updatedBy: session.user.email,
      fields: Object.keys(data),
    })

    return apiSuccess({ message: 'Team-Profil aktualisiert' })
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht aktualisiert werden')
  }
})

/**
 * DELETE /api/admin/team/profiles/[id]
 * Delete team profile
 */
export const DELETE = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check if profile exists and get user info for logging
    const [profile] = await db
      .select({
        id: teamProfiles.id,
        userId: teamProfiles.userId,
        userEmail: users.email,
      })
      .from(teamProfiles)
      .innerJoin(users, eq(teamProfiles.userId, users.id))
      .where(eq(teamProfiles.id, id))

    if (!profile) {
      return apiNotFound('Team-Profil')
    }

    await db.delete(teamProfiles).where(eq(teamProfiles.id, id))

    logger.info('Team profile deleted', {
      profileId: id,
      userId: profile.userId,
      deletedBy: session.user.email,
    })

    return apiSuccess({ message: 'Team-Profil gelöscht' })
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht gelöscht werden')
  }
})
