/**
 * Task Detail API
 *
 * GET /api/tasks/[id] - Get single task with completions
 * PATCH /api/tasks/[id] - Update task
 * DELETE /api/tasks/[id] - Archive task (soft delete)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { db } from '@/db';
import { tasks, taskCompletions, taskAttentionFlags, taskRequests, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { REQUEST_STATUSES } from '@/config/tasks';
import { updateTaskSchema } from '@/lib/schemas/tasks';
import { notifyUsers } from '@/lib/services/notifications';
import { RELATED_TYPES } from '@/config/notifications'
import { logger } from '@/lib/logger';

const requestedByUser = alias(users, 'requested_by_user');
const requestedUser = alias(users, 'requested_user');
const assignedUser = alias(users, 'assigned_user');

type RouteParams = { id: string };

/**
 * GET /api/tasks/[id]
 * Get single task with completion history
 */
export const GET = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const taskId = context?.params?.id;

    if (!taskId) {
      return apiBadRequest('Task ID erforderlich');
    }

    // Fetch task, completions, flags, and requests in parallel
    const [taskRows, completionRows, flagRows, requestRows] = await Promise.all([
      // Get task with creator info
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          instructions: tasks.instructions,
          task_type: tasks.taskType,
          schedule_cron: tasks.scheduleCron,
          schedule_human: tasks.scheduleHuman,
          category: tasks.category,
          tags: tasks.tags,
          priority: tasks.priority,
          estimated_minutes: tasks.estimatedMinutes,
          due_date: tasks.dueDate,
          current_status: tasks.currentStatus,
          is_completed: tasks.isCompleted,
          completed_at: tasks.completedAt,
          completed_by: tasks.completedBy,
          project_id: tasks.projectId,
          assigned_to: tasks.assignedTo,
          created_by: tasks.createdBy,
          is_archived: tasks.isArchived,
          created_at: tasks.createdAt,
          updated_at: tasks.updatedAt,
          created_by_name: users.name,
          created_by_email: users.email,
          assigned_to_name: assignedUser.name,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.createdBy, users.id))
        .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
        .where(eq(tasks.id, taskId)),

      // Get completion history
      db
        .select({
          id: taskCompletions.id,
          task_id: taskCompletions.taskId,
          completed_by: taskCompletions.completedBy,
          completed_at: taskCompletions.completedAt,
          notes: taskCompletions.notes,
          duration_minutes: taskCompletions.durationMinutes,
          created_at: taskCompletions.createdAt,
          completed_by_name: users.name,
          completed_by_email: users.email,
        })
        .from(taskCompletions)
        .leftJoin(users, eq(taskCompletions.completedBy, users.id))
        .where(eq(taskCompletions.taskId, taskId))
        .orderBy(desc(taskCompletions.completedAt))
        .limit(50),

      // Get active attention flags
      db
        .select({
          id: taskAttentionFlags.id,
          task_id: taskAttentionFlags.taskId,
          flagged_by: taskAttentionFlags.flaggedBy,
          message: taskAttentionFlags.message,
          is_resolved: taskAttentionFlags.isResolved,
          resolved_by: taskAttentionFlags.resolvedBy,
          resolved_at: taskAttentionFlags.resolvedAt,
          resolved_by_completion_id: taskAttentionFlags.resolvedByCompletionId,
          created_at: taskAttentionFlags.createdAt,
          flagged_by_name: users.name,
          flagged_by_email: users.email,
        })
        .from(taskAttentionFlags)
        .leftJoin(users, eq(taskAttentionFlags.flaggedBy, users.id))
        .where(and(
          eq(taskAttentionFlags.taskId, taskId),
          eq(taskAttentionFlags.isResolved, false)
        ))
        .orderBy(desc(taskAttentionFlags.createdAt)),

      // Get pending requests
      db
        .select({
          id: taskRequests.id,
          task_id: taskRequests.taskId,
          requested_by: taskRequests.requestedBy,
          requested_user_id: taskRequests.requestedUserId,
          is_broadcast: taskRequests.isBroadcast,
          message: taskRequests.message,
          status: taskRequests.status,
          response_message: taskRequests.responseMessage,
          completion_id: taskRequests.completionId,
          created_at: taskRequests.createdAt,
          updated_at: taskRequests.updatedAt,
          requested_by_name: requestedByUser.name,
          requested_user_name: requestedUser.name,
        })
        .from(taskRequests)
        .leftJoin(requestedByUser, eq(taskRequests.requestedBy, requestedByUser.id))
        .leftJoin(requestedUser, eq(taskRequests.requestedUserId, requestedUser.id))
        .where(and(
          eq(taskRequests.taskId, taskId),
          eq(taskRequests.status, REQUEST_STATUSES.PENDING)
        ))
        .orderBy(desc(taskRequests.createdAt)),
    ])

    if (taskRows.length === 0) {
      return apiNotFound('Aufgabe');
    }

    logger.info('Task detail fetched', {
      taskId,
      userId: session.user.id
    });

    return apiSuccess({
      task: taskRows[0],
      completions: completionRows,
      attention_flags: flagRows,
      pending_requests: requestRows,
    });
  } catch (error) {
    logger.error('Error fetching task', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Aufgabe');
  }
});

