/**
 * Shared Task API Helpers
 *
 * DRY: Extracted from duplicated code across task API routes.
 * - getDbUserId: Resolves Auth.js session email → database user ID
 * - getActiveTask: Verifies task exists and is not archived
 * - getErrorMessage: Extracts error message from unknown error
 *
 * Created: 2026-02-09
 */

import { NextResponse } from 'next/server';
import { ValidSession } from '@/lib/api/middleware';
import { apiBadRequest, apiNotFound } from '@/lib/api/helpers';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { tasks } from '@/db/schema/misc';
import { notifications } from '@/db/schema/messaging';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Resolve the database user ID from the Auth.js session email.
 * Auth.js session ID may not match the database user ID.
 *
 * @returns The database user ID, or an error response
 */
export async function getDbUserId(
  session: ValidSession
): Promise<{ dbUserId: string } | { error: NextResponse }> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) {
    return { error: apiBadRequest('Benutzer nicht gefunden') };
  }

  return { dbUserId: user.id };
}

/**
 * Verify a task exists and is not archived.
 *
 * @returns The active task row, or an error response
 */
export async function getActiveTask(
  taskId: string
): Promise<{ task: { id: string; title: string; created_by: string; is_archived: boolean } } | { error: NextResponse }> {
  const [taskRow] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      created_by: tasks.createdBy,
      is_archived: tasks.isArchived,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId));

  if (!taskRow) {
    return { error: apiNotFound('Aufgabe') };
  }

  if (taskRow.is_archived) {
    return { error: apiBadRequest('Archivierte Aufgaben können nicht bearbeitet werden') };
  }

  return { task: { ...taskRow, is_archived: taskRow.is_archived ?? false } };
}

interface InAppNotificationInput {
  recipientIds: string[]
  title: string
  content: string
  relatedType?: string
  relatedId?: string
}

/**
 * Create in-app notifications for one or more users.
 * Non-critical side effect: failures are logged and should not break the caller flow.
 */
export async function createInAppNotifications({
  recipientIds,
  title,
  content,
  relatedType,
  relatedId,
}: InAppNotificationInput): Promise<void> {
  const uniqueRecipientIds = Array.from(new Set(recipientIds.filter(Boolean)))

  if (uniqueRecipientIds.length === 0) {
    return
  }

  try {
    // Find valid user IDs from the provided list
    const validUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, uniqueRecipientIds))

    if (validUsers.length === 0) return

    await db.insert(notifications).values(
      validUsers.map((u) => ({
        userId: u.id,
        type: 'system' as const,
        title,
        content,
        relatedType: relatedType || null,
        relatedId: relatedId || null,
        sentInApp: true,
      }))
    )
  } catch (error) {
    logger.warn('Failed to create in-app notifications', {
      error,
      recipientCount: uniqueRecipientIds.length,
      relatedType,
      relatedId,
    })
  }
}

// Re-export client-safe utility for convenience in server code
export { getErrorMessage } from '@/lib/utils/error';
