/**
 * Meeting Protocols — Action Item Linking (tasks & decisions)
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { protocolActionLinks, tasks, decisions } from '@/db/schema/misc'
import { logger } from '@/lib/logger'
import { DECISION_STATUS } from '@/config/decisions'
import { RELATED_TYPES } from '@/config/notifications'
import type { ActionLinkRecord } from '@/lib/schemas/protocols'

// Table name refs
const palTable = getTableName(protocolActionLinks)
const tTable = getTableName(tasks)
const dTable = getTableName(decisions)

// =============================================================================
// ACTION ITEM LINKING
// =============================================================================

/**
 * Get action links for a protocol
 */
export async function getActionLinks(protocolId: string): Promise<ActionLinkRecord[]> {
  const result = await db.execute(sql`
    SELECT
      pal.*,
      t.title as linked_task_title,
      t.current_status as linked_task_status,
      d.title as linked_decision_title,
      d.status as linked_decision_status
    FROM ${sql.raw(palTable)} pal
    LEFT JOIN ${sql.raw(tTable)} t ON pal.linked_task_id = t.id
    LEFT JOIN ${sql.raw(dTable)} d ON pal.linked_decision_id = d.id
    WHERE pal.protocol_id = ${protocolId}
    ORDER BY pal.created_at
  `)
  return result.rows as unknown as ActionLinkRecord[]
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
    assigned_to?: string | null
  },
  createdBy: string,
): Promise<{ taskId: string; linkId: string }> {
  return db.transaction(async (tx) => {
    // Create the task
    const taskResult = await tx.execute(sql`
      INSERT INTO ${sql.raw(tTable)} (
        title, description, task_type, category, priority, created_by, assigned_to
      ) VALUES (
        ${taskData.title},
        ${taskData.description || null},
        ${taskData.task_type || 'one_time'},
        ${taskData.category || 'admin'},
        ${taskData.priority || 'normal'},
        ${createdBy},
        ${taskData.assigned_to || null}
      )
      RETURNING id
    `)

    const taskId = (taskResult.rows[0] as unknown as { id: string }).id

    // Create the link
    const linkResult = await tx.execute(sql`
      INSERT INTO ${sql.raw(palTable)} (
        protocol_id, action_item_id, link_type, linked_task_id
      ) VALUES (${protocolId}, ${actionItemId}, ${RELATED_TYPES.TASK}, ${taskId})
      RETURNING id
    `)

    const linkId = (linkResult.rows[0] as unknown as { id: string }).id

    logger.info('Action item linked to task', {
      protocolId,
      actionItemId,
      taskId,
      linkId,
      assignedTo: taskData.assigned_to || null,
    })

    return { taskId, linkId }
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
  return db.transaction(async (tx) => {
    // Create the decision
    const decisionResult = await tx.execute(sql`
      INSERT INTO ${sql.raw(dTable)} (
        title, description, decision_type, voting_method, status, created_by
      ) VALUES (
        ${decisionData.title},
        ${decisionData.description},
        ${decisionData.decisionType || 'sense_check'},
        ${decisionData.votingMethod || 'simple_majority'},
        ${decisionData.initialStatus || DECISION_STATUS.DRAFT},
        ${createdBy}
      )
      RETURNING id
    `)

    const decisionId = (decisionResult.rows[0] as unknown as { id: string }).id

    // Create the link
    const linkResult = await tx.execute(sql`
      INSERT INTO ${sql.raw(palTable)} (
        protocol_id, action_item_id, link_type, linked_decision_id
      ) VALUES (${protocolId}, ${actionItemId}, ${RELATED_TYPES.DECISION}, ${decisionId})
      RETURNING id
    `)

    const linkId = (linkResult.rows[0] as unknown as { id: string }).id

    logger.info('Action item linked to decision', {
      protocolId,
      actionItemId,
      decisionId,
      linkId,
    })

    return { decisionId, linkId }
  })
}
