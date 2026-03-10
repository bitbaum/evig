/**
 * Task Analytics API
 *
 * GET /api/task-analytics - Get task analytics and statistics
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { tasks, taskCompletions, taskRequests, taskAttentionFlags, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { TASK_STATUSES, REQUEST_STATUSES } from '@/config/tasks';
import { logger } from '@/lib/logger';

const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

/**
 * GET /api/task-analytics
 * Get task statistics and analytics
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const parsed = analyticsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues.map(i => i.message).join(', '));
    }
    const { days } = parsed.data;

    // Run all queries in parallel
    const [
      [statsRow],
      [completionsRow],
      [todayRow],
      [weekRow],
      byCategoryRows,
      contributionRows,
      [pendingRow],
      [flagsRow],
    ] = await Promise.all([
      // Overall stats
      db
        .select({
          total_active: sql<string>`COUNT(*) FILTER (WHERE NOT ${tasks.isArchived})`,
          needs_attention: sql<string>`COUNT(*) FILTER (WHERE ${tasks.currentStatus} = ${TASK_STATUSES.NEEDS_ATTENTION} AND NOT ${tasks.isArchived})`,
          requested: sql<string>`COUNT(*) FILTER (WHERE ${tasks.currentStatus} = ${TASK_STATUSES.REQUESTED} AND NOT ${tasks.isArchived})`,
          in_progress: sql<string>`COUNT(*) FILTER (WHERE ${tasks.currentStatus} = ${TASK_STATUSES.IN_PROGRESS} AND NOT ${tasks.isArchived})`,
          completed_one_time: sql<string>`COUNT(*) FILTER (WHERE ${tasks.isCompleted} AND NOT ${tasks.isArchived})`,
        })
        .from(tasks),

      // Completions in timeframe
      db
        .select({
          total_completions: sql<string>`COUNT(*)`,
          unique_completers: sql<string>`COUNT(DISTINCT ${taskCompletions.completedBy})`,
          avg_duration: sql<string>`COALESCE(AVG(${taskCompletions.durationMinutes}), 0)::int`,
        })
        .from(taskCompletions)
        .where(sql`${taskCompletions.completedAt} > NOW() - INTERVAL '1 day' * ${days}`),

      // Completions today
      db
        .select({ completed_today: sql<string>`COUNT(*)` })
        .from(taskCompletions)
        .where(sql`DATE(${taskCompletions.completedAt}) = CURRENT_DATE`),

      // Completions this week
      db
        .select({ completed_this_week: sql<string>`COUNT(*)` })
        .from(taskCompletions)
        .where(sql`${taskCompletions.completedAt} > NOW() - INTERVAL '7 days'`),

      // By category
      db
        .select({
          category: tasks.category,
          task_count: sql<string>`COUNT(*) FILTER (WHERE NOT ${tasks.isArchived})`,
          completion_count: sql<string>`COUNT(${taskCompletions.id})`,
        })
        .from(tasks)
        .leftJoin(taskCompletions, sql`${taskCompletions.taskId} = ${tasks.id} AND ${taskCompletions.completedAt} > NOW() - INTERVAL '1 day' * ${days}`)
        .groupBy(tasks.category)
        .orderBy(sql`COUNT(${taskCompletions.id}) DESC`),

      // Contributions per person (fairness metric)
      db
        .select({
          user_id: users.id,
          user_name: users.name,
          user_email: users.email,
          completion_count: sql<string>`COUNT(${taskCompletions.id})`,
          unique_tasks_completed: sql<string>`COUNT(DISTINCT ${taskCompletions.taskId})`,
        })
        .from(users)
        .leftJoin(taskCompletions, sql`${taskCompletions.completedBy} = ${users.id} AND ${taskCompletions.completedAt} > NOW() - INTERVAL '1 day' * ${days}`)
        .where(sql`${users.isStaff} = true OR EXISTS (
          SELECT 1 FROM ${taskCompletions} tc2
          WHERE tc2.completed_by = ${users.id}
        )`)
        .groupBy(users.id, users.name, users.email)
        .having(sql`COUNT(${taskCompletions.id}) > 0 OR ${users.isStaff} = true`)
        .orderBy(sql`COUNT(${taskCompletions.id}) DESC`),

      // Pending requests count
      db
        .select({ pending_requests: sql<string>`COUNT(*)` })
        .from(taskRequests)
        .where(eq(taskRequests.status, REQUEST_STATUSES.PENDING)),

      // Active attention flags
      db
        .select({ active_flags: sql<string>`COUNT(*)` })
        .from(taskAttentionFlags)
        .where(eq(taskAttentionFlags.isResolved, false)),
    ]);

    logger.info('Task analytics fetched', {
      userId: session.user.id,
      days
    });

    const stats = statsRow || { total_active: '0', needs_attention: '0', requested: '0', in_progress: '0', completed_one_time: '0' };
    const completions = completionsRow || { total_completions: '0', unique_completers: '0', avg_duration: '0' };

    return apiSuccess({
      overview: {
        total_active: parseInt(stats.total_active || '0', 10),
        needs_attention: parseInt(stats.needs_attention || '0', 10),
        requested: parseInt(stats.requested || '0', 10),
        in_progress: parseInt(stats.in_progress || '0', 10),
        completed_one_time: parseInt(stats.completed_one_time || '0', 10),
        total_completions: parseInt(completions.total_completions || '0', 10),
        unique_completers: parseInt(completions.unique_completers || '0', 10),
        avg_duration: parseInt(completions.avg_duration || '0', 10),
        completed_today: parseInt(todayRow?.completed_today || '0', 10),
        completed_this_week: parseInt(weekRow?.completed_this_week || '0', 10),
        pending_requests: parseInt(pendingRow?.pending_requests || '0', 10),
        active_attention_flags: parseInt(flagsRow?.active_flags || '0', 10),
      },
      by_category: byCategoryRows,
      contributions: contributionRows,
      timeframe_days: days,
    });
  } catch (error) {
    logger.error('Error fetching task analytics', { error, userId: session.user.id });
    return apiError(error, 'Fehler beim Laden der Statistiken');
  }
});
