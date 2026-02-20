/**
 * Meeting Protocols — Action Item Linking (tasks & decisions)
 */

import { query, transaction } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import type { ActionLinkRecord } from '@/lib/schemas/protocols'

// =============================================================================
// ACTION ITEM LINKING
// =============================================================================

/**
 * Get action links for a protocol
 */
export async function getActionLinks(protocolId: string): Promise<ActionLinkRecord[]> {
  const result = await query<ActionLinkRecord>(
    `SELECT
      pal.*,
      t.title as linked_task_title,
      t.current_status as linked_task_status,
      d.title as linked_decision_title,
      d.status as linked_decision_status
    FROM ${TABLE_NAMES.PROTOCOL_ACTION_LINKS} pal
    LEFT JOIN ${TABLE_NAMES.TASKS} t ON pal.linked_task_id = t.id
    LEFT JOIN ${TABLE_NAMES.DECISIONS} d ON pal.linked_decision_id = d.id
    WHERE pal.protocol_id = $1
    ORDER BY pal.created_at`,
    [protocolId]
  )
  return result.rows
}

/**
 * Create a task from an action item and store the link
 */
export async function linkActionItemToTask(
  protocolId: string,
  actionItemId: string,
  taskData: {
    title: string
    description?: string | null
    task_type?: string
    category?: string
    priority?: string
  },
  createdBy: string,
): Promise<{ taskId: string; linkId: string }> {
  return transaction(async (client) => {
    // Create the task
    const taskResult = await client.query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.TASKS} (
        title, description, task_type, category, priority, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        taskData.title,
        taskData.description || null,
        taskData.task_type || 'one_time',
        taskData.category || 'admin',
        taskData.priority || 'normal',
        createdBy,
      ]
    )

    const taskId = taskResult.rows[0].id

    // Create the link
    const linkResult = await client.query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.PROTOCOL_ACTION_LINKS} (
        protocol_id, action_item_id, link_type, linked_task_id
      ) VALUES ($1, $2, 'task', $3)
      RETURNING id`,
      [protocolId, actionItemId, taskId]
    )

    logger.info('Action item linked to task', {
      protocolId,
      actionItemId,
      taskId,
      linkId: linkResult.rows[0].id,
    })

    return { taskId, linkId: linkResult.rows[0].id }
  })
}

/**
 * Create a decision from an action item and store the link
 */
export async function linkActionItemToDecision(
  protocolId: string,
  actionItemId: string,
  decisionData: {
    title: string
    description: string
    decisionType?: string
    votingMethod?: string
    initialStatus?: string
  },
  createdBy: string,
): Promise<{ decisionId: string; linkId: string }> {
  return transaction(async (client) => {
    // Create the decision
    const decisionResult = await client.query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.DECISIONS} (
        title, description, decision_type, voting_method, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        decisionData.title,
        decisionData.description,
        decisionData.decisionType || 'sense_check',
        decisionData.votingMethod || 'simple_majority',
        decisionData.initialStatus || 'draft',
        createdBy,
      ]
    )

    const decisionId = decisionResult.rows[0].id

    // Create the link
    const linkResult = await client.query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.PROTOCOL_ACTION_LINKS} (
        protocol_id, action_item_id, link_type, linked_decision_id
      ) VALUES ($1, $2, 'decision', $3)
      RETURNING id`,
      [protocolId, actionItemId, decisionId]
    )

    logger.info('Action item linked to decision', {
      protocolId,
      actionItemId,
      decisionId,
      linkId: linkResult.rows[0].id,
    })

    return { decisionId, linkId: linkResult.rows[0].id }
  })
}
