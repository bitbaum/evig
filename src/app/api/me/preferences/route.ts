import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { users } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'

const PreferencesSchema = z.object({
  dashboardMode: z.enum(['coordinator', 'lead', 'volunteer']).optional(),
})

export const PATCH = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(PreferencesSchema, body)
    if (!validation.success) return validation.error

    const { dashboardMode } = validation.data

    if (dashboardMode !== undefined) {
      await db
        .update(users)
        .set({ dashboardMode })
        .where(eq(users.id, session.user.id))
    }

    return apiSuccess(null)
  } catch (error) {
    logger.error('preferences PATCH failed', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
