/**
 * Task Project Detail API
 *
 * GET /api/task-projects/[id] - Get single project with tasks
 * PATCH /api/task-projects/[id] - Update project
 * DELETE /api/task-projects/[id] - Delete project
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { taskProjects, tasks, taskCompletions, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { updateProjectSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';

type RouteParams = { id: string };

/**
 * GET /api/task-projects/[id]
 * Get single project with its tasks
 */
export const GET = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const projectId = context?.params?.id;

    if (!projectId) {
      return apiBadRequest('Project ID erforderlich');
    }

    // Get project with creator info
    const [project] = await db
      .select({
        id: taskProjects.id,
        title: taskProjects.title,
        description: taskProjects.description,
        status: taskProjects.status,
        target_date: taskProjects.targetDate,
        created_by: taskProjects.createdBy,
        created_at: taskProjects.createdAt,
        updated_at: taskProjects.updatedAt,
        created_by_name: users.name,
        created_by_email: users.email,
      })
      .from(taskProjects)
      .leftJoin(users, eq(taskProjects.createdBy, users.id))
      .where(eq(taskProjects.id, projectId))

    if (!project) {
      return apiNotFound('Projekt');
    }

    // Get tasks in this project
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
        current_status: tasks.currentStatus,
        is_completed: tasks.isCompleted,
        completed_at: tasks.completedAt,
        completed_by: tasks.completedBy,
        project_id: tasks.projectId,
        created_by: tasks.createdBy,
        is_archived: tasks.isArchived,
        created_at: tasks.createdAt,
        updated_at: tasks.updatedAt,
        completion_count: sql<number>`(
          SELECT COUNT(*)::int FROM ${taskCompletions} tc
          WHERE tc.task_id = ${tasks.id}
        )`,
      })
      .from(tasks)
      .where(sql`${tasks.projectId} = ${projectId} AND NOT ${tasks.isArchived}`)
      .orderBy(
        sql`CASE ${tasks.priority}
          WHEN 'urgent' THEN 0
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END`,
        sql`${tasks.createdAt} DESC`
      )

    logger.info('Project detail fetched', {
      projectId,
      userId: session.user.id
    });

    return apiSuccess({
      project,
      tasks: taskRows,
    });
  } catch (error) {
    logger.error('Error fetching project', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden des Projekts');
  }
});

/**
 * PATCH /api/task-projects/[id]
 * Update project
 */
export const PATCH = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const projectId = context?.params?.id;

    if (!projectId) {
      return apiBadRequest('Project ID erforderlich');
    }

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Check if project exists
    const [existing] = await db
      .select({ id: taskProjects.id })
      .from(taskProjects)
      .where(eq(taskProjects.id, projectId))

    if (!existing) {
      return apiNotFound('Projekt');
    }

    // Build dynamic update set
    const updateSet: Record<string, unknown> = {};
    if ('title' in data) updateSet.title = data.title;
    if ('description' in data) updateSet.description = data.description ?? null;
    if ('status' in data) updateSet.status = data.status;
    if ('target_date' in data) updateSet.targetDate = data.target_date ?? null;

    if (Object.keys(updateSet).length === 0) {
      return apiBadRequest('Keine Felder zum Aktualisieren');
    }

    updateSet.updatedAt = sql`NOW()`;

    const [updated] = await db
      .update(taskProjects)
      .set(updateSet)
      .where(eq(taskProjects.id, projectId))
      .returning()

    logger.info('Project updated', {
      projectId,
      userId: session.user.id,
      updatedFields: Object.keys(data)
    });

    return apiSuccess(updated);
  } catch (error) {
    logger.error('Error updating project', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Aktualisieren des Projekts');
  }
});

/**
 * DELETE /api/task-projects/[id]
 * Delete project (tasks will have project_id set to null via ON DELETE SET NULL)
 */
export const DELETE = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const projectId = context?.params?.id;

    if (!projectId) {
      return apiBadRequest('Project ID erforderlich');
    }

    const [result] = await db
      .delete(taskProjects)
      .where(eq(taskProjects.id, projectId))
      .returning({ id: taskProjects.id })

    if (!result) {
      return apiNotFound('Projekt');
    }

    logger.info('Project deleted', {
      projectId,
      userId: session.user.id
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    logger.error('Error deleting project', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Löschen des Projekts');
  }
});
