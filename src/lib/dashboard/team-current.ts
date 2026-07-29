import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

export interface TeamMemberRow {
  profile_id: string
  user_id: string
  user_name: string | null
  display_name: string | null
  avatar_url: string | null
  current_focus: string | null
  current_focus_updated_at: string | null
  active_task_count: number
  top_task_title: string | null
}

const WIDGET_LIMIT = 6

export async function getTeamCurrent(excludeUserId: string): Promise<TeamMemberRow[]> {
  try {
    const { rows } = await query<TeamMemberRow>(
      `SELECT
         tp.id AS profile_id,
         tp.user_id,
         u.name AS user_name,
         up.display_name,
         up.avatar_url,
         tp.current_focus,
         tp.current_focus_updated_at,
         COALESCE(t.cnt, 0)::int AS active_task_count,
         t.top_task_title
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON up.user_id = tp.user_id
       LEFT JOIN (
         SELECT
           assigned_to,
           COUNT(*) AS cnt,
           (array_agg(title ORDER BY
              CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
              due_date ASC NULLS LAST))[1] AS top_task_title
         FROM ${TABLE_NAMES.TASKS}
         WHERE assigned_to IS NOT NULL
           AND is_completed = false
           AND is_archived = false
           AND current_status <> 'idle'
         GROUP BY assigned_to
       ) t ON t.assigned_to = tp.user_id
       WHERE tp.is_active = true
         AND tp.work_state = 'active'
         AND tp.user_id <> $1
         AND (tp.current_focus IS NOT NULL OR t.cnt > 0)
       ORDER BY COALESCE(t.cnt, 0) DESC, u.name ASC NULLS LAST
       LIMIT ${WIDGET_LIMIT}`,
      [excludeUserId]
    )
    return rows
  } catch (error) {
    logger.error('TeamCurrentWidget: query failed', { error })
    return []
  }
}
