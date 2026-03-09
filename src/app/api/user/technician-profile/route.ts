/**
 * Technician Profile API
 * GET /api/user/technician-profile - Get current user's technician profile
 * PUT /api/user/technician-profile - Create or update technician profile
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { helperProfiles, userSkills } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { IT_SKILLS } from '@/config/it-hilfe'
import { validateBody, TechnicianProfileSchema } from '@/lib/schemas'

/**
 * GET /api/user/technician-profile
 * Get current user's technician profile and skills
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Get technician profile
    const [profileRow] = await db
      .select({
        bio: helperProfiles.bio,
        hourlyRateCents: helperProfiles.hourlyRateCents,
        acceptsGratis: helperProfiles.acceptsGratis,
        acceptsKulturlegi: helperProfiles.acceptsKulturlegi,
        serviceTypes: helperProfiles.serviceTypes,
        locationPostalCode: helperProfiles.locationPostalCode,
        locationCity: helperProfiles.locationCity,
        locationCanton: helperProfiles.locationCanton,
        maxTravelKm: helperProfiles.maxTravelKm,
        isActive: helperProfiles.isActive,
      })
      .from(helperProfiles)
      .where(eq(helperProfiles.userId, session.user.id))

    // Get user skills
    const skillRows = await db
      .select({
        skillId: userSkills.skillId,
        categoryId: userSkills.categoryId,
      })
      .from(userSkills)
      .where(eq(userSkills.userId, session.user.id))

    // Map to response format
    const profile = profileRow
      ? {
          skills: skillRows.map((r) => r.skillId),
          bio: profileRow.bio || '',
          hourlyRateCents: profileRow.hourlyRateCents,
          acceptsGratis: profileRow.acceptsGratis,
          acceptsKulturlegi: profileRow.acceptsKulturlegi,
          serviceTypes: profileRow.serviceTypes || ['flexible'],
          postalCode: profileRow.locationPostalCode || '',
          city: profileRow.locationCity || '',
          canton: profileRow.locationCanton || '',
          maxTravelKm: profileRow.maxTravelKm,
          isActive: profileRow.isActive,
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
}

/**
 * PUT /api/user/technician-profile
 * Create or update technician profile and skills
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

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
      canton,
      maxTravelKm,
      isActive,
    } = validation.data

    // Upsert technician profile
    await db
      .insert(helperProfiles)
      .values({
        userId: session.user.id,
        bio: bio || undefined,
        hourlyRateCents,
        acceptsGratis,
        acceptsKulturlegi,
        serviceTypes: serviceTypes.length > 0 ? serviceTypes : undefined,
        locationPostalCode: postalCode || undefined,
        locationCity: city || undefined,
        locationCanton: canton || undefined,
        maxTravelKm,
        isActive,
      })
      .onConflictDoUpdate({
        target: helperProfiles.userId,
        set: {
          bio: bio || null,
          hourlyRateCents,
          acceptsGratis,
          acceptsKulturlegi,
          serviceTypes: serviceTypes.length > 0 ? serviceTypes : null,
          locationPostalCode: postalCode || null,
          locationCity: city || null,
          locationCanton: canton || null,
          maxTravelKm,
          isActive,
          updatedAt: sql`NOW()`,
        },
      })

    // Update skills - delete existing and insert new
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
}

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
