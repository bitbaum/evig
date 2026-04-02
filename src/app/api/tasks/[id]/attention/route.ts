/**
 * Task Attention Flag API
 *
 * POST /api/tasks/[id]/attention - Flag task as needing attention
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { getDbUserId, getActiveTask } from '@/lib/api/task-helpers';
import { notifyAllStaff } from '@/lib/services/notifications';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { tasks, taskAttentionFlags } from '@/db/schema/misc';
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

    const taskLookup = await getActiveTask(taskId);
    if ('error' in taskLookup) return taskLookup.error;
    const { task } = taskLookup;

    const userLookup = await getDbUserId(session);
    if ('error' in userLookup) return userLookup.error;
    const { dbUserId } = userLookup;

    // Create attention flag + update task status atomically
    const flag = await db.transaction(async (tx) => {
      const [flagRow] = await tx.insert(taskAttentionFlags).values({
        taskId,
        flaggedBy: dbUserId,
        message: data.message || null,
      }).returning();

      await tx.update(tasks)
        .set({ currentStatus: TASK_STATUSES.NEEDS_ATTENTION, updatedAt: new Date().toISOString() })
        .where(eq(tasks.id, taskId));

      return flagRow;
    });

    await notifyAllStaff({
      type: 'task_attention',
      title: `Aufgabe braucht Aufmerksamkeit: ${task.title}`,
      content: data.message?.trim() || 'Eine Aufgabe wurde als aufmerksamkeitsbedürftig markiert.',
      related_type: 'task',
      related_id: taskId,
    }, dbUserId)

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
