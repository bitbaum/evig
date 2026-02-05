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
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
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

    let queryText = `
      SELECT
        p.*,
        u.name as created_by_name,
        u.email as created_by_email,
        (
          SELECT COUNT(*)::int
          FROM ${TABLE_NAMES.TASKS} t
          WHERE t.project_id = p.id AND NOT t.is_archived
        ) as task_count,
        (
          SELECT COUNT(*)::int
          FROM ${TABLE_NAMES.TASKS} t
          WHERE t.project_id = p.id AND t.is_completed AND NOT t.is_archived
        ) as completed_task_count
      FROM ${TABLE_NAMES.TASK_PROJECTS} p
      LEFT JOIN ${TABLE_NAMES.USERS} u ON p.created_by = u.id
      WHERE 1=1
    `;

    const params: string[] = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    queryText += ` ORDER BY
      CASE p.status
        WHEN 'active' THEN 0
        WHEN 'planning' THEN 1
        WHEN 'on_hold' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'cancelled' THEN 4
      END,
      p.created_at DESC
    `;

    const result = await query(queryText, params);

    logger.info('Task projects fetched', {
      userId: session.user.id,
      count: result.rows.length
    });

    return apiSuccess(result.rows);
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

    const insertResult = await query(
      `INSERT INTO ${TABLE_NAMES.TASK_PROJECTS} (
        title,
        description,
        status,
        target_date,
        created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.title,
        data.description || null,
        data.status,
        data.target_date || null,
        session.user.id,
      ]
    );

    const project = insertResult.rows[0];

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
