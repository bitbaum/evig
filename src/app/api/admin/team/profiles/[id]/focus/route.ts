/**
 * API: Current Focus Update
 *
 * PUT /api/admin/team/profiles/[id]/focus - Update current focus status
 *
 * Access: Staff with 'team' permission (or own profile)
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { canAccessSection } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { validateCurrentFocus } from '@/lib/schemas/activity'

interface RequestContext {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/admin/team/profiles/[id]/focus
 * Update current focus for a team member
 */
export async function PUT(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const { id } = await context.params
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

    // Get the profile to check ownership
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

    const isOwnProfile = profile.rows[0].user_email === session.user.email

    // Allow if own profile OR has team permission
    if (!isOwnProfile) {
      const user = {
        email: session.user.email,
        is_staff: session.user.isStaff,
        staff_permissions: session.user.staffPermissions,
      }

      if (!canAccessSection(user, 'team')) {
        return apiForbidden('Kein Zugriff')
      }
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
}
