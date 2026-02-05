/**
 * Task Completion API
 *
 * POST /api/tasks/[id]/complete - Mark task as complete (self-report)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { taskCompletionSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';

type RouteParams = { id: string };

/**
 * POST /api/tasks/[id]/complete
 * Mark task as complete with optional notes
 * The database trigger handles status reset and request completion
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
    const result = taskCompletionSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Verify task exists and is not archived
    const taskResult = await query(
      `SELECT id, title, is_archived FROM ${TABLE_NAMES.TASKS} WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return apiNotFound('Aufgabe');
    }

    const task = taskResult.rows[0] as { id: string; title: string; is_archived: boolean };

    if (task.is_archived) {
      return apiBadRequest('Archivierte Aufgaben können nicht erledigt werden');
    }

    // Look up the actual user ID from the database by email
    // (Auth.js session ID may not match the database user ID)
    const userResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return apiBadRequest('Benutzer nicht gefunden');
    }

    const dbUserId = userResult.rows[0].id;

    // Create completion record
    // The database trigger will handle:
    // - Resetting task status to idle
    // - Marking one-time tasks as completed
    // - Resolving attention flags
    // - Completing pending requests
    const completionResult = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.TASK_COMPLETIONS} (
        task_id,
        completed_by,
        completed_at,
        notes,
        duration_minutes
      ) VALUES ($1, $2, NOW(), $3, $4)
      RETURNING *`,
      [
        taskId,
        dbUserId,
        data.notes || null,
        data.duration_minutes || null,
      ]
    );

    const completion = completionResult.rows[0];

    logger.info('Task completed', {
      taskId,
      completionId: completion.id,
      userId: session.user.id,
      taskTitle: task.title
    });

    return apiSuccess(completion, 201);
  } catch (error) {
    logger.error('Error completing task', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Erledigen der Aufgabe');
  }
});
