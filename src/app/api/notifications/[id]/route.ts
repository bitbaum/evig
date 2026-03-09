/**
 * Single Notification API
 *
 * PATCH /api/notifications/[id] - Mark a single notification as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { notifications, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
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

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))

    if (!user) {
      return apiError('Not found', 'Benutzer nicht gefunden', 404)
    }

    // Update only if owned by this user (prevents reading other users' notifications)
    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: sql`NOW()`,
      })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id),
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
}
