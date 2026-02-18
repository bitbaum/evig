/**
 * Notification Service
 *
 * Helpers for creating notifications. Fire-and-forget: errors are logged
 * but never propagate to callers — a failed notification must never break
 * the action that triggered it.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface NotificationPayload {
  type: string
  title: string
  content: string
  related_type?: 'task' | 'protocol' | 'decision'
  related_id?: string
}

/**
 * Create a single notification for one user.
 */
export async function createNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  await query(
    `INSERT INTO ${TABLE_NAMES.NOTIFICATIONS}
       (user_id, type, title, content, related_type, related_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      payload.type,
      payload.title,
      payload.content,
      payload.related_type ?? null,
      payload.related_id ?? null,
    ]
  )
}

/**
 * Notify every active staff member.
 */
export async function notifyAllStaff(
  payload: NotificationPayload,
  excludeUserId?: string,
): Promise<void> {
  const staffResult = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS}
     WHERE is_staff = true
     ${excludeUserId ? `AND id != $1` : ''}`,
    excludeUserId ? [excludeUserId] : []
  )

  const userIds = staffResult.rows.map(r => r.id)
  if (userIds.length === 0) return

  // Bulk insert — one row per staff member
  const placeholders = userIds
    .map((_, i) => {
      const base = i * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    })
    .join(', ')

  const params: (string | null)[] = []
  for (const userId of userIds) {
    params.push(
      userId,
      payload.type,
      payload.title,
      payload.content,
      payload.related_type ?? null,
      payload.related_id ?? null,
    )
  }

  await query(
    `INSERT INTO ${TABLE_NAMES.NOTIFICATIONS}
       (user_id, type, title, content, related_type, related_id)
     VALUES ${placeholders}`,
    params
  )
}

/**
 * Notify a list of specific users (e.g. protocol attendees).
 */
export async function notifyUsers(
  userIds: string[],
  payload: NotificationPayload,
): Promise<void> {
  if (userIds.length === 0) return

  const placeholders = userIds
    .map((_, i) => {
      const base = i * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    })
    .join(', ')

  const params: (string | null)[] = []
  for (const userId of userIds) {
    params.push(
      userId,
      payload.type,
      payload.title,
      payload.content,
      payload.related_type ?? null,
      payload.related_id ?? null,
    )
  }

  await query(
    `INSERT INTO ${TABLE_NAMES.NOTIFICATIONS}
       (user_id, type, title, content, related_type, related_id)
     VALUES ${placeholders}`,
    params
  )
}

/**
 * Safe wrapper — logs errors but never throws.
 * Use this when firing notifications as side-effects of other operations.
 */
export function fireNotification(
  fn: () => Promise<void>,
  context: string,
): void {
  fn().catch((error) => {
    logger.error(`Notification failed: ${context}`, { error })
  })
}