/**
 * PATCH /api/tasks/[id]
 * Update task
 */
export const PATCH = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const taskId = context?.params?.id;

    if (!taskId) {
      return apiBadRequest('Task ID erforderlich');
    }

    const body = await request.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.VALIDATION_FAILED, result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Check if task exists (and get current assignee for notification logic)
    const [existing] = await db
      .select({ id: tasks.id, title: tasks.title, assignedTo: tasks.assignedTo })
      .from(tasks)
      .where(eq(tasks.id, taskId))

    if (!existing) {
      return apiNotFound('Aufgabe');
    }

    // Build dynamic update set
    const updateSet: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      instructions: 'instructions',
      task_type: 'taskType',
      schedule_cron: 'scheduleCron',
      schedule_human: 'scheduleHuman',
      category: 'category',
      tags: 'tags',
      priority: 'priority',
      estimated_minutes: 'estimatedMinutes',
      due_date: 'dueDate',
      project_id: 'projectId',
      assigned_to: 'assignedTo',
      current_status: 'currentStatus',
      is_archived: 'isArchived',
    };

    for (const [snakeField, camelField] of Object.entries(fieldMap)) {
      if (snakeField in data) {
        updateSet[camelField] = (data as Record<string, unknown>)[snakeField] ?? null;
      }
    }

    if (Object.keys(updateSet).length === 0) {
      return apiBadRequest('Keine Felder zum Aktualisieren');
    }

    updateSet.updatedAt = sql`NOW()`;

    const [updated] = await db
      .update(tasks)
      .set(updateSet)
      .where(eq(tasks.id, taskId))
      .returning()

    logger.info('Task updated', {
      taskId,
      userId: session.user.id,
      updatedFields: Object.keys(data)
    });

    // Notify new assignee if assigned_to changed to a different user
    const newAssignee = (data as Record<string, unknown>).assigned_to as string | null | undefined;
    if (newAssignee && newAssignee !== existing.assignedTo) {
      notifyUsers([newAssignee], {
        type: 'task_assigned',
        title: 'Aufgabe zugewiesen',
        content: `Dir wurde eine Aufgabe zugewiesen: ${existing.title}`,
        related_type: RELATED_TYPES.TASK,
        related_id: taskId,
      }).catch(err => logger.error('Failed to notify task assignee', { error: err, taskId }));
    }

    return apiSuccess(updated);
  } catch (error) {
    logger.error('Error updating task', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Aktualisieren der Aufgabe');
  }
});

/**
 * DELETE /api/tasks/[id]
 * Archive task (soft delete)
 */
export const DELETE = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const taskId = context?.params?.id;

    if (!taskId) {
      return apiBadRequest('Task ID erforderlich');
    }

    const [result] = await db
      .update(tasks)
      .set({ isArchived: true, updatedAt: sql`NOW()` })
      .where(eq(tasks.id, taskId))
      .returning({ id: tasks.id })

    if (!result) {
      return apiNotFound('Aufgabe');
    }

    logger.info('Task archived', {
      taskId,
      userId: session.user.id
    });

    return apiSuccess({ archived: true });
  } catch (error) {
    logger.error('Error archiving task', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Archivieren der Aufgabe');
  }
});
