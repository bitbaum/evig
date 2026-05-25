/**
 * Notification Service
 *
 * Helpers for creating notifications. Fire-and-forget: errors are logged
 * but never propagate to callers — a failed notification must never break
 * the action that triggered it.
 *
 * Each function also sends an email when the user has opted in
 * (email_notifications = true in user_profiles, which is the default).
 *
 * Decision-specific notification types (decision_voting, decision_closed)
 * use rich HTML templates with deep links to the specific decision page.
 * All other types fall back to the generic notification email.
 */

import { db } from '@/db'
import { notifications, users, userProfiles } from '@/db/schema'
import { eq, inArray, and, ne } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { notificationEmail } from '@/lib/email/templates/notification'
import {
  decisionVotingOpened,
  decisionDeadlineReminder,
  decisionClosed,
} from '@/lib/email/templates/decisions'
import type { EmailContent } from '@/lib/email/types'
import { NOTIFICATION_TYPES } from '@/config/notifications'

export interface NotificationPayload {
  type: string
  title: string
  content: string
  related_type?: string
  related_id?: string
  /** Optional structured metadata for type-specific email templates. */
  metadata?: Record<string, string>
}

// ---- helpers ----------------------------------------------------------------

interface UserEmailInfo {
  user_id: string
  email: string
  email_notifications: boolean | null
}

/** Pick the richest email template available for this notification type. */
function getEmailContent(payload: NotificationPayload): EmailContent {
  const { type, title, content, metadata } = payload
  const id = metadata?.decisionId ?? payload.related_id
  const deadline = metadata?.votingDeadline ?? undefined

  if (type === NOTIFICATION_TYPES.DECISION_VOTING) {
    const allowPublicVoting = metadata?.allowPublicVoting === 'true'
    return decisionVotingOpened(title, deadline || undefined, id, allowPublicVoting)
  }
  if (type === NOTIFICATION_TYPES.DECISION_CLOSED) {
    return decisionClosed(title, id)
  }
  if (type === NOTIFICATION_TYPES.DECISION_DEADLINE) {
    return decisionDeadlineReminder(title, deadline ?? '', id)
  }

  return notificationEmail(title, content)
}

/** Send email + mark sent_email, swallowing errors. */
async function trySendEmail(
  notificationIds: string[],
  recipients: UserEmailInfo[],
  payload: NotificationPayload,
): Promise<void> {
  const emailContent = getEmailContent(payload)

  // Default to true when preference is null (new users)
  const eligible = recipients.filter(r => r.email && r.email_notifications !== false)

  // Send in parallel — sequential awaits would block the caller for
  // ~200 ms × N recipients on a fan-out (e.g. all-staff decision
  // notifications can be 50+ users).
  const results = await Promise.allSettled(
    eligible.map(r => sendCustomEmail(r.email!, emailContent))
  )

  // sendCustomEmail RESOLVES with { success: false, error } on SMTP/
  // Listmonk failure rather than throwing — `fulfilled` alone is true
  // even when the email didn't go out. Previously this set anySent=true
  // on resolved-failure too, then marked notifications.sent_email=true
  // for every notificationId — a data-integrity lie that prevented any
  // future retry job from re-sending. Check settled.value.success too.
  // Matches admin/workshops/send-feedback-requests (commit 87f084af) and
  // the repairer/apply admin notifications (d128beff).
  let anySent = false
  for (let i = 0; i < results.length; i++) {
    const settled = results[i]
    if (settled.status === 'fulfilled' && settled.value.success) {
      anySent = true
    } else if (settled.status === 'fulfilled') {
      logger.warn('Notification email failed (resolved)', {
        userId: eligible[i].user_id,
        error: settled.value.error,
      })
    } else {
      logger.error('Notification email failed (rejected)', {
        userId: eligible[i].user_id,
        error: settled.reason,
      })
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
    await trySendEmail([notificationId], userRows, payload)
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
  await trySendEmail(ids, staff, payload)
}

/**
 * Notify a list of specific users (e.g. eligible voters, protocol attendees).
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

  await trySendEmail(ids, recipients, payload)
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
