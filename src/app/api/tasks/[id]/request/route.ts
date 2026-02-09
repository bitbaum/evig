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
import { getDbUserId, getActiveTask } from '@/lib/api/task-helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { TASK_STATUSES } from '@/config/tasks';
import { taskRequestSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';

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
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
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
      const userResult = await query(
        `SELECT id FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
        [data.requested_user_id]
      );

      if (userResult.rows.length === 0) {
        return apiNotFound('Angefragter Benutzer');
      }
    }

    // Create request record
    const requestResult = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.TASK_REQUESTS} (
        task_id,
        requested_by,
        requested_user_id,
        message,
        status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *`,
      [
        taskId,
        dbUserId,
        data.requested_user_id || null,
        data.message || null,
      ]
    );

    const taskRequest = requestResult.rows[0];

    // Update task status to requested
    await query(
      `UPDATE ${TABLE_NAMES.TASKS}
       SET current_status = $1, updated_at = NOW()
       WHERE id = $2`,
      [TASK_STATUSES.REQUESTED, taskId]
    );

    // TODO: Send notifications
    // - If specific user: notify that user
    // - If broadcast: notify all staff except requester

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
