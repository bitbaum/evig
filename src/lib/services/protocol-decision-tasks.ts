/**
 * Protocol ↔ Decision ↔ Task bridge
 *
 * Creates follow-up tasks from closed standalone decisions that were promoted
 * from a meeting-protocol action item (DecisionBridge / migration 086).
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { decisions, meetingProtocols, protocolActionLinks } from '@/db/schema/misc'
import { DECISION_STATUS } from '@/config/decisions'
import { TASK_PRIORITIES } from '@/config/tasks'
import { RELATED_TYPES } from '@/config/notifications'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import type { StructuredNotes } from '@/lib/schemas/protocols'
import { linkActionItemToTask } from './protocols-linking'

const dTable = getTableName(decisions)
const mpTable = getTableName(meetingProtocols)
const palTable = getTableName(protocolActionLinks)

export function getDecisionOutcomePassed(
  outcome: Record<string, unknown> | null,
  votingMethod: string,
): boolean | null {
  if (!outcome) return null

  if (votingMethod === 'thumbs_up_down') {
    return outcome.passed === true
  }

  if (typeof outcome.passed === 'boolean') {
    return outcome.passed
  }

  return null
}

export function buildFollowUpTaskPayload(input: {
  decisionTitle: string
  decisionDescription: string
  outcomeSummary: string | null
  protocolTitle: string | null
  meetingDate: string | null
  actionItemDescription?: string | null
}): { title: string; description: string; priority: string } {
  const baseTitle = input.actionItemDescription?.trim() || input.decisionTitle.trim()
  const title = baseTitle.length <= 200 ? baseTitle : `${baseTitle.slice(0, 197)}…`

  const descriptionParts = [
    input.outcomeSummary?.trim(),
    input.decisionDescription.trim(),
    input.protocolTitle
      ? `Aus Protokoll: ${input.protocolTitle}${input.meetingDate ? ` (${formatDateShort(input.meetingDate)})` : ''}`
      : null,
    `(Aus Entscheid: ${input.decisionTitle})`,
  ].filter(Boolean)

  return {
    title,
    description: descriptionParts.join('\n\n'),
    priority: TASK_PRIORITIES.NORMAL,
  }
}

export async function getTaskProtocolSource(taskId: string): Promise<{
  protocolId: string
  protocolTitle: string
  meetingDate: string
  actionItemId: string
} | null> {
  const result = await db.execute(sql`
    SELECT
      mp.id AS protocol_id,
      mp.title AS protocol_title,
      mp.meeting_date,
      pal.action_item_id
    FROM ${sql.raw(palTable)} pal
    JOIN ${sql.raw(mpTable)} mp ON mp.id = pal.protocol_id
    WHERE pal.linked_task_id = ${taskId}
      AND pal.link_type = ${RELATED_TYPES.TASK}
    LIMIT 1
  `)

  const row = result.rows[0] as unknown as {
    protocol_id: string
    protocol_title: string
    meeting_date: string
    action_item_id: string
  } | undefined

  if (!row) return null

  return {
    protocolId: row.protocol_id,
    protocolTitle: row.protocol_title,
    meetingDate: row.meeting_date,
    actionItemId: row.action_item_id,
  }
}

export async function createFollowUpTaskFromDecision(
  decisionId: string,
  createdBy: string,
): Promise<{ taskId: string; linkId: string; protocolId: string; actionItemId: string }> {
  const result = await db.execute(sql`
    SELECT
      d.id,
      d.title,
      d.description,
      d.status,
      d.voting_method,
      d.outcome,
      d.outcome_summary,
      d.protocol_id,
      d.action_item_id,
      mp.title AS protocol_title,
      mp.meeting_date,
      mp.structured_notes
    FROM ${sql.raw(dTable)} d
    LEFT JOIN ${sql.raw(mpTable)} mp ON mp.id = d.protocol_id
    WHERE d.id = ${decisionId}
  `)

  const row = result.rows[0] as unknown as {
    id: string
    title: string
    description: string
    status: string
    voting_method: string
    outcome: Record<string, unknown> | null
    outcome_summary: string | null
    protocol_id: string | null
    action_item_id: string | null
    protocol_title: string | null
    meeting_date: string | null
    structured_notes: StructuredNotes | null
  } | undefined

  if (!row) {
    throw new Error('DECISION_NOT_FOUND')
  }

  if (row.status === DECISION_STATUS.CANCELLED) {
    throw new Error('DECISION_CANCELLED')
  }

  if (row.status !== DECISION_STATUS.CLOSED) {
    throw new Error('DECISION_NOT_CLOSED')
  }

  if (!row.protocol_id || !row.action_item_id) {
    throw new Error('DECISION_NOT_PROTOCOL_LINKED')
  }

  const existingLink = await db.execute(sql`
    SELECT id FROM ${sql.raw(palTable)}
    WHERE protocol_id = ${row.protocol_id}
      AND action_item_id = ${row.action_item_id}
      AND link_type = ${RELATED_TYPES.TASK}
      AND linked_task_id IS NOT NULL
    LIMIT 1
  `)

  if (existingLink.rows.length > 0) {
    throw new Error('TASKS_ALREADY_CREATED')
  }

  const passed = getDecisionOutcomePassed(row.outcome, row.voting_method)
  if (passed === false) {
    throw new Error('DECISION_NOT_APPROVED')
  }

  const actionItem = row.structured_notes?.action_items.find(
    (item) => item.id === row.action_item_id,
  )

  const taskPayload = buildFollowUpTaskPayload({
    decisionTitle: row.title,
    decisionDescription: row.description,
    outcomeSummary: row.outcome_summary,
    protocolTitle: row.protocol_title,
    meetingDate: row.meeting_date,
    actionItemDescription: actionItem?.description,
  })

  const { taskId, linkId } = await linkActionItemToTask(
    row.protocol_id,
    row.action_item_id,
    {
      title: taskPayload.title,
      description: taskPayload.description,
      task_type: 'one_time',
      category: 'admin',
      priority: actionItem?.priority_hint || taskPayload.priority,
      assigned_to: actionItem?.assigned_to_id ?? null,
    },
    createdBy,
  )

  logger.info('Follow-up task created from decision', {
    decisionId,
    protocolId: row.protocol_id,
    actionItemId: row.action_item_id,
    taskId,
    linkId,
  })

  return {
    taskId,
    linkId,
    protocolId: row.protocol_id,
    actionItemId: row.action_item_id,
  }
}
