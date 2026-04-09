/**
 * Technician Profile API
 * GET /api/user/technician-profile - Get current user's technician profile
 * PUT /api/user/technician-profile - Create or update technician profile
 *
 * Self-registered technicians are written to repairer_profiles with
 * profile_tier = 'community'. Professional repairers go through the
 * repairer application flow and are assigned tier = 'professional' by admins.
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { repairerProfiles, userSkills } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  apiError,
  apiSuccess,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { IT_SKILLS } from '@/config/it-hilfe'
import { validateBody, TechnicianProfileSchema } from '@/lib/schemas'

/**
 * GET /api/user/technician-profile
 * Get current user's technician profile and skills.
 */
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const [profileRow] = await db
      .select({
        bio: repairerProfiles.description,
        hourlyRateCents: repairerProfiles.hourlyRateCents,
        acceptsGratis: repairerProfiles.acceptsGratis,
        acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
        serviceTypes: repairerProfiles.serviceDeliveryTypes,
        postalCode: repairerProfiles.postalCode,
        city: repairerProfiles.city,
        maxTravelKm: repairerProfiles.maxTravelKm,
        isActive: repairerProfiles.isActive,
        profileTier: repairerProfiles.profileTier,
      })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.userId, session.user.id))

    const skillRows = await db
      .select({
        skillId: userSkills.skillId,
        categoryId: userSkills.categoryId,
      })
      .from(userSkills)
      .where(eq(userSkills.userId, session.user.id))

    const profile = profileRow
      ? {
          skills: skillRows.map((r) => r.skillId),
          bio: profileRow.bio || '',
          hourlyRateCents: profileRow.hourlyRateCents,
          acceptsGratis: profileRow.acceptsGratis,
          acceptsKulturlegi: profileRow.acceptsKulturlegi,
          serviceTypes: profileRow.serviceTypes || ['flexible'],
          postalCode: profileRow.postalCode || '',
          city: profileRow.city || '',
          // canton not available on repairer_profiles yet
          canton: '',
          maxTravelKm: profileRow.maxTravelKm,
          isActive: profileRow.isActive,
          profileTier: profileRow.profileTier,
        }
      : null

    return apiSuccess({
      profile,
      hasProfile: !!profile,
    })
  } catch (error) {
    logger.error('Error fetching technician profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

/**
 * PUT /api/user/technician-profile
 * Create or update technician profile and skills.
 * Self-registered users always get profile_tier = 'community'.
 */
export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const validation = validateBody(TechnicianProfileSchema, body)
    if (!validation.success) return validation.error
    const {
      skills,
      bio,
      hourlyRateCents,
      acceptsGratis,
      acceptsKulturlegi,
      serviceTypes,
      postalCode,
      city,
      maxTravelKm,
      isActive,
    } = validation.data

    // repairer_profiles requires phone, address, city, postal_code (NOT NULL).
    // For community self-registration, use defaults so the INSERT succeeds.
    // These can be updated later via a fuller profile form.
    await db
      .insert(repairerProfiles)
      .values({
        userId: session.user.id,
        description: bio || undefined,
        hourlyRateCents,
        acceptsGratis,
        acceptsKulturlegi,
        serviceDeliveryTypes: serviceTypes.length > 0 ? serviceTypes : undefined,
        city: city || '',
        postalCode: postalCode || '',
        // required NOT NULL columns — use empty strings as placeholder for community users
        phone: '',
        address: '',
        maxTravelKm,
        isActive,
        profileTier: 'community',
        status: 'active',
      })
      .onConflictDoUpdate({
        target: repairerProfiles.userId,
        set: {
          description: bio || null,
          hourlyRateCents,
          acceptsGratis,
          acceptsKulturlegi,
          serviceDeliveryTypes: serviceTypes.length > 0 ? serviceTypes : null,
          city: city || '',
          postalCode: postalCode || '',
          maxTravelKm,
          isActive,
          // Only set tier to 'community' if it is not already 'professional'
          // (don't demote a verified professional via this endpoint)
          profileTier: sql`CASE WHEN ${repairerProfiles.profileTier} = 'professional' THEN 'professional' ELSE 'community' END`,
          updatedAt: sql`NOW()`,
        },
      })

    // Replace skills: delete existing, insert new
    await db
      .delete(userSkills)
      .where(eq(userSkills.userId, session.user.id))

    if (skills.length > 0) {
      const skillValues = skills.map((skillId: string) => ({
        userId: session.user.id,
        skillId,
        categoryId: getCategoryForSkill(skillId),
      }))

      await db
        .insert(userSkills)
        .values(skillValues)
    }

    logger.info('Updated technician profile', {
      userId: session.user.id,
      skillCount: skills.length,
      isActive,
    })

    return apiSuccess({
      message: 'Techniker-Profil erfolgreich gespeichert',
    })
  } catch (error) {
    logger.error('Error updating technician profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

/**
 * Get category ID for a skill
 */
function getCategoryForSkill(skillId: string): string {
  for (const [categoryId, skills] of Object.entries(IT_SKILLS)) {
    if (
      (skills as Array<{ id: string }>).some((s) => s.id === skillId)
    ) {
      return categoryId
    }
  }
  return 'other'
}
