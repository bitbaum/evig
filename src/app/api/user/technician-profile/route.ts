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
import { z } from 'zod'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { validateBody, TechnicianProfileSchema } from '@/lib/schemas'
import { getTechnicianSelfProfile, upsertTechnicianProfile, setTechnicianActive } from '@/lib/services/technician-service'

/**
 * GET /api/user/technician-profile
 * Get current user's technician profile and skills.
 */
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const { profile, hasProfile } = await getTechnicianSelfProfile(session.user.id)
    return apiSuccess({ profile, hasProfile })
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

    await upsertTechnicianProfile(session.user.id, validation.data)

    logger.info('Updated technician profile', {
      userId: session.user.id,
      skillCount: validation.data.skills.length,
      isActive: validation.data.isActive,
    })

    return apiSuccess({
      message: 'Techniker-Profil erfolgreich gespeichert',
    })
  } catch (error) {
    logger.error('Error updating technician profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

const ActiveSchema = z.object({ isActive: z.boolean() })

/**
 * PATCH /api/user/technician-profile
 * Pause or reactivate the profile (the deliberate opt-out). Body: { isActive }.
 */
export const PATCH = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const parsed = ActiveSchema.safeParse(await request.json())
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)

    const result = await setTechnicianActive(session.user.id, parsed.data.isActive)
    if (result === null) return apiNotFound('Techniker-Profil')

    logger.info('Toggled technician active state', { userId: session.user.id, isActive: result })
    return apiSuccess({ isActive: result })
  } catch (error) {
    logger.error('Error toggling technician active state', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
