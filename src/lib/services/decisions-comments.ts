/**
 * Decisions & Voting — Comments CRUD
 */

import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { decisionComments, decisions } from '@/db/schema/misc';
import { users } from '@/db/schema/auth';
import { DECISION_STATUS } from '@/config/decisions';

// Table name refs
const dcTable = getTableName(decisionComments);
const dTable = getTableName(decisions);
const uTable = getTableName(users);

// ─── DB Row Interface ─────────────────────────────────────────────────────

interface DbCommentRow {
  id: string;
  decision_id: string;
  user_id: string;
  content: string;
  position: string;
  option_id: string | null;
  parent_comment_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string | null;
}

// ─── Comments ─────────────────────────────────────────────────────────────

export async function getComments(decisionId: string) {
  const result = await db.execute(sql`
    SELECT dc.*, u.email AS user_email, u.name AS user_name
    FROM ${sql.raw(dcTable)} dc
    JOIN ${sql.raw(uTable)} u ON u.id = dc.user_id
    WHERE dc.decision_id = ${decisionId}
    ORDER BY dc.created_at ASC
  `);

  return (result.rows as unknown as DbCommentRow[]).map(c => ({
    id: c.id,
    decision_id: c.decision_id,
    content: c.content,
    position: c.position,
    option_id: c.option_id,
    parent_comment_id: c.parent_comment_id,
    is_edited: c.is_edited,
    edited_at: c.edited_at,
    created_at: c.created_at,
    user: { id: c.user_id, email: c.user_email!, name: c.user_name },
  }));
}

export async function createComment(
  decisionId: string,
  userId: string,
  data: { content: string; position: string; optionId?: string | null; parentCommentId?: string | null }
) {
  // Verify decision exists and is commentable
  const existing = await db.execute(sql`
    SELECT id, status FROM ${sql.raw(dTable)} WHERE id = ${decisionId}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  const existingRow = existing.rows[0] as unknown as { id: string; status: string };
  const commentableStatuses: string[] = [DECISION_STATUS.DISCUSSION, DECISION_STATUS.VOTING];
  if (!commentableStatuses.includes(existingRow.status)) {
    return { error: 'not_commentable' as const };
  }

  const result = await db.execute(sql`
    WITH inserted AS (
      INSERT INTO ${sql.raw(dcTable)}
        (decision_id, user_id, content, position, option_id, parent_comment_id)
      VALUES (${decisionId}, ${userId}, ${data.content}, ${data.position}, ${data.optionId ?? null}, ${data.parentCommentId ?? null})
      RETURNING *
    )
    SELECT i.*, u.email AS user_email, u.name AS user_name
    FROM inserted i
    JOIN ${sql.raw(uTable)} u ON u.id = i.user_id
  `);

  const c = result.rows[0] as unknown as DbCommentRow & { user_email: string; user_name: string | null };
  return {
    comment: {
      ...c,
      user: { id: c.user_id, email: c.user_email, name: c.user_name },
    },
  };
}

export async function updateComment(
  commentId: string,
  userId: string,
  content: string
) {
  const existing = await db.execute(sql`
    SELECT id, user_id FROM ${sql.raw(dcTable)} WHERE id = ${commentId}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };
  const existingRow = existing.rows[0] as unknown as { id: string; user_id: string };
  if (existingRow.user_id !== userId) return { error: 'not_author' as const };

  const result = await db.execute(sql`
    UPDATE ${sql.raw(dcTable)}
    SET content = ${content}, is_edited = true, edited_at = now()
    WHERE id = ${commentId}
    RETURNING *,
      (SELECT email FROM ${sql.raw(uTable)} WHERE id = user_id) AS user_email,
      (SELECT name FROM ${sql.raw(uTable)} WHERE id = user_id) AS user_name
  `);

  const c = result.rows[0] as unknown as DbCommentRow & { user_email: string; user_name: string | null };
  return {
    comment: {
      ...c,
      user: { id: c.user_id, email: c.user_email, name: c.user_name },
    },
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const existing = await db.execute(sql`
    SELECT id, user_id FROM ${sql.raw(dcTable)} WHERE id = ${commentId}
  `);
  if (existing.rows.length === 0) return { error: 'not_found' as const };
  const existingRow = existing.rows[0] as unknown as { id: string; user_id: string };
  if (existingRow.user_id !== userId) return { error: 'not_author' as const };

  await db.execute(sql`
    DELETE FROM ${sql.raw(dcTable)} WHERE id = ${commentId}
  `);

  return { success: true };
}
