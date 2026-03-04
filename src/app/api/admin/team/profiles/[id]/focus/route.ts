/**
 * API: Current Focus Update
 *
 * PUT /api/admin/team/profiles/[id]/focus - Update current focus status
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
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
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { current_focus } = validation.data

    // Get the profile to check existence
    const profile = await query<{ id: string; user_id: string; user_email: string }>(
      `SELECT tp.id, tp.user_id, u.email as user_email
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       WHERE tp.id = $1`,
      [id]
    )

    if (profile.rows.length === 0) {
      return apiNotFound('Team-Profil')
    }

    // Update current focus
    await query(
      `UPDATE ${TABLE_NAMES.TEAM_PROFILES}
       SET current_focus = $1,
           current_focus_updated_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [current_focus, id]
    )

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
