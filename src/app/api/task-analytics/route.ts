/**
 * Task Analytics API
 *
 * GET /api/task-analytics - Get task analytics and statistics
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
 * GET /api/task-analytics
 * Get task statistics and analytics
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Overall stats
    const statsResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE NOT is_archived) as total_active,
        COUNT(*) FILTER (WHERE current_status = 'needs_attention' AND NOT is_archived) as needs_attention,
        COUNT(*) FILTER (WHERE current_status = 'requested' AND NOT is_archived) as requested,
        COUNT(*) FILTER (WHERE current_status = 'in_progress' AND NOT is_archived) as in_progress,
        COUNT(*) FILTER (WHERE is_completed AND NOT is_archived) as completed_one_time
      FROM ${TABLE_NAMES.TASKS}
    `);

    // Completions in timeframe
    const completionsResult = await query(`
      SELECT
        COUNT(*) as total_completions,
        COUNT(DISTINCT completed_by) as unique_completers,
        COALESCE(AVG(duration_minutes), 0)::int as avg_duration
      FROM ${TABLE_NAMES.TASK_COMPLETIONS}
      WHERE completed_at > NOW() - INTERVAL '1 day' * $1
    `, [days]);

    // Completions today
    const todayResult = await query(`
      SELECT COUNT(*) as completed_today
      FROM ${TABLE_NAMES.TASK_COMPLETIONS}
      WHERE DATE(completed_at) = CURRENT_DATE
    `);

    // Completions this week
    const weekResult = await query(`
      SELECT COUNT(*) as completed_this_week
      FROM ${TABLE_NAMES.TASK_COMPLETIONS}
      WHERE completed_at > NOW() - INTERVAL '7 days'
    `);

    // By category
    const byCategoryResult = await query(`
      SELECT
        t.category,
        COUNT(*) FILTER (WHERE NOT t.is_archived) as task_count,
        COUNT(tc.id) as completion_count
      FROM ${TABLE_NAMES.TASKS} t
      LEFT JOIN ${TABLE_NAMES.TASK_COMPLETIONS} tc ON tc.task_id = t.id
        AND tc.completed_at > NOW() - INTERVAL '1 day' * $1
      GROUP BY t.category
      ORDER BY completion_count DESC
    `, [days]);

    // Contributions per person (fairness metric)
    const contributionsResult = await query(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(tc.id) as completion_count,
        COUNT(DISTINCT tc.task_id) as unique_tasks_completed
      FROM ${TABLE_NAMES.USERS} u
      LEFT JOIN ${TABLE_NAMES.TASK_COMPLETIONS} tc ON tc.completed_by = u.id
        AND tc.completed_at > NOW() - INTERVAL '1 day' * $1
      WHERE u.is_staff = true OR EXISTS (
        SELECT 1 FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc2
        WHERE tc2.completed_by = u.id
      )
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(tc.id) > 0 OR u.is_staff = true
      ORDER BY completion_count DESC
    `, [days]);

    // Pending requests count
    const pendingRequestsResult = await query(`
      SELECT COUNT(*) as pending_requests
      FROM ${TABLE_NAMES.TASK_REQUESTS}
      WHERE status = 'pending'
    `);

    // Active attention flags
    const attentionFlagsResult = await query(`
      SELECT COUNT(*) as active_flags
      FROM ${TABLE_NAMES.TASK_ATTENTION_FLAGS}
      WHERE is_resolved = false
    `);

    logger.info('Task analytics fetched', {
      userId: session.user.id,
      days
    });

    const stats = statsResult.rows[0] as Record<string, unknown> || {};
    const completions = completionsResult.rows[0] as Record<string, unknown> || {};

    return apiSuccess({
      overview: {
        ...stats,
        ...completions,
        completed_today: parseInt(todayResult.rows[0]?.completed_today || '0', 10),
        completed_this_week: parseInt(weekResult.rows[0]?.completed_this_week || '0', 10),
        pending_requests: parseInt(pendingRequestsResult.rows[0]?.pending_requests || '0', 10),
        active_attention_flags: parseInt(attentionFlagsResult.rows[0]?.active_flags || '0', 10),
      },
      by_category: byCategoryResult.rows,
      contributions: contributionsResult.rows,
      timeframe_days: days,
    });
  } catch (error) {
    logger.error('Error fetching task analytics', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Statistiken');
  }
});
