/**
 * Time-off request service — create / list / cancel / review, with
 * notifications in both directions. Raw parameterised SQL via query() +
 * TABLE_NAMES (project DB convention). Review runs on the shared
 * review-workflow core (lifecycle/review-workflow) — pilot A.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { getTimeOffKindLabel, TIME_OFF_STATUSES } from '@/config/time-off'
import { getTimecardApproverIds } from '@/lib/team/timecard-approvers'
import { runReviewTransition } from '@/lib/lifecycle/review-workflow'
import type { TransitionTable } from '@/lib/lifecycle'
import type {
  CreateTimeOffInput,
  ReviewTimeOffInput,
  TimeOffRequest,
} from '@/lib/schemas/time-off'

const T = TABLE_NAMES.TIME_OFF_REQUESTS
const U = TABLE_NAMES.USERS

// SELECT projection shared by every read — dates/timestamps cast to strings.
const SELECT_COLS = `
  r.id, r.user_id, r.kind, r.half_day, r.note, r.status, r.reviewed_by, r.review_notes,
  to_char(r.starts_on, 'YYYY-MM-DD') AS starts_on,
  to_char(r.ends_on, 'YYYY-MM-DD') AS ends_on,
  to_char(r.reviewed_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS reviewed_at,
  to_char(r.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at,
  u.name AS user_name, u.email AS user_email,
  rv.name AS reviewer_name`

const FROM_JOINS = `
  FROM ${T} r
  JOIN ${U} u ON u.id = r.user_id
  LEFT JOIN ${U} rv ON rv.id = r.reviewed_by`

function formatRange(req: { starts_on: string; ends_on: string }): string {
  return req.starts_on === req.ends_on ? req.starts_on : `${req.starts_on} – ${req.ends_on}`
}

export async function createTimeOffRequest(
  userId: string,
  input: CreateTimeOffInput,
): Promise<TimeOffRequest> {
  const insert = await query<{ id: string }>(
    `INSERT INTO ${T} (user_id, kind, starts_on, ends_on, half_day, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [userId, input.kind, input.starts_on, input.ends_on, input.half_day, input.note ?? null],
  )
  const id = insert.rows[0].id
  const [created] = await getRequestsByIds([id])

  // Notify approvers (staff with timecards permission) — in-app + email.
  try {
    const approverIds = await getTimecardApproverIds(userId)
    const label = getTimeOffKindLabel(input.kind)
    if (approverIds.length > 0) {
      await notifyUsers(approverIds, {
        type: NOTIFICATION_TYPES.TIME_OFF_REQUESTED,
        title: 'Neuer Abwesenheitsantrag',
        content: `${created.user_name || created.user_email || 'Ein Teammitglied'} beantragt ${label} (${formatRange(created)}).`,
        related_type: RELATED_TYPES.TIME_OFF_REVIEW,
        related_id: id,
      })
    }
  } catch (error) {
    logger.error('time-off: notify approvers failed', { error, requestId: id })
  }

  return created
}

export async function listMyTimeOffRequests(userId: string): Promise<TimeOffRequest[]> {
  const result = await query<TimeOffRequest>(
    `SELECT ${SELECT_COLS} ${FROM_JOINS}
     WHERE r.user_id = $1
     ORDER BY r.starts_on DESC`,
    [userId],
  )
  return result.rows
}

export async function listTimeOffRequests(status?: string): Promise<TimeOffRequest[]> {
  const params: unknown[] = []
  let where = ''
  if (status && status !== 'all') {
    params.push(status)
    where = `WHERE r.status = $1`
  }
  const result = await query<TimeOffRequest>(
    `SELECT ${SELECT_COLS} ${FROM_JOINS}
     ${where}
     ORDER BY (r.status = 'pending') DESC, r.starts_on ASC`,
    params,
  )
  return result.rows
}

async function getRequestsByIds(ids: string[]): Promise<TimeOffRequest[]> {
  if (ids.length === 0) return []
  const result = await query<TimeOffRequest>(
    `SELECT ${SELECT_COLS} ${FROM_JOINS} WHERE r.id = ANY($1)`,
    [ids],
  )
  return result.rows
}

/** Requester cancels their own still-pending request. Returns null if not allowed. */
export async function cancelTimeOffRequest(
  userId: string,
  id: string,
): Promise<TimeOffRequest | null> {
  const updated = await query<{ id: string }>(
    `UPDATE ${T} SET status = $1, updated_at = now()
     WHERE id = $2 AND user_id = $3 AND status = $4
     RETURNING id`,
    [TIME_OFF_STATUSES.CANCELLED, id, userId, TIME_OFF_STATUSES.PENDING],
  )
  if (updated.rows.length === 0) return null
  const [row] = await getRequestsByIds([id])
  return row ?? null
}

// Declarative review transitions — pilot A of the shared review-workflow core.
const REVIEW_TRANSITIONS: TransitionTable = [
  { action: 'approve', from: TIME_OFF_STATUSES.PENDING, to: TIME_OFF_STATUSES.APPROVED },
  { action: 'reject', from: TIME_OFF_STATUSES.PENDING, to: TIME_OFF_STATUSES.REJECTED },
]

/** Approver grants or declines a pending request; notifies the requester. */
export async function reviewTimeOffRequest(
  reviewerId: string,
  id: string,
  input: ReviewTimeOffInput,
): Promise<TimeOffRequest | null> {
  const action = input.status === TIME_OFF_STATUSES.APPROVED ? 'approve' : 'reject'

  const result = await runReviewTransition<{ status: string; user_id: string }>({
    // Column defaults (status/reviewed_by/reviewed_at/review_notes/updated_at)
    // match this table exactly.
    target: { table: T, select: ['user_id'] },
    transitions: REVIEW_TRANSITIONS,
    id,
    action,
    actor: { id: reviewerId },
    reason: input.review_notes ?? null,
    emit: async (row) => {
      // Re-fetch the joined projection (kind label + formatted range come
      // from the display query, not the locked row).
      const [full] = await getRequestsByIds([id])
      if (!full) return null
      const approved = action === 'approve'
      return {
        type: NOTIFICATION_TYPES.TIME_OFF_REVIEWED,
        recipients: { userId: String(row.user_id) },
        title: approved ? 'Abwesenheit genehmigt' : 'Abwesenheit abgelehnt',
        content: `Dein Antrag (${getTimeOffKindLabel(full.kind)}, ${formatRange(full)}) wurde ${
          approved ? 'genehmigt' : 'abgelehnt'
        }.${input.review_notes ? ` Hinweis: ${input.review_notes}` : ''}`,
        related: { type: RELATED_TYPES.TIME_OFF, id },
      }
    },
  })

  // Route contract: null → 404 ("kein offener Antrag") for every failure mode
  // (missing row, already reviewed, lost race).
  if (!result.ok) return null
  const [row] = await getRequestsByIds([id])
  return row ?? null
}
