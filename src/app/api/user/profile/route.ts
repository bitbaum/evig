/**
 * User Profile API
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 */

import { NextRequest } from 'next/server'
import { getOrCreateProfile, updateProfile } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { validateBody, UpdateProfileSchema } from '@/lib/schemas'

export const GET = withAuth(async (request, session) => {
  try {
    const profile = await getOrCreateProfile(session.user.id)
    return apiSuccess({ profile })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht geladen werden')
  }
})


export const PUT = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(UpdateProfileSchema, body)
    if (!validation.success) return validation.error
    const updateData = validation.data

    const updatedProfile = await updateProfile(session.user.id, updateData)

    return apiSuccess({
      profile: updatedProfile,
    })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht aktualisiert werden')
  }
})







