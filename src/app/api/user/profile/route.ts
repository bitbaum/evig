/**
 * User Profile API
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { validateBody, UpdateProfileSchema } from '@/lib/schemas'
import { getOrCreateProfile, updateProfile } from '@/lib/auth/db-users'

export const GET = withAuth(async (_request, session) => {
  try {
    // db-users is the single DAL for user_profiles — it returns the snake_case
    // shape the dashboard profile client (ProfileData) reads. (The previous
    // inline query returned camelCase Drizzle rows, so saved fields never
    // populated the form.) `role` drives the service-provider section.
    const profile = await getOrCreateProfile(session.user.id)
    return apiSuccess({ profile, role: session.user.role })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht geladen werden')
  }
})

export const PUT = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(UpdateProfileSchema, body)
    if (!validation.success) return validation.error

    // updateProfile owns the snake→camel field mapping (SSOT) + get-or-create.
    const profile = await updateProfile(
      session.user.id,
      validation.data as Parameters<typeof updateProfile>[1],
    )
    return apiSuccess({ profile })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht aktualisiert werden')
  }
})
