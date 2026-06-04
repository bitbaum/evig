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

    // Build update object from validated data
    const update: Record<string, unknown> = {}

    if (data.position !== undefined) update.position = data.position
    if (data.department !== undefined) update.department = data.department
    if (data.employment_type !== undefined) update.employmentType = data.employment_type
    if (data.start_date !== undefined) update.startDate = data.start_date
    if (data.contract_hours !== undefined) update.contractHours = data.contract_hours
    if (data.skills !== undefined) update.skills = data.skills
    if (data.interests !== undefined) update.interests = data.interests
    if (data.goals !== undefined) update.goals = data.goals
    if (data.strengths !== undefined) update.strengths = data.strengths
    if (data.development_areas !== undefined) update.developmentAreas = data.development_areas
    if (data.availability !== undefined) update.availability = data.availability
    if (data.working_hours !== undefined) update.workingHours = data.working_hours
    if (data.preferred_contact !== undefined) update.preferredContact = data.preferred_contact
    if (data.phone !== undefined) update.phone = data.phone
    if (data.emergency_contact_name !== undefined) update.emergencyContactName = data.emergency_contact_name
    if (data.emergency_contact_phone !== undefined) update.emergencyContactPhone = data.emergency_contact_phone
    if (data.emergency_contact_relation !== undefined) update.emergencyContactRelation = data.emergency_contact_relation
    if (data.is_active !== undefined) update.isActive = data.is_active

    // Lifecycle fields — admin-level (not just super admin)
    if (data.end_date !== undefined) update.endDate = data.end_date
    if (data.exit_reason !== undefined) update.exitReason = data.exit_reason
    if (data.work_state !== undefined) update.workState = data.work_state

    // Sensitive fields — super admin only (compensation, AHV, hr_notes)
    if (isSuperAdminUser) {
      if (data.hr_notes !== undefined) update.hrNotes = data.hr_notes
      if (data.hourly_rate_cents !== undefined) update.hourlyRateCents = data.hourly_rate_cents
      if (data.salary_chf !== undefined) update.salaryChf = data.salary_chf
      if (data.salary_effective_date !== undefined) update.salaryEffectiveDate = data.salary_effective_date
      if (data.ahv_number !== undefined) update.ahvNumber = data.ahv_number
      if (data.canton_tax_code !== undefined) update.cantonTaxCode = data.canton_tax_code
    }

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
