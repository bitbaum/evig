import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { APPROVAL_STATUS } from '@/config/approval-status';

export interface MyTask {
  id: string;
  title: string;
  due_date: string | null;
  priority: string | null;
}

export interface MySubmission {
  id: string;
  content_type: string | null;
  title: string | null;
  status: string;
  created_at: string;
}

// Single source of truth for both the SQL LIMIT and the "view all" threshold
export const TASK_LIMIT = 5;
export const SUBMISSION_LIMIT = 5;

export interface PersonalSectionData {
  myTasks: MyTask[];
  mySubmissions: MySubmission[];
}

export async function getPersonalSectionData(userId: string): Promise<PersonalSectionData> {
  type Row = Record<string, unknown>;

  const [tasksResult, submissionsResult] = await Promise.allSettled([
    db.execute(sql`
      SELECT id, title, due_date, priority
      FROM ${sql.raw(TABLE_NAMES.TASKS)}
      WHERE assigned_to = ${userId}
        AND is_completed = false
        AND is_archived = false
      ORDER BY due_date ASC NULLS LAST, priority DESC
      LIMIT ${TASK_LIMIT}
    `),
    db.execute(sql`
      SELECT id, content_type, title, status, created_at
      FROM ${sql.raw(TABLE_NAMES.USER_CONTENT_SUBMISSIONS)}
      WHERE user_id = ${userId}
        AND status = ${APPROVAL_STATUS.PENDING}
      ORDER BY created_at DESC
      LIMIT ${SUBMISSION_LIMIT}
    `),
  ]);

  const myTasks: MyTask[] =
    tasksResult.status === 'fulfilled'
      ? (tasksResult.value.rows as Row[]).map((r) => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          due_date: r.due_date ? String(r.due_date) : null,
          priority: r.priority ? String(r.priority) : null,
        }))
      : (() => {
          logger.warn('PersonalSection tasks query failed', {
            error: (tasksResult as PromiseRejectedResult).reason,
          });
          return [];
        })();

  const mySubmissions: MySubmission[] =
    submissionsResult.status === 'fulfilled'
      ? (submissionsResult.value.rows as Row[]).map((r) => ({
          id: String(r.id ?? ''),
          content_type: r.content_type ? String(r.content_type) : null,
          title: r.title ? String(r.title) : null,
          status: String(r.status ?? APPROVAL_STATUS.PENDING),
          created_at: String(r.created_at ?? ''),
        }))
      : (() => {
          logger.warn('PersonalSection submissions query failed', {
            error: (submissionsResult as PromiseRejectedResult).reason,
          });
          return [];
        })();

  return { myTasks, mySubmissions };
}
