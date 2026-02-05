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
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
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
    const projectResult = await query(
      `SELECT
        p.*,
        u.name as created_by_name,
        u.email as created_by_email
      FROM ${TABLE_NAMES.TASK_PROJECTS} p
      LEFT JOIN ${TABLE_NAMES.USERS} u ON p.created_by = u.id
      WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return apiNotFound('Projekt');
    }

    const project = projectResult.rows[0];

    // Get tasks in this project
    const tasksResult = await query(
      `SELECT
        t.*,
        (
          SELECT COUNT(*)::int
          FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
          WHERE tc.task_id = t.id
        ) as completion_count
      FROM ${TABLE_NAMES.TASKS} t
      WHERE t.project_id = $1 AND NOT t.is_archived
      ORDER BY
        CASE t.priority
          WHEN 'urgent' THEN 0
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        t.created_at DESC`,
      [projectId]
    );

    logger.info('Project detail fetched', {
      projectId,
      userId: session.user.id
    });

    return apiSuccess({
      project,
      tasks: tasksResult.rows,
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
    const existingResult = await query(
      `SELECT id FROM ${TABLE_NAMES.TASK_PROJECTS} WHERE id = $1`,
      [projectId]
    );

    if (existingResult.rows.length === 0) {
      return apiNotFound('Projekt');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = ['title', 'description', 'status', 'target_date'];

    for (const field of fields) {
      if (field in data) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push((data as Record<string, unknown>)[field] ?? null);
      }
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Felder zum Aktualisieren');
    }

    updates.push(`updated_at = NOW()`);
    params.push(projectId);

    const updateResult = await query(
      `UPDATE ${TABLE_NAMES.TASK_PROJECTS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    logger.info('Project updated', {
      projectId,
      userId: session.user.id,
      updatedFields: Object.keys(data)
    });

    return apiSuccess(updateResult.rows[0]);
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

    const result = await query(
      `DELETE FROM ${TABLE_NAMES.TASK_PROJECTS}
       WHERE id = $1
       RETURNING id`,
      [projectId]
    );

    if (result.rows.length === 0) {
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
