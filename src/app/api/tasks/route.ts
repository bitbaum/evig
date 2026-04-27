/**
 * Tasks API
 *
 * GET /api/tasks - List tasks with filters
 * POST /api/tasks - Create a new task
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { getDbUserId } from '@/lib/api/task-helpers';
import { db } from '@/db';
import { tasks, taskCompletions, users } from '@/db/schema';
import { eq, and, sql, desc, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TASK_PRIORITIES } from '@/config/tasks';

const assignedUser = alias(users, 'assigned_user');
import { createTaskSchema } from '@/lib/schemas/tasks';
import { notifyUsers } from '@/lib/services/notifications';
import { RELATED_TYPES } from '@/config/notifications'
import { logger } from '@/lib/logger';

/**
 * GET /api/tasks
 * List tasks with optional filters
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const taskType = searchParams.get('type');
    const projectId = searchParams.get('project_id');
    const includeArchived = searchParams.get('include_archived') === 'true';

    // Build conditions
    const conditions: SQL[] = [];
    if (!includeArchived) conditions.push(eq(tasks.isArchived, false));
    if (category) conditions.push(eq(tasks.category, category));
    if (status) conditions.push(eq(tasks.currentStatus, status));
    if (taskType) conditions.push(eq(tasks.taskType, taskType));
    if (projectId) conditions.push(eq(tasks.projectId, projectId));

    const taskRows = await db
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
        created_by: tasks.createdBy,
        is_archived: tasks.isArchived,
        created_at: tasks.createdAt,
        updated_at: tasks.updatedAt,
        assigned_to: tasks.assignedTo,
        created_by_name: users.name,
        created_by_email: users.email,
        assigned_to_name: assignedUser.name,
        completion_count: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${taskCompletions} tc
          WHERE tc.task_id = ${tasks.id}
        )`,
        recent_completions: sql`(
          SELECT json_agg(json_build_object(
            'id', tc.id,
            'completed_by', tc.completed_by,
            'completed_at', tc.completed_at,
            'notes', tc.notes,
            'duration_minutes', tc.duration_minutes
          ) ORDER BY tc.completed_at DESC)
          FROM ${taskCompletions} tc
          WHERE tc.task_id = ${tasks.id}
          LIMIT 5
        )`,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE ${tasks.priority}
          WHEN '${sql.raw(TASK_PRIORITIES.URGENT)}' THEN 0
          WHEN '${sql.raw(TASK_PRIORITIES.HIGH)}' THEN 1
          WHEN '${sql.raw(TASK_PRIORITIES.NORMAL)}' THEN 2
          WHEN '${sql.raw(TASK_PRIORITIES.LOW)}' THEN 3
        END`,
        desc(tasks.createdAt)
      )

    logger.info('Tasks fetched', {
      userId: session.user.id,
      count: taskRows.length,
      filters: { category, status, taskType, projectId }
    });

    return apiSuccess(taskRows);
  } catch (error) {
    logger.error('Error fetching tasks', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Aufgaben');
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    const userLookup = await getDbUserId(session);
    if ('error' in userLookup) return userLookup.error;
    const { dbUserId } = userLookup;

    const [task] = await db
      .insert(tasks)
      .values({
        title: data.title,
        description: data.description || undefined,
        instructions: data.instructions || undefined,
        taskType: data.task_type,
        scheduleCron: data.schedule_cron || undefined,
        scheduleHuman: data.schedule_human || undefined,
        category: data.category,
        tags: data.tags || [],
        priority: data.priority,
        estimatedMinutes: data.estimated_minutes || undefined,
        dueDate: data.due_date || undefined,
        projectId: data.project_id || undefined,
        assignedTo: data.assigned_to || undefined,
        createdBy: dbUserId,
      })
      .returning()

    logger.info('Task created', {
      taskId: task.id,
      userId: dbUserId,
      title: data.title
    });

    // Notify assignee if assigned
    if (data.assigned_to) {
      notifyUsers([data.assigned_to], {
        type: 'task_assigned',
        title: 'Aufgabe zugewiesen',
        content: `Dir wurde eine Aufgabe zugewiesen: ${data.title}`,
        related_type: RELATED_TYPES.TASK,
        related_id: task.id,
      }).catch(err => logger.error('Failed to notify task assignee', { error: err, taskId: task.id }));
    }

    return apiSuccess(task, 201);
  } catch (error) {
    logger.error('Error creating task', { error, email: session.user.email });
    return apiError(error, 'Fehler beim Erstellen der Aufgabe');
  }
});
