/**
 * Notifications API
 *
 * GET  /api/notifications        - List current user's notifications (unread first, last 30)
 * PATCH /api/notifications       - Mark all notifications as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, notifications } from '@/db/schema'
import { eq, and, asc, desc, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'

async function getDbUserId(email: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
  return user?.id ?? null
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

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        content: notifications.content,
        related_type: notifications.relatedType,
        related_id: notifications.relatedId,
        is_read: notifications.isRead,
        read_at: notifications.readAt,
        created_at: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(asc(notifications.isRead), desc(notifications.createdAt))
      .limit(30)

    const unreadCount = rows.filter(n => !n.is_read).length

    return apiSuccess({
      notifications: rows,
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

    await db
      .update(notifications)
      .set({ isRead: true, readAt: sql`NOW()` })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))

    return apiSuccess({ message: 'Alle Benachrichtigungen als gelesen markiert' })
  } catch (error) {
    logger.error('Failed to mark notifications as read', { error })
    return apiError(error, 'Benachrichtigungen konnten nicht aktualisiert werden')
  }
}
