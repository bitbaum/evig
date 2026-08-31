/**
 * Task Detail — data-fetching layer for the admin task detail page.
 *
 * Raw-SQL getters extracted from `src/app/admin/tasks/[id]/page.tsx` (SoC).
 * Created: 2026-02-05 (moved to lib: 2026-07-29)
 */

import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import type {
  TaskDetail,
  TaskCompletion,
  TaskAttentionFlag,
  TaskRequestRecord,
} from '@/lib/schemas/tasks';

export async function getTask(id: string): Promise<TaskDetail | null> {
  try {
    const result = await query<TaskDetail>(
      `SELECT
        t.*,
        u.name as created_by_name,
        u.email as created_by_email,
        au.name as assigned_to_name
      FROM ${TABLE_NAMES.TASKS} t
      LEFT JOIN ${TABLE_NAMES.USERS} u ON t.created_by = u.id
      LEFT JOIN ${TABLE_NAMES.USERS} au ON t.assigned_to = au.id
      WHERE t.id = $1`,
      [id],
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching task', { error, taskId: id });
    return null;
  }
}

export async function getCompletions(taskId: string): Promise<TaskCompletion[]> {
  try {
    const result = await query<TaskCompletion>(
      `SELECT
        tc.*,
        u.name as completed_by_name,
        u.email as completed_by_email
      FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
      LEFT JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.completed_at DESC
      LIMIT 50`,
      [taskId],
    );
    return result.rows;
  } catch (error) {
    logger.error('Error fetching completions', { error, taskId });
    return [];
  }
}

export async function getAttentionFlags(taskId: string): Promise<TaskAttentionFlag[]> {
  try {
    const result = await query<TaskAttentionFlag>(
      `SELECT
        f.*,
        u.name as flagged_by_name
      FROM ${TABLE_NAMES.TASK_ATTENTION_FLAGS} f
      LEFT JOIN ${TABLE_NAMES.USERS} u ON f.flagged_by = u.id
      WHERE f.task_id = $1
      ORDER BY f.created_at DESC`,
      [taskId],
    );
    return result.rows;
  } catch (error) {
    logger.error('Error fetching attention flags', { error, taskId });
    return [];
  }
}

export async function getRequests(taskId: string): Promise<TaskRequestRecord[]> {
  try {
    const result = await query<TaskRequestRecord>(
      `SELECT
        r.*,
        rb.name as requested_by_name,
        ru.name as requested_user_name
      FROM ${TABLE_NAMES.TASK_REQUESTS} r
      LEFT JOIN ${TABLE_NAMES.USERS} rb ON r.requested_by = rb.id
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON r.requested_user_id = ru.id
      WHERE r.task_id = $1
      ORDER BY r.created_at DESC`,
      [taskId],
    );
    return result.rows;
  } catch (error) {
    logger.error('Error fetching task requests', { error, taskId });
    return [];
  }
}
