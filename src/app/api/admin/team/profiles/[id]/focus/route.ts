/**
 * API: Current Focus Update
 *
 * PUT /api/admin/team/profiles/[id]/focus - Update current focus status
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { teamProfiles, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateCurrentFocus } from '@/lib/schemas/activity'

/**
 * PUT /api/admin/team/profiles/[id]/focus
 * Update current focus for a team member
 */
export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()

    // Validate input
    const validation = validateCurrentFocus(body)
    if (!validation.success) {
      return apiBadRequest(
        ERROR_MESSAGES.VALIDATION_ERROR,
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { current_focus } = validation.data

    // Get the profile to check existence
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

    // Update current focus
    await db
      .update(teamProfiles)
      .set({
        currentFocus: current_focus,
        currentFocusUpdatedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(teamProfiles.id, id))

    logger.info('Current focus updated', {
      profileId: id,
      updatedBy: session.user.email,
      focus: current_focus ? current_focus.substring(0, 50) : null,
    })

    return apiSuccess({
      message: 'Fokus aktualisiert',
      current_focus,
      current_focus_updated_at: new Date().toISOString(),
    })
  } catch (error) {
    return apiError(error, 'Fokus konnte nicht aktualisiert werden')
  }
})
