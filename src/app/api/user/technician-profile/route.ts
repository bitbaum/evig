/**
 * Technician Profile API
 * GET /api/user/technician-profile - Get current user's technician profile
 * PUT /api/user/technician-profile - Create or update technician profile
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { IT_SKILLS } from '@/config/it-hilfe'
import { validateBody, TechnicianProfileSchema } from '@/lib/schemas'

interface TechnicianProfileRow {
  id: string
  user_id: string
  bio: string | null
  hourly_rate_cents: number | null
  accepts_gratis: boolean
  accepts_kulturlegi: boolean
  service_types: string[] | null
  location_postal_code: string | null
  location_city: string | null
  location_canton: string | null
  max_travel_km: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserSkillRow {
  skill_id: string
  category_id: string
}

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
    const profileResult = await query(
      `
      SELECT id, user_id, bio, hourly_rate_cents, accepts_gratis, accepts_kulturlegi,
             service_types, location_postal_code, location_city, location_canton,
             max_travel_km, is_active, created_at, updated_at
      FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}
      WHERE user_id = $1
    `,
      [session.user.id]
    )

    // Get user skills
    const skillsResult = await query(
      `
      SELECT skill_id, category_id FROM ${TABLE_NAMES.USER_SKILLS}
      WHERE user_id = $1
    `,
      [session.user.id]
    )

    const profileRow = profileResult.rows[0] as TechnicianProfileRow | undefined
    const skillRows = skillsResult.rows as UserSkillRow[]

    // Map to response format
    const profile = profileRow
      ? {
          skills: skillRows.map((r) => r.skill_id),
          bio: profileRow.bio || '',
          hourlyRateCents: profileRow.hourly_rate_cents,
          acceptsGratis: profileRow.accepts_gratis,
          acceptsKulturlegi: profileRow.accepts_kulturlegi,
          serviceTypes: profileRow.service_types || ['flexible'],
          postalCode: profileRow.location_postal_code || '',
          city: profileRow.location_city || '',
          canton: profileRow.location_canton || '',
          maxTravelKm: profileRow.max_travel_km,
          isActive: profileRow.is_active,
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
    await query(
      `
      INSERT INTO ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} (
        user_id,
        bio,
        hourly_rate_cents,
        accepts_gratis,
        accepts_kulturlegi,
        service_types,
        location_postal_code,
        location_city,
        location_canton,
        max_travel_km,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        hourly_rate_cents = EXCLUDED.hourly_rate_cents,
        accepts_gratis = EXCLUDED.accepts_gratis,
        accepts_kulturlegi = EXCLUDED.accepts_kulturlegi,
        service_types = EXCLUDED.service_types,
        location_postal_code = EXCLUDED.location_postal_code,
        location_city = EXCLUDED.location_city,
        location_canton = EXCLUDED.location_canton,
        max_travel_km = EXCLUDED.max_travel_km,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `,
      [
        session.user.id,
        bio || null,
        hourlyRateCents,
        acceptsGratis,
        acceptsKulturlegi,
        serviceTypes.length > 0 ? serviceTypes : null,
        postalCode || null,
        city || null,
        canton || null,
        maxTravelKm,
        isActive,
      ]
    )

    // Update skills - delete existing and insert new
    await query(
      `DELETE FROM ${TABLE_NAMES.USER_SKILLS} WHERE user_id = $1`,
      [session.user.id]
    )

    if (skills.length > 0) {
      // Batch insert skills
      const skillValues = skills
        .map(
          (_: string, i: number) =>
            `($1, $${i * 2 + 2}, $${i * 2 + 3})`
        )
        .join(', ')

      const skillParams: (string | null)[] = [session.user.id]
      skills.forEach((skillId: string) => {
        // Derive category from skill ID
        const category = getCategoryForSkill(skillId)
        skillParams.push(skillId, category)
      })

      await query(
        `
        INSERT INTO ${TABLE_NAMES.USER_SKILLS} (user_id, skill_id, category_id)
        VALUES ${skillValues}
      `,
        skillParams
      )
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
