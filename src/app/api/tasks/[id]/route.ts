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
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { updateTaskSchema } from '@/lib/schemas/tasks';
import { logger } from '@/lib/logger';

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

    // Get task with creator info
    const taskResult = await query(
      `SELECT
        t.*,
        u.name as created_by_name,
        u.email as created_by_email
      FROM ${TABLE_NAMES.TASKS} t
      LEFT JOIN ${TABLE_NAMES.USERS} u ON t.created_by = u.id
      WHERE t.id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return apiNotFound('Aufgabe');
    }

    const task = taskResult.rows[0];

    // Get completion history
    const completionsResult = await query(
      `SELECT
        tc.*,
        u.name as completed_by_name,
        u.email as completed_by_email
      FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
      LEFT JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.completed_at DESC
      LIMIT 50`,
      [taskId]
    );

    // Get active attention flags
    const flagsResult = await query(
      `SELECT
        f.*,
        u.name as flagged_by_name,
        u.email as flagged_by_email
      FROM ${TABLE_NAMES.TASK_ATTENTION_FLAGS} f
      LEFT JOIN ${TABLE_NAMES.USERS} u ON f.flagged_by = u.id
      WHERE f.task_id = $1 AND f.is_resolved = false
      ORDER BY f.created_at DESC`,
      [taskId]
    );

    // Get pending requests
    const requestsResult = await query(
      `SELECT
        r.*,
        rb.name as requested_by_name,
        ru.name as requested_user_name
      FROM ${TABLE_NAMES.TASK_REQUESTS} r
      LEFT JOIN ${TABLE_NAMES.USERS} rb ON r.requested_by = rb.id
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON r.requested_user_id = ru.id
      WHERE r.task_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC`,
      [taskId]
    );

    logger.info('Task detail fetched', {
      taskId,
      userId: session.user.id
    });

    return apiSuccess({
      task,
      completions: completionsResult.rows,
      attention_flags: flagsResult.rows,
      pending_requests: requestsResult.rows,
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
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors);
    }

    const data = result.data;

    // Check if task exists
    const existingResult = await query(
      `SELECT id FROM ${TABLE_NAMES.TASKS} WHERE id = $1`,
      [taskId]
    );

    if (existingResult.rows.length === 0) {
      return apiNotFound('Aufgabe');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fields = [
      'title', 'description', 'instructions', 'task_type',
      'schedule_cron', 'schedule_human', 'category', 'tags',
      'priority', 'estimated_minutes', 'project_id',
      'current_status', 'is_archived'
    ];

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
    params.push(taskId);

    const updateResult = await query(
      `UPDATE ${TABLE_NAMES.TASKS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    logger.info('Task updated', {
      taskId,
      userId: session.user.id,
      updatedFields: Object.keys(data)
    });

    return apiSuccess(updateResult.rows[0]);
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

    const result = await query(
      `UPDATE ${TABLE_NAMES.TASKS}
       SET is_archived = true, updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [taskId]
    );

    if (result.rows.length === 0) {
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
