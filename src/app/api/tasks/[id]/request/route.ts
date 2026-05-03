/**
 * Task Request API
 *
 * POST /api/tasks/[id]/request - Request someone to do a task
 *
 * If requested_user_id is provided, sends to specific user.
 * If requested_user_id is null/omitted, broadcasts to ALL team members.
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { getDbUserId, getActiveTask } from '@/lib/api/task-helpers';
import { notifyAllStaff, notifyUsers } from '@/lib/services/notifications';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { tasks, taskRequests } from '@/db/schema/misc';
import { users } from '@/db/schema/auth';
import { TASK_STATUSES, REQUEST_STATUSES } from '@/config/tasks';
import { taskRequestSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';
import { RELATED_TYPES } from '@/config/notifications'

type RouteParams = { id: string };

/**
 * POST /api/tasks/[id]/request
 * Create a task request (to specific user or broadcast)
 */
export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const taskId = context?.params?.id;

    if (!taskId) {
      return apiBadRequest('Task ID erforderlich');
    }

    // Parse and validate body
    const body = await request.json().catch(() => ({}));
    const result = taskRequestSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.VALIDATION_FAILED, result.error.flatten().fieldErrors);
    }

    const data = result.data;
    const isBroadcast = !data.requested_user_id;

    const taskLookup = await getActiveTask(taskId);
    if ('error' in taskLookup) return taskLookup.error;
    const { task } = taskLookup;

    const userLookup = await getDbUserId(session);
    if ('error' in userLookup) return userLookup.error;
    const { dbUserId } = userLookup;

    // If specific user requested, verify they exist
    if (data.requested_user_id) {
      const userResult = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.requested_user_id));

      if (userResult.length === 0) {
        return apiNotFound('Angefragter Benutzer');
      }
    }

    // Create request record + update task status atomically
    const taskRequest = await db.transaction(async (tx) => {
      const [requestRow] = await tx.insert(taskRequests).values({
        taskId,
        requestedBy: dbUserId,
        requestedUserId: data.requested_user_id || null,
        message: data.message || null,
        status: REQUEST_STATUSES.PENDING,
      }).returning();

      await tx.update(tasks)
        .set({ currentStatus: TASK_STATUSES.REQUESTED, updatedAt: new Date().toISOString() })
        .where(eq(tasks.id, taskId));

      return requestRow;
    });

    // Notifications (in-app + email, respecting user preferences)
    const notificationPayload = {
      type: 'task_request',
      title: `Aufgabenanfrage: ${task.title}`,
      content: data.message?.trim() || 'Eine Aufgabe wurde zur Bearbeitung angefragt.',
      related_type: RELATED_TYPES.TASK,
      related_id: taskId,
    }

    if (data.requested_user_id) {
      if (data.requested_user_id !== dbUserId) {
        await notifyUsers([data.requested_user_id], notificationPayload)
      }
    } else {
      await notifyAllStaff(notificationPayload, dbUserId)
    }

    logger.info('Task request created', {
      taskId,
      requestId: taskRequest.id,
      userId: session.user.id,
      isBroadcast,
      requestedUserId: data.requested_user_id || null,
      taskTitle: task.title
    });

    return apiSuccess(taskRequest, 201);
  } catch (error) {
    logger.error('Error creating task request', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Erstellen der Anfrage');
  }
});
