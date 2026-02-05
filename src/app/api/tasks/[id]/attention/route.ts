/**
 * Task Attention Flag API
 *
 * POST /api/tasks/[id]/attention - Flag task as needing attention
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { TASK_STATUSES } from '@/config/tasks';
import { attentionFlagSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';

type RouteParams = { id: string };

/**
 * POST /api/tasks/[id]/attention
 * Flag a task as needing attention
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
    const result = attentionFlagSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Verify task exists
    const taskResult = await query(
      `SELECT id, title, created_by, is_archived FROM ${TABLE_NAMES.TASKS} WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return apiNotFound('Aufgabe');
    }

    const task = taskResult.rows[0] as {
      id: string;
      title: string;
      created_by: string;
      is_archived: boolean
    };

    if (task.is_archived) {
      return apiBadRequest('Archivierte Aufgaben können nicht markiert werden');
    }

    // Create attention flag
    const flagResult = await query(
      `INSERT INTO ${TABLE_NAMES.TASK_ATTENTION_FLAGS} (
        task_id,
        flagged_by,
        message
      ) VALUES ($1, $2, $3)
      RETURNING *`,
      [taskId, session.user.id, data.message || null]
    );

    const flag = flagResult.rows[0];

    // Update task status to needs_attention
    await query(
      `UPDATE ${TABLE_NAMES.TASKS}
       SET current_status = $1, updated_at = NOW()
       WHERE id = $2`,
      [TASK_STATUSES.NEEDS_ATTENTION, taskId]
    );

    // TODO: Send notifications
    // - Notify task creator if different from flagger
    // - Broadcast to all staff members

    logger.info('Task flagged for attention', {
      taskId,
      flagId: flag.id,
      userId: session.user.id,
      taskTitle: task.title
    });

    return apiSuccess(flag, 201);
  } catch (error) {
    logger.error('Error flagging task', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Markieren der Aufgabe');
  }
});
