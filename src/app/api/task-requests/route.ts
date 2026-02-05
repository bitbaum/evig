/**
 * Task Requests API
 *
 * GET /api/task-requests - Get pending task requests for current user
 *
 * Returns both direct requests AND broadcasts (where requested_user_id is null)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';

/**
 * GET /api/task-requests
 * Get all pending task requests for the current user
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const includeBroadcasts = searchParams.get('include_broadcasts') !== 'false';

    // Build query for requests
    // Include direct requests (requested_user_id = current user)
    // AND broadcasts (requested_user_id is null) if includeBroadcasts is true
    let queryText = `
      SELECT
        r.*,
        rb.name as requested_by_name,
        rb.email as requested_by_email,
        t.id as task_id,
        t.title as task_title,
        t.description as task_description,
        t.category as task_category,
        t.priority as task_priority,
        t.current_status as task_status,
        t.estimated_minutes as task_estimated_minutes
      FROM ${TABLE_NAMES.TASK_REQUESTS} r
      LEFT JOIN ${TABLE_NAMES.USERS} rb ON r.requested_by = rb.id
      LEFT JOIN ${TABLE_NAMES.TASKS} t ON r.task_id = t.id
      WHERE r.requested_by != $1
    `;

    const params: (string | null)[] = [session.user.id];
    let paramIndex = 2;

    // Filter by status
    if (status !== 'all') {
      queryText += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    // Filter to show requests for this user OR broadcasts
    if (includeBroadcasts) {
      queryText += ` AND (r.requested_user_id = $${paramIndex++} OR r.requested_user_id IS NULL)`;
      params.push(session.user.id);
    } else {
      queryText += ` AND r.requested_user_id = $${paramIndex++}`;
      params.push(session.user.id);
    }

    queryText += ` ORDER BY r.created_at DESC`;

    const result = await query(queryText, params);

    logger.info('Task requests fetched', {
      userId: session.user.id,
      count: result.rows.length,
      status,
      includeBroadcasts
    });

    return apiSuccess(result.rows);
  } catch (error) {
    logger.error('Error fetching task requests', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Anfragen');
  }
});
