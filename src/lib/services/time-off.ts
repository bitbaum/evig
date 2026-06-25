/**
 * Time-off request service — create / list / cancel / review, with
 * notifications in both directions. Raw parameterised SQL via query() +
 * TABLE_NAMES (project DB convention); notifications via createNotification.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { createNotification, notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { getTimeOffKindLabel, TIME_OFF_STATUSES } from '@/config/time-off'
import { getTimecardApproverIds } from '@/lib/team/timecard-approvers'
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

/** Approver grants or declines a pending request; notifies the requester. */
export async function reviewTimeOffRequest(
  reviewerId: string,
  id: string,
  input: ReviewTimeOffInput,
): Promise<TimeOffRequest | null> {
  const updated = await query<{ id: string; user_id: string }>(
    `UPDATE ${T}
     SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now()
     WHERE id = $4 AND status = $5
     RETURNING id, user_id`,
    [input.status, input.review_notes ?? null, reviewerId, id, TIME_OFF_STATUSES.PENDING],
  )
  if (updated.rows.length === 0) return null
  const [row] = await getRequestsByIds([id])

  try {
    const approved = input.status === TIME_OFF_STATUSES.APPROVED
    await createNotification(updated.rows[0].user_id, {
      type: NOTIFICATION_TYPES.TIME_OFF_REVIEWED,
      title: approved ? 'Abwesenheit genehmigt' : 'Abwesenheit abgelehnt',
      content: `Dein Antrag (${getTimeOffKindLabel(row.kind)}, ${formatRange(row)}) wurde ${
        approved ? 'genehmigt' : 'abgelehnt'
      }.${input.review_notes ? ` Hinweis: ${input.review_notes}` : ''}`,
      related_type: RELATED_TYPES.TIME_OFF,
      related_id: id,
    })
  } catch (error) {
    logger.error('time-off: notify requester failed', { error, requestId: id })
  }

  return row ?? null
}
