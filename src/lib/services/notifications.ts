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

import { db } from '@/db'
import { notifications, users, userProfiles } from '@/db/schema'
import { eq, inArray, and, ne, sql } from 'drizzle-orm'
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
  email: string
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
    await db
      .update(notifications)
      .set({ sentEmail: true })
      .where(inArray(notifications.id, notificationIds))
      .catch((err) => {
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
  const [inserted] = await db
    .insert(notifications)
    .values({
      userId,
      type: payload.type,
      title: payload.title,
      content: payload.content,
      relatedType: payload.related_type ?? null,
      relatedId: payload.related_id ?? null,
      sentInApp: true,
    })
    .returning({ id: notifications.id })

  const notificationId = inserted?.id

  // Fetch email + preference
  const userRows = await db
    .select({
      user_id: users.id,
      email: users.email,
      email_notifications: userProfiles.emailNotifications,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))

  if (userRows.length > 0 && notificationId) {
    await trySendEmail([notificationId], userRows, payload.title, payload.content)
  }
}

/**
 * Notify every active staff member.
 */
export async function notifyAllStaff(
  payload: NotificationPayload,
  excludeUserId?: string,
): Promise<void> {
  const conditions = [eq(users.isStaff, true)]
  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId))
  }

  const staff = await db
    .select({
      user_id: users.id,
      email: users.email,
      email_notifications: userProfiles.emailNotifications,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(...conditions))

  if (staff.length === 0) return

  // Bulk insert — one row per staff member
  const values = staff.map((s) => ({
    userId: s.user_id,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    relatedType: payload.related_type ?? null,
    relatedId: payload.related_id ?? null,
    sentInApp: true as const,
  }))

  const insertResult = await db
    .insert(notifications)
    .values(values)
    .returning({ id: notifications.id })

  const ids = insertResult.map(r => r.id)
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
  const usersResult = await db
    .select({
      user_id: users.id,
      email: users.email,
      email_notifications: userProfiles.emailNotifications,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(inArray(users.id, userIds))

  // Build a lookup for email info
  const emailInfoMap = new Map(usersResult.map(r => [r.user_id, r]))

  // Bulk insert notifications
  const values = userIds.map((uid) => ({
    userId: uid,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    relatedType: payload.related_type ?? null,
    relatedId: payload.related_id ?? null,
    sentInApp: true as const,
  }))

  const insertResult = await db
    .insert(notifications)
    .values(values)
    .returning({ id: notifications.id })

  const ids = insertResult.map(r => r.id)
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
