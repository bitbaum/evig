/**
 * Decisions & Voting — Comments CRUD
 */

import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';

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
  const result = await query<DbCommentRow>(
    `SELECT dc.*, u.email AS user_email, u.name AS user_name
     FROM ${TABLE_NAMES.DECISION_COMMENTS} dc
     JOIN ${TABLE_NAMES.USERS} u ON u.id = dc.user_id
     WHERE dc.decision_id = $1
     ORDER BY dc.created_at ASC`,
    [decisionId]
  );

  return result.rows.map(c => ({
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
  const existing = await query<{ id: string; status: string }>(
    `SELECT id, status FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [decisionId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };

  if (!['discussion', 'voting'].includes(existing.rows[0].status)) {
    return { error: 'not_commentable' as const };
  }

  const result = await query<DbCommentRow & { user_email: string; user_name: string | null }>(
    `WITH inserted AS (
       INSERT INTO ${TABLE_NAMES.DECISION_COMMENTS}
         (decision_id, user_id, content, position, option_id, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
     )
     SELECT i.*, u.email AS user_email, u.name AS user_name
     FROM inserted i
     JOIN ${TABLE_NAMES.USERS} u ON u.id = i.user_id`,
    [decisionId, userId, data.content, data.position, data.optionId ?? null, data.parentCommentId ?? null]
  );

  const c = result.rows[0];
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
  const existing = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE id = $1`,
    [commentId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };
  if (existing.rows[0].user_id !== userId) return { error: 'not_author' as const };

  const result = await query<DbCommentRow & { user_email: string; user_name: string | null }>(
    `UPDATE ${TABLE_NAMES.DECISION_COMMENTS}
     SET content = $1, is_edited = true, edited_at = now()
     WHERE id = $2
     RETURNING *,
       (SELECT email FROM ${TABLE_NAMES.USERS} WHERE id = user_id) AS user_email,
       (SELECT name FROM ${TABLE_NAMES.USERS} WHERE id = user_id) AS user_name`,
    [content, commentId]
  );

  const c = result.rows[0];
  return {
    comment: {
      ...c,
      user: { id: c.user_id, email: c.user_email, name: c.user_name },
    },
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const existing = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE id = $1`,
    [commentId]
  );
  if (existing.rows.length === 0) return { error: 'not_found' as const };
  if (existing.rows[0].user_id !== userId) return { error: 'not_author' as const };

  await query(
    `DELETE FROM ${TABLE_NAMES.DECISION_COMMENTS} WHERE id = $1`,
    [commentId]
  );

  return { success: true };
}
