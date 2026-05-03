/**
 * Task Completion API
 *
 * POST /api/tasks/[id]/complete - Mark task as complete (self-report)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { getDbUserId, getActiveTask } from '@/lib/api/task-helpers';
import { db } from '@/db';
import { taskCompletions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { taskCompletionSchema } from '@/lib/schemas/tasks';
import { notifyUsers } from '@/lib/services/notifications';
import { RELATED_TYPES } from '@/config/notifications'
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
      return apiBadRequest(ERROR_MESSAGES.VALIDATION_FAILED, result.error.flatten().fieldErrors);
    }

    const data = result.data;

    const taskLookup = await getActiveTask(taskId);
    if ('error' in taskLookup) return taskLookup.error;
    const { task } = taskLookup;

    const userLookup = await getDbUserId(session);
    if ('error' in userLookup) return userLookup.error;
    const { dbUserId } = userLookup;

    // Create completion record
    // The database trigger will handle:
    // - Resetting task status to idle
    // - Marking one-time tasks as completed
    // - Resolving attention flags
    // - Completing pending requests
    const [completion] = await db
      .insert(taskCompletions)
      .values({
        taskId,
        completedBy: dbUserId,
        completedAt: sql`NOW()`,
        notes: data.notes || undefined,
        durationMinutes: data.duration_minutes || undefined,
      })
      .returning()

    // Notify task creator that it was completed
    if (task.created_by && task.created_by !== dbUserId) {
      await notifyUsers([task.created_by], {
        type: 'task_completed',
        title: `Aufgabe erledigt: ${task.title}`,
        content: `${session.user.name || session.user.email} hat die Aufgabe erledigt.${data.notes ? ` Notiz: ${data.notes}` : ''}`,
        related_type: RELATED_TYPES.TASK,
        related_id: taskId,
      })
    }

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
