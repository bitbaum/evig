/**
 * API: Weekly Digest
 *
 * GET /api/admin/team/digest - Get weekly activity summary
 *
 * Provides aggregated statistics for management:
 * - Task completions per user
 * - Activity updates count and breakdown
 * - Help requests created/resolved
 * - Top contributors
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import { validateDigestFilter } from '@/lib/schemas/activity'

interface UserStats {
  user_id: string
  user_name: string | null
  user_email: string
  department: string | null
  task_completions: number
  activity_updates: number
  help_requests_created: number
  help_requests_resolved: number
  total_score: number
}

interface CategoryStats {
  category: string
  count: number
}

interface DigestSummary {
  period: {
    since: string
    until: string
  }
  totals: {
    task_completions: number
    activity_updates: number
    help_requests_created: number
    help_requests_resolved: number
    active_users: number
  }
  by_user: UserStats[]
  by_category: CategoryStats[]
  top_contributors: UserStats[]
  recent_milestones: {
    id: string
    user_name: string | null
    title: string
    occurred_at: string
  }[]
}

/**
 * GET /api/admin/team/digest
 * Get weekly activity digest for management
 */
export const GET = withAdmin('team', async (request, session) => {
  try {
    // Parse filters from query params
    const { searchParams } = new URL(request.url)

    // Default to last 7 days
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const filterResult = validateDigestFilter({
      since: searchParams.get('since') || weekAgo.toISOString(),
      until: searchParams.get('until') || now.toISOString(),
      department: searchParams.get('department') || undefined,
    })

    if (!filterResult.success) {
      return apiBadRequest('Ungültige Filterparameter')
    }

    const filters = filterResult.data
    const since = filters.since || weekAgo.toISOString()
    const until = filters.until || now.toISOString()

    // Build parameterized department condition
    const hasDepartmentFilter = !!filters.department
    const departmentCondition = hasDepartmentFilter ? 'AND tp.department = $3' : ''
    const baseParams = [since, until]
    const paramsWithDepartment = hasDepartmentFilter
      ? [...baseParams, filters.department]
      : baseParams

    // Get task completions per user
    const taskCompletionsResult = await query<{
      user_id: string
      user_name: string | null
      user_email: string
      department: string | null
      count: string
    }>(
      `SELECT
        tc.completed_by as user_id,
        u.name as user_name,
        u.email as user_email,
        tp.department,
        COUNT(*) as count
       FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
       JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON tc.completed_by = tp.user_id
       WHERE tc.completed_at >= $1 AND tc.completed_at <= $2
       ${departmentCondition}
       GROUP BY tc.completed_by, u.name, u.email, tp.department
       ORDER BY count DESC`,
      paramsWithDepartment
    )

    // Get activity updates per user
    const activityUpdatesResult = await query<{
      user_id: string
      user_name: string | null
      user_email: string
      department: string | null
      count: string
    }>(
      `SELECT
        au.user_id,
        u.name as user_name,
        u.email as user_email,
        tp.department,
        COUNT(*) as count
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON au.user_id = tp.user_id
       WHERE au.occurred_at >= $1 AND au.occurred_at <= $2
       ${departmentCondition}
       GROUP BY au.user_id, u.name, u.email, tp.department
       ORDER BY count DESC`,
      paramsWithDepartment
    )

    // Get help requests created per user
    const helpCreatedResult = await query<{
      user_id: string
      user_name: string | null
      user_email: string
      department: string | null
      count: string
    }>(
      `SELECT
        hr.requester_id as user_id,
        u.name as user_name,
        u.email as user_email,
        tp.department,
        COUNT(*) as count
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       JOIN ${TABLE_NAMES.USERS} u ON hr.requester_id = u.id
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON hr.requester_id = tp.user_id
       WHERE hr.created_at >= $1 AND hr.created_at <= $2
       ${departmentCondition}
       GROUP BY hr.requester_id, u.name, u.email, tp.department
       ORDER BY count DESC`,
      paramsWithDepartment
    )

    // Get help requests resolved per user
    const helpResolvedResult = await query<{
      user_id: string
      user_name: string | null
      user_email: string
      department: string | null
      count: string
    }>(
      `SELECT
        hr.resolved_by as user_id,
        u.name as user_name,
        u.email as user_email,
        tp.department,
        COUNT(*) as count
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       JOIN ${TABLE_NAMES.USERS} u ON hr.resolved_by = u.id
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON hr.resolved_by = tp.user_id
       WHERE hr.resolved_at >= $1 AND hr.resolved_at <= $2
       AND hr.resolved_by IS NOT NULL
       ${departmentCondition}
       GROUP BY hr.resolved_by, u.name, u.email, tp.department
       ORDER BY count DESC`,
      paramsWithDepartment
    )

    // Get task completions by category
    const categoryStatsResult = await query<{ category: string; count: string }>(
      `SELECT
        t.category,
        COUNT(*) as count
       FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
       JOIN ${TABLE_NAMES.TASKS} t ON tc.task_id = t.id
       WHERE tc.completed_at >= $1 AND tc.completed_at <= $2
       GROUP BY t.category
       ORDER BY count DESC`,
      [since, until]
    )

    // Get recent milestones
    const milestonesResult = await query<{
      id: string
      user_name: string | null
      title: string
      occurred_at: string
    }>(
      `SELECT
        au.id,
        u.name as user_name,
        au.title,
        au.occurred_at
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
       WHERE au.update_type = 'milestone'
       AND au.occurred_at >= $1 AND au.occurred_at <= $2
       ORDER BY au.occurred_at DESC
       LIMIT 10`,
      [since, until]
    )

    // Aggregate user stats
    const userStatsMap = new Map<string, UserStats>()

    // Factory function to create empty UserStats
    const createEmptyUserStats = (row: {
      user_id: string
      user_name: string | null
      user_email: string
      department: string | null
    }): UserStats => ({
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      department: row.department,
      task_completions: 0,
      activity_updates: 0,
      help_requests_created: 0,
      help_requests_resolved: 0,
      total_score: 0,
    })

    for (const row of taskCompletionsResult.rows) {
      const stats = userStatsMap.get(row.user_id) || createEmptyUserStats(row)
      stats.task_completions = parseInt(row.count, 10)
      userStatsMap.set(row.user_id, stats)
    }

    for (const row of activityUpdatesResult.rows) {
      const stats = userStatsMap.get(row.user_id) || createEmptyUserStats(row)
      stats.activity_updates = parseInt(row.count, 10)
      userStatsMap.set(row.user_id, stats)
    }

    for (const row of helpCreatedResult.rows) {
      const stats = userStatsMap.get(row.user_id) || createEmptyUserStats(row)
      stats.help_requests_created = parseInt(row.count, 10)
      userStatsMap.set(row.user_id, stats)
    }

    for (const row of helpResolvedResult.rows) {
      const stats = userStatsMap.get(row.user_id) || createEmptyUserStats(row)
      stats.help_requests_resolved = parseInt(row.count, 10)
      userStatsMap.set(row.user_id, stats)
    }

    // Calculate total score for each user (weighted)
    const userStats = Array.from(userStatsMap.values()).map((stats) => ({
      ...stats,
      total_score:
        stats.task_completions * 2 +
        stats.activity_updates * 1 +
        stats.help_requests_created * 1 +
        stats.help_requests_resolved * 3,
    }))

    // Sort by total score for top contributors
    const topContributors = [...userStats]
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 10)

    // Calculate totals
    const totals = {
      task_completions: userStats.reduce((sum, u) => sum + u.task_completions, 0),
      activity_updates: userStats.reduce((sum, u) => sum + u.activity_updates, 0),
      help_requests_created: userStats.reduce((sum, u) => sum + u.help_requests_created, 0),
      help_requests_resolved: userStats.reduce((sum, u) => sum + u.help_requests_resolved, 0),
      active_users: userStats.length,
    }

    const digest: DigestSummary = {
      period: {
        since,
        until,
      },
      totals,
      by_user: userStats.sort((a, b) => b.task_completions - a.task_completions),
      by_category: categoryStatsResult.rows.map((row) => ({
        category: row.category,
        count: parseInt(row.count, 10),
      })),
      top_contributors: topContributors,
      recent_milestones: milestonesResult.rows,
    }

    return apiSuccess(digest)
  } catch (error) {
    return apiError(error, 'Wochenübersicht konnte nicht geladen werden')
  }
})
