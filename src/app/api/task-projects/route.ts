/**
 * Task Projects API
 *
 * GET /api/task-projects - List all projects
 * POST /api/task-projects - Create a new project
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { taskProjects, tasks, users } from '@/db/schema';
import { eq, sql, and, not } from 'drizzle-orm';
import { createProjectSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';

/**
 * GET /api/task-projects
 * List all projects with task counts
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const conditions = status ? [eq(taskProjects.status, status)] : [];

    const projectRows = await db
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
        task_count: sql<number>`(
          SELECT COUNT(*)::int FROM ${tasks} t
          WHERE t.project_id = ${taskProjects.id} AND NOT t.is_archived
        )`,
        completed_task_count: sql<number>`(
          SELECT COUNT(*)::int FROM ${tasks} t
          WHERE t.project_id = ${taskProjects.id} AND t.is_completed AND NOT t.is_archived
        )`,
      })
      .from(taskProjects)
      .leftJoin(users, eq(taskProjects.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE ${taskProjects.status}
          WHEN 'active' THEN 0
          WHEN 'planning' THEN 1
          WHEN 'on_hold' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
        END`,
        sql`${taskProjects.createdAt} DESC`
      )

    logger.info('Task projects fetched', {
      userId: session.user.id,
      count: projectRows.length
    });

    return apiSuccess(projectRows);
  } catch (error) {
    logger.error('Error fetching projects', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Projekte');
  }
});

/**
 * POST /api/task-projects
 * Create a new project
 */
export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Look up the actual user ID from the database by email
    // (Auth.js session ID may not match the database user ID)
    const [userRow] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))

    if (!userRow) {
      return apiBadRequest('Benutzer nicht gefunden');
    }

    const [project] = await db
      .insert(taskProjects)
      .values({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        targetDate: data.target_date || undefined,
        createdBy: userRow.id,
      })
      .returning()

    logger.info('Project created', {
      projectId: project.id,
      userId: session.user.id,
      title: data.title
    });

    return apiSuccess(project, 201);
  } catch (error) {
    logger.error('Error creating project', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Erstellen des Projekts');
  }
});
