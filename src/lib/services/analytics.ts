import 'server-only'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logger } from '@/lib/logger'

/**
 * Analytics service — extracted from src/app/admin/analytics/page.tsx
 *
 * The page used to embed ~145 lines of SQL in three async helpers next
 * to the JSX. Moving it here keeps the page focused on layout and lets
 * dashboards / digests reuse the same counts without copy-paste. Each
 * function is fault-tolerant: tables that don't exist yet (e.g. a
 * brand-new tenant deploy) return a zero, not a 500.
 *
 * SoC rule: this file talks to the DB. Pages talk to this file.
 */

export interface AnalyticsStats {
  totalUsers: number
  usersThisMonth: number
  totalWorkshops: number
  totalTechnicians: number
  totalSellers: number
  pendingApprovals: number
}

export interface MonthlyGrowth {
  month: string
  count: number
}

export interface ActivitySummary {
  taskCompletionsThisWeek: number
  taskCompletionsThisMonth: number
  contentSubmissionsThisMonth: number
  activeTasksCount: number
}

/** Single COUNT(*) wrapped to return 0 if the table does not exist. */
async function safeCount(sql: string, params?: unknown[]): Promise<number> {
  try {
    const result = await query<{ count: string }>(sql, params)
    return parseInt(result.rows[0]?.count || '0')
  } catch (error) {
    logger.warn('safeCount failed (table may not exist)', { error, sql: sql.slice(0, 120) })
    return 0
  }
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const [
    totalUsers,
    usersThisMonth,
    totalWorkshops,
    totalTechnicians,
    totalSellers,
    pendingApprovals,
  ] = await Promise.all([
    safeCount(`SELECT COUNT(*) AS count FROM ${TABLE_NAMES.USERS}`),
    safeCount(
      `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.USERS}
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
    ),
    safeCount(`SELECT COUNT(*) AS count FROM ${TABLE_NAMES.WORKSHOPS}`),
    safeCount(
      `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}
       WHERE is_active = true AND profile_tier = $1`,
      [REPAIRER_PROFILE_TIER.COMMUNITY],
    ),
    safeCount(
      `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.SELLER_PROFILES} WHERE is_active = true`,
    ),
    safeCount(
      `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} WHERE status = $1`,
      [APPROVAL_STATUS.PENDING],
    ),
  ])

  return {
    totalUsers,
    usersThisMonth,
    totalWorkshops,
    totalTechnicians,
    totalSellers,
    pendingApprovals,
  }
}

export async function getUserGrowth(): Promise<MonthlyGrowth[]> {
  try {
    const result = await query<{ month: string; count: string }>(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
         COUNT(*)::int AS count
       FROM ${TABLE_NAMES.USERS}
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC`,
    )
    return result.rows.map(r => ({ month: r.month, count: parseInt(r.count || '0') }))
  } catch (error) {
    logger.error('Error fetching user growth', { error })
    return []
  }
}

export async function getActivitySummary(): Promise<ActivitySummary> {
  // Two pairs of queries — one for tasks (week/month/active) and one
  // for content submissions. Either table might not exist on a
  // fresh tenant, so each tier is independently fault-tolerant.
  let taskCompletionsThisWeek = 0
  let taskCompletionsThisMonth = 0
  let activeTasksCount = 0
  try {
    const tcResult = await query<{ week: string; month: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days')::int AS week,
         COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('month', CURRENT_DATE))::int AS month
       FROM ${TABLE_NAMES.TASK_COMPLETIONS}`,
    )
    taskCompletionsThisWeek = parseInt(tcResult.rows[0]?.week || '0')
    taskCompletionsThisMonth = parseInt(tcResult.rows[0]?.month || '0')
    activeTasksCount = await safeCount(
      `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.TASKS} WHERE NOT is_archived`,
    )
  } catch (error) {
    logger.warn('Activity tasks query failed', { error })
  }

  const contentSubmissionsThisMonth = await safeCount(
    `SELECT COUNT(*) AS count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
     WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
  )

  return {
    taskCompletionsThisWeek,
    taskCompletionsThisMonth,
    contentSubmissionsThisMonth,
    activeTasksCount,
  }
}
