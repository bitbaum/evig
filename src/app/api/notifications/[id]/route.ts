/**
 * Single Notification API
 *
 * PATCH /api/notifications/[id] - Mark a single notification as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return apiError('Unauthorized', 'Nicht angemeldet', 401)
    }

    const { id } = await params

    const userResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [session.user.email]
    )
    const userId = userResult.rows[0]?.id
    if (!userId) {
      return apiError('Not found', 'Benutzer nicht gefunden', 404)
    }

    // Update only if owned by this user (prevents reading other users' notifications)
    const result = await query<{ id: string }>(
      `UPDATE ${TABLE_NAMES.NOTIFICATIONS}
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_read = false
       RETURNING id`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      // Either not found, not owned, or already read — all acceptable
      return apiSuccess({ message: 'Bereits gelesen oder nicht gefunden' })
    }

    return apiSuccess({ message: 'Als gelesen markiert' })
  } catch (error) {
    logger.error('Failed to mark notification as read', { error })
    return apiError(error, 'Benachrichtigung konnte nicht aktualisiert werden')
  }
}
