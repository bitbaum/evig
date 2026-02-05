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
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { createTaskSchema } from '@/lib/schemas/tasks';
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

    // Build query with filters
    let queryText = `
      SELECT
        t.*,
        u.name as created_by_name,
        u.email as created_by_email,
        (
          SELECT COUNT(*)::int
          FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
          WHERE tc.task_id = t.id
        ) as completion_count,
        (
          SELECT json_agg(json_build_object(
            'id', tc.id,
            'completed_by', tc.completed_by,
            'completed_at', tc.completed_at,
            'notes', tc.notes,
            'duration_minutes', tc.duration_minutes
          ) ORDER BY tc.completed_at DESC)
          FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
          WHERE tc.task_id = t.id
          LIMIT 5
        ) as recent_completions
      FROM ${TABLE_NAMES.TASKS} t
      LEFT JOIN ${TABLE_NAMES.USERS} u ON t.created_by = u.id
      WHERE 1=1
    `;

    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    if (!includeArchived) {
      queryText += ` AND t.is_archived = false`;
    }

    if (category) {
      queryText += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }

    if (status) {
      queryText += ` AND t.current_status = $${paramIndex++}`;
      params.push(status);
    }

    if (taskType) {
      queryText += ` AND t.task_type = $${paramIndex++}`;
      params.push(taskType);
    }

    if (projectId) {
      queryText += ` AND t.project_id = $${paramIndex++}`;
      params.push(projectId);
    }

    queryText += ` ORDER BY
      CASE t.priority
        WHEN 'urgent' THEN 0
        WHEN 'high' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'low' THEN 3
      END,
      t.created_at DESC
    `;

    const result = await query(queryText, params);

    logger.info('Tasks fetched', {
      userId: session.user.id,
      count: result.rows.length,
      filters: { category, status, taskType, projectId }
    });

    return apiSuccess(result.rows);
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

    const insertResult = await query(
      `INSERT INTO ${TABLE_NAMES.TASKS} (
        title,
        description,
        instructions,
        task_type,
        schedule_cron,
        schedule_human,
        category,
        tags,
        priority,
        estimated_minutes,
        project_id,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.title,
        data.description || null,
        data.instructions || null,
        data.task_type,
        data.schedule_cron || null,
        data.schedule_human || null,
        data.category,
        data.tags || [],
        data.priority,
        data.estimated_minutes || null,
        data.project_id || null,
        dbUserId,
      ]
    );

    const task = insertResult.rows[0] as { id: string; title: string };

    logger.info('Task created', {
      taskId: task.id,
      userId: dbUserId,
      title: data.title
    });

    return apiSuccess(task, 201);
  } catch (error) {
    logger.error('Error creating task', { error, email: session.user.email });
    return apiError(error, 'Fehler beim Erstellen der Aufgabe');
  }
});
