/**
 * Single Notification API
 *
 * PATCH /api/notifications/[id] - Mark a single notification as read
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export const PATCH = withAuth<{ id: string }>(async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const { id } = context!.params!

    // Update only if owned by this user (prevents reading other users' notifications)
    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: sql`NOW()`,
      })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
      ))
      .returning({ id: notifications.id })

    if (!updated) {
      return apiSuccess({ message: 'Bereits gelesen oder nicht gefunden' })
    }

    return apiSuccess({ message: 'Als gelesen markiert' })
  } catch (error) {
    logger.error('Failed to mark notification as read', { error })
    return apiError(error, 'Benachrichtigung konnte nicht aktualisiert werden')
  }
})
