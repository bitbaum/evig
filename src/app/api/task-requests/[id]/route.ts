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
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
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

    // Get the request
    const requestResult = await query(
      `SELECT r.*, t.title as task_title
       FROM ${TABLE_NAMES.TASK_REQUESTS} r
       LEFT JOIN ${TABLE_NAMES.TASKS} t ON r.task_id = t.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return apiNotFound('Anfrage');
    }

    const taskRequest = requestResult.rows[0] as {
      id: string;
      task_id: string;
      task_title: string;
      status: string;
      requested_user_id: string | null;
      requested_by: string;
    };

    // Check if request is still pending
    if (taskRequest.status !== REQUEST_STATUSES.PENDING) {
      return apiBadRequest('Diese Anfrage wurde bereits beantwortet');
    }

    // Check if user can respond (either they're the target or it's a broadcast)
    const isTargetUser = taskRequest.requested_user_id === session.user.id;
    const isBroadcast = taskRequest.requested_user_id === null;
    const isRequester = taskRequest.requested_by === session.user.id;

    if (!isTargetUser && !isBroadcast) {
      return apiBadRequest('Sie können nur auf Anfragen antworten, die an Sie gerichtet sind');
    }

    if (isRequester) {
      return apiBadRequest('Sie können nicht auf Ihre eigenen Anfragen antworten');
    }

    // Update request status
    const updateResult = await query(
      `UPDATE ${TABLE_NAMES.TASK_REQUESTS}
       SET status = $1, response_message = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [data.status, data.response_message || null, requestId]
    );

    const updatedRequest = updateResult.rows[0];

    // If accepted, update task status to in_progress
    if (data.status === REQUEST_STATUSES.ACCEPTED) {
      await query(
        `UPDATE ${TABLE_NAMES.TASKS}
         SET current_status = $1, updated_at = NOW()
         WHERE id = $2`,
        [TASK_STATUSES.IN_PROGRESS, taskRequest.task_id]
      );

      // If this was a broadcast, cancel other pending requests for the same task
      if (isBroadcast) {
        await query(
          `UPDATE ${TABLE_NAMES.TASK_REQUESTS}
           SET status = 'declined', response_message = 'Anfrage von anderem Teammitglied angenommen', updated_at = NOW()
           WHERE task_id = $1 AND id != $2 AND status = 'pending'`,
          [taskRequest.task_id, requestId]
        );
      }
    }

    // Notify the person who created the request
    const accepted = data.status === REQUEST_STATUSES.ACCEPTED;
    const responderName = session.user.name || 'Ein Teammitglied';

    fireNotification(
      () => createNotification(taskRequest.requested_by, {
        type: NOTIFICATION_TYPES.TASK_REQUEST_RESPONSE,
        title: accepted
          ? `Aufgabenanfrage angenommen: ${taskRequest.task_title}`
          : `Aufgabenanfrage abgelehnt: ${taskRequest.task_title}`,
        content: data.response_message
          || (accepted
            ? `${responderName} hat deine Anfrage angenommen.`
            : `${responderName} hat deine Anfrage abgelehnt.`),
        related_type: 'task',
        related_id: taskRequest.task_id,
      }),
      'task-request-response',
    );

    logger.info('Task request responded', {
      requestId,
      taskId: taskRequest.task_id,
      userId: session.user.id,
      status: data.status,
      taskTitle: taskRequest.task_title
    });

    return apiSuccess(updatedRequest);
  } catch (error) {
    logger.error('Error responding to task request', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Beantworten der Anfrage');
  }
});
