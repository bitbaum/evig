/**
 * Notification Service
 *
 * Helpers for creating notifications. Fire-and-forget: errors are logged
 * but never propagate to callers — a failed notification must never break
 * the action that triggered it.
 *
 * Each function now also sends an email when the user has opted in
 * (email_notifications = true in user_profiles, which is the default).
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { notificationEmail } from '@/lib/email/templates/notification'

interface NotificationPayload {
  type: string
  title: string
  content: string
  related_type?: 'task' | 'protocol' | 'decision'
  related_id?: string
}

// ---- helpers ----------------------------------------------------------------

interface UserEmailInfo {
  user_id: string
  email: string | null
  email_notifications: boolean | null
}

/** Send email + mark sent_email, swallowing errors. */
async function trySendEmail(
  notificationIds: string[],
  recipients: UserEmailInfo[],
  title: string,
  content: string,
): Promise<void> {
  const emailContent = notificationEmail(title, content)
  let anySent = false

  for (const r of recipients) {
    // Default to true when preference is null (new users)
    if (!r.email || r.email_notifications === false) continue

    try {
      await sendCustomEmail(r.email, emailContent)
      anySent = true
    } catch (err) {
      logger.error('Notification email failed', { userId: r.user_id, error: err })
    }
  }

  // Bulk-mark as emailed only if at least one email was sent (best-effort)
  if (anySent && notificationIds.length > 0) {
    const placeholders = notificationIds.map((_, i) => `$${i + 1}`).join(', ')
    await query(
      `UPDATE ${TABLE_NAMES.NOTIFICATIONS} SET sent_email = true WHERE id IN (${placeholders})`,
      notificationIds,
    ).catch((err) => {
      logger.error('Failed to mark sent_email', { error: err })
    })
  }
}

// ---- public API (signatures unchanged) --------------------------------------

/**
 * Create a single notification for one user.
 */
export async function createNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  const result = await query<{ id: string }>(
    `INSERT INTO ${TABLE_NAMES.NOTIFICATIONS}
       (user_id, type, title, content, related_type, related_id, sent_in_app)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id`,
    [
      userId,
      payload.type,
      payload.title,
      payload.content,
      payload.related_type ?? null,
      payload.related_id ?? null,
    ]
  )

  const notificationId = result.rows[0]?.id

  // Fetch email + preference
  const userResult = await query<UserEmailInfo>(
    `SELECT u.id AS user_id, u.email, up.email_notifications
     FROM ${TABLE_NAMES.USERS} u
     LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON up.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  )

  if (userResult.rows.length > 0 && notificationId) {
    await trySendEmail([notificationId], userResult.rows, payload.title, payload.content)
  }
}

/**
 * Notify every active staff member.
 */
export async function notifyAllStaff(
  payload: NotificationPayload,
  excludeUserId?: string,
): Promise<void> {
  const staffResult = await query<UserEmailInfo>(
    `SELECT u.id AS user_id, u.email, up.email_notifications
     FROM ${TABLE_NAMES.USERS} u
     LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON up.user_id = u.id
     WHERE u.is_staff = true
     ${excludeUserId ? `AND u.id != $1` : ''}`,
    excludeUserId ? [excludeUserId] : []
  )

  const staff = staffResult.rows
  if (staff.length === 0) return

  // Bulk insert — one row per staff member
  const placeholders = staff
    .map((_, i) => {
      const base = i * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, true)`
    })
    .join(', ')

  const params: (string | null)[] = []
  for (const s of staff) {
    params.push(
      s.user_id,
      payload.type,
      payload.title,
      payload.content,
      payload.related_type ?? null,
      payload.related_id ?? null,
    )
  }

  const insertResult = await query<{ id: string }>(
    `INSERT INTO ${TABLE_NAMES.NOTIFICATIONS}
       (user_id, type, title, content, related_type, related_id, sent_in_app)
     VALUES ${placeholders}
     RETURNING id`,
    params
  )

  const ids = insertResult.rows.map(r => r.id)
  await trySendEmail(ids, staff, payload.title, payload.content)
}

/**
 * Notify a list of specific users (e.g. protocol attendees).
 */
export async function notifyUsers(
  userIds: string[],
  payload: NotificationPayload,
): Promise<void> {
  if (userIds.length === 0) return

  // Fetch email + preference for all target users
  const idPlaceholders = userIds.map((_, i) => `$${i + 1}`).join(', ')
  const usersResult = await query<UserEmailInfo>(
    `SELECT u.id AS user_id, u.email, up.email_notifications
     FROM ${TABLE_NAMES.USERS} u
     LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON up.user_id = u.id
     WHERE u.id IN (${idPlaceholders})`,
    userIds,
  )

  // Build a lookup for email info
  const emailInfoMap = new Map(usersResult.rows.map(r => [r.user_id, r]))

  // Bulk insert notifications
  const placeholders = userIds
    .map((_, i) => {
      const base = i * 6
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, true)`
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

  const insertResult = await query<{ id: string }>(
    `INSERT INTO ${TABLE_NAMES.NOTIFICATIONS}
       (user_id, type, title, content, related_type, related_id, sent_in_app)
     VALUES ${placeholders}
     RETURNING id`,
    params
  )

  const ids = insertResult.rows.map(r => r.id)
  const recipients = userIds
    .map(id => emailInfoMap.get(id))
    .filter((r): r is UserEmailInfo => r !== undefined)

  await trySendEmail(ids, recipients, payload.title, payload.content)
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
