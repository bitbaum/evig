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
import { db } from '@/db';
import { taskRequests, tasks, users } from '@/db/schema';
import { eq, and, ne, isNull, or, desc, sql, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { logger } from '@/lib/logger';

const requestedByUser = alias(users, 'requested_by_user');

/**
 * GET /api/task-requests
 * Get all pending task requests for the current user
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const includeBroadcasts = searchParams.get('include_broadcasts') !== 'false';

    // Build conditions
    const conditions: SQL[] = [
      ne(taskRequests.requestedBy, session.user.id),
    ];

    if (status !== 'all') {
      conditions.push(eq(taskRequests.status, status));
    }

    // Filter to show requests for this user OR broadcasts
    if (includeBroadcasts) {
      conditions.push(or(
        eq(taskRequests.requestedUserId, session.user.id),
        isNull(taskRequests.requestedUserId)
      )!);
    } else {
      conditions.push(eq(taskRequests.requestedUserId, session.user.id));
    }

    const rows = await db
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
        requested_by_email: requestedByUser.email,
        task_title: tasks.title,
        task_description: tasks.description,
        task_category: tasks.category,
        task_priority: tasks.priority,
        task_status: tasks.currentStatus,
        task_estimated_minutes: tasks.estimatedMinutes,
      })
      .from(taskRequests)
      .leftJoin(requestedByUser, eq(taskRequests.requestedBy, requestedByUser.id))
      .leftJoin(tasks, eq(taskRequests.taskId, tasks.id))
      .where(and(...conditions))
      .orderBy(desc(taskRequests.createdAt))

    logger.info('Task requests fetched', {
      userId: session.user.id,
      count: rows.length,
      status,
      includeBroadcasts
    });

    return apiSuccess(rows);
  } catch (error) {
    logger.error('Error fetching task requests', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Anfragen');
  }
});
