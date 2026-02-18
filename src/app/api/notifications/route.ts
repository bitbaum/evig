/**
 * Notifications API
 *
 * GET  /api/notifications        - List current user's notifications (unread first, last 30)
 * PATCH /api/notifications       - Mark all notifications as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

async function getDbUserId(email: string): Promise<string | null> {
  const result = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [email]
  )
  return result.rows[0]?.id ?? null
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return apiError('Unauthorized', 'Nicht angemeldet', 401)
    }

    const userId = await getDbUserId(session.user.email)
    if (!userId) {
      return apiError('Not found', 'Benutzer nicht gefunden', 404)
    }

    const result = await query<{
      id: string
      type: string
      title: string
      content: string
      related_type: string | null
      related_id: string | null
      is_read: boolean
      read_at: string | null
      created_at: string
    }>(
      `SELECT id, type, title, content, related_type, related_id, is_read, read_at, created_at
       FROM ${TABLE_NAMES.NOTIFICATIONS}
       WHERE user_id = $1
       ORDER BY is_read ASC, created_at DESC
       LIMIT 30`,
      [userId]
    )

    const unreadCount = result.rows.filter(n => !n.is_read).length

    return apiSuccess({
      notifications: result.rows,
      unreadCount,
    })
  } catch (error) {
    logger.error('Failed to fetch notifications', { error })
    return apiError(error, 'Benachrichtigungen konnten nicht geladen werden')
  }
}

export async function PATCH(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return apiError('Unauthorized', 'Nicht angemeldet', 401)
    }

    const userId = await getDbUserId(session.user.email)
    if (!userId) {
      return apiError('Not found', 'Benutzer nicht gefunden', 404)
    }

    await query(
      `UPDATE ${TABLE_NAMES.NOTIFICATIONS}
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    )

    return apiSuccess({ message: 'Alle Benachrichtigungen als gelesen markiert' })
  } catch (error) {
    logger.error('Failed to mark notifications as read', { error })
    return apiError(error, 'Benachrichtigungen konnten nicht aktualisiert werden')
  }
}
