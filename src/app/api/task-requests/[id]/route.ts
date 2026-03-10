/**
 * Task Request Response API
 *
 * PATCH /api/task-requests/[id] - Respond to a task request (accept/decline)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { taskRequests, tasks, users } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { TASK_STATUSES, REQUEST_STATUSES } from '@/config/tasks';
import { NOTIFICATION_TYPES } from '@/config/notifications';
import { requestResponseSchema } from '@/lib/schemas/tasks';
import { createNotification, fireNotification } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';

type RouteParams = { id: string };

/**
 * PATCH /api/task-requests/[id]
 * Respond to a task request (accept or decline)
 */
export const PATCH = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const requestId = context?.params?.id;

    if (!requestId) {
      return apiBadRequest('Request ID erforderlich');
    }

    // Parse and validate body
    const body = await request.json();
    const result = requestResponseSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Get the request with task title
    const [taskRequest] = await db
      .select({
        id: taskRequests.id,
        taskId: taskRequests.taskId,
        taskTitle: tasks.title,
        status: taskRequests.status,
        requestedUserId: taskRequests.requestedUserId,
        requestedBy: taskRequests.requestedBy,
      })
      .from(taskRequests)
      .leftJoin(tasks, eq(taskRequests.taskId, tasks.id))
      .where(eq(taskRequests.id, requestId))

    if (!taskRequest) {
      return apiNotFound('Anfrage');
    }

    // Check if request is still pending
    if (taskRequest.status !== REQUEST_STATUSES.PENDING) {
      return apiBadRequest('Diese Anfrage wurde bereits beantwortet');
    }

    // Check if user can respond (either they're the target or it's a broadcast)
    const isTargetUser = taskRequest.requestedUserId === session.user.id;
    const isBroadcast = taskRequest.requestedUserId === null;
    const isRequester = taskRequest.requestedBy === session.user.id;

    if (!isTargetUser && !isBroadcast) {
      return apiBadRequest('Sie können nur auf Anfragen antworten, die an Sie gerichtet sind');
    }

    if (isRequester) {
      return apiBadRequest('Sie können nicht auf Ihre eigenen Anfragen antworten');
    }

    // Update request status
    const [updatedRequest] = await db
      .update(taskRequests)
      .set({
        status: data.status,
        responseMessage: data.response_message || null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(taskRequests.id, requestId))
      .returning()

    // If accepted, update task status to in_progress
    if (data.status === REQUEST_STATUSES.ACCEPTED) {
      await db
        .update(tasks)
        .set({
          currentStatus: TASK_STATUSES.IN_PROGRESS,
          updatedAt: sql`NOW()`,
        })
        .where(eq(tasks.id, taskRequest.taskId))

      // If this was a broadcast, cancel other pending requests for the same task
      if (isBroadcast) {
        await db
          .update(taskRequests)
          .set({
            status: REQUEST_STATUSES.DECLINED,
            responseMessage: 'Anfrage von anderem Teammitglied angenommen',
            updatedAt: sql`NOW()`,
          })
          .where(and(
            eq(taskRequests.taskId, taskRequest.taskId),
            ne(taskRequests.id, requestId),
            eq(taskRequests.status, REQUEST_STATUSES.PENDING)
          ))
      }
    }

    // Notify the person who created the request
    const accepted = data.status === REQUEST_STATUSES.ACCEPTED;
    const responderName = session.user.name || 'Ein Teammitglied';

    fireNotification(
      () => createNotification(taskRequest.requestedBy, {
        type: NOTIFICATION_TYPES.TASK_REQUEST_RESPONSE,
        title: accepted
          ? `Aufgabenanfrage angenommen: ${taskRequest.taskTitle}`
          : `Aufgabenanfrage abgelehnt: ${taskRequest.taskTitle}`,
        content: data.response_message
          || (accepted
            ? `${responderName} hat deine Anfrage angenommen.`
            : `${responderName} hat deine Anfrage abgelehnt.`),
        related_type: 'task',
        related_id: taskRequest.taskId,
      }),
      'task-request-response',
    );

    logger.info('Task request responded', {
      requestId,
      taskId: taskRequest.taskId,
      userId: session.user.id,
      status: data.status,
      taskTitle: taskRequest.taskTitle
    });

    return apiSuccess(updatedRequest);
  } catch (error) {
    logger.error('Error responding to task request', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Beantworten der Anfrage');
  }
});
