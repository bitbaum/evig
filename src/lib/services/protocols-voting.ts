/**
 * Meeting Protocols — Decision Voting & Task Proposals
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { meetingProtocols, protocolDecisionVotes, protocolDecisionOutcomes } from '@/db/schema/misc'
import { users } from '@/db/schema/auth'
import { MEETING_TYPE_LABELS } from '@/config/protocols'
import { PROTOCOL_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { processDecisionProposal } from '@/lib/ai/protocol-processing'
import { logger } from '@/lib/logger'
import type { MeetingType } from '@/config/protocols'
import type { DecisionVoteType } from '@/config/protocols'
import type {
  StructuredNotes,
  DecisionVoteRecord,
  DecisionOutcomeRecord,
  ProposedTask,
} from '@/lib/schemas/protocols'
import { linkActionItemToTask } from './protocols-linking'

// Table name refs
const mpTable = getTableName(meetingProtocols)
const pdvTable = getTableName(protocolDecisionVotes)
const pdoTable = getTableName(protocolDecisionOutcomes)
const uTable = getTableName(users)

// =============================================================================
// DECISION VOTING
// =============================================================================

/**
 * Cast a vote on a decision action item (toggle pattern).
 * Same vote again -> remove. Different vote -> change. New -> insert.
 * After every vote: recount and check auto-close.
 */
export async function castDecisionVote(
  protocolId: string,
  actionItemId: string,
  voterId: string,
  voteType: DecisionVoteType,
): Promise<{ action: 'added' | 'changed' | 'removed'; votesUp: number; votesDown: number; isClosed: boolean; result: string }> {
  // Check if already closed
  const outcomeResult = await db.execute(sql`
    SELECT is_closed FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  if ((outcomeResult.rows[0] as unknown as { is_closed: boolean } | undefined)?.is_closed) {
    throw new Error('DECISION_ALREADY_CLOSED')
  }

  // Check existing vote
  const existingVote = await db.execute(sql`
    SELECT vote_type FROM ${sql.raw(pdvTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId} AND voter_id = ${voterId}
  `)

  let action: 'added' | 'changed' | 'removed'

  if (existingVote.rows.length > 0) {
    if ((existingVote.rows[0] as unknown as { vote_type: string }).vote_type === voteType) {
      // Same vote -> remove (toggle off)
      await db.execute(sql`
        DELETE FROM ${sql.raw(pdvTable)}
        WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId} AND voter_id = ${voterId}
      `)
      action = 'removed'
    } else {
      // Different vote -> change
      await db.execute(sql`
        UPDATE ${sql.raw(pdvTable)}
        SET vote_type = ${voteType}
        WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId} AND voter_id = ${voterId}
      `)
      action = 'changed'
    }
  } else {
    // New vote
    await db.execute(sql`
      INSERT INTO ${sql.raw(pdvTable)} (protocol_id, action_item_id, voter_id, vote_type)
      VALUES (${protocolId}, ${actionItemId}, ${voterId}, ${voteType})
    `)
    action = 'added'
  }

  // Recount votes
  const counts = await recountVotes(protocolId, actionItemId)

  // Check auto-close
  const autoCloseResult = await checkAutoClose(protocolId, actionItemId)

  logger.info('Decision vote cast', {
    protocolId, actionItemId, voterId, voteType, action,
    votesUp: counts.votesUp, votesDown: counts.votesDown,
  })

  return {
    action,
    votesUp: counts.votesUp,
    votesDown: counts.votesDown,
    isClosed: autoCloseResult.isClosed,
    result: autoCloseResult.result,
  }
}

/**
 * Recount votes and upsert the decision outcome record.
 */
async function recountVotes(
  protocolId: string,
  actionItemId: string,
): Promise<{ votesUp: number; votesDown: number }> {
  const countResult = await db.execute(sql`
    SELECT vote_type, COUNT(*)::text as cnt
    FROM ${sql.raw(pdvTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
    GROUP BY vote_type
  `)

  const rows = countResult.rows as unknown as Array<{ vote_type: string; cnt: string }>
  const votesUp = parseInt(rows.find(r => r.vote_type === 'up')?.cnt || '0')
  const votesDown = parseInt(rows.find(r => r.vote_type === 'down')?.cnt || '0')

  // Upsert outcome with counts
  await db.execute(sql`
    INSERT INTO ${sql.raw(pdoTable)} (protocol_id, action_item_id, votes_up, votes_down)
    VALUES (${protocolId}, ${actionItemId}, ${votesUp}, ${votesDown})
    ON CONFLICT (protocol_id, action_item_id)
    DO UPDATE SET votes_up = ${votesUp}, votes_down = ${votesDown}, updated_at = NOW()
  `)

  return { votesUp, votesDown }
}

/**
 * Check if all attendees have voted and auto-close if so.
 */
async function checkAutoClose(
  protocolId: string,
  actionItemId: string,
): Promise<{ isClosed: boolean; result: string }> {
  // Get attendee count
  const protocolResult = await db.execute(sql`
    SELECT attendees FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
  `)

  const attendees = (protocolResult.rows[0] as unknown as { attendees: string[] } | undefined)?.attendees || []
  if (attendees.length === 0) {
    // No attendees defined, can't auto-close
    const outcome = await db.execute(sql`
      SELECT is_closed, result FROM ${sql.raw(pdoTable)}
      WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
    `)
    const outcomeRow = outcome.rows[0] as unknown as { is_closed: boolean; result: string } | undefined
    return {
      isClosed: outcomeRow?.is_closed || false,
      result: outcomeRow?.result || 'pending',
    }
  }

  // Count distinct voters
  const voterCount = await db.execute(sql`
    SELECT COUNT(DISTINCT voter_id)::text as cnt
    FROM ${sql.raw(pdvTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  const totalVoters = parseInt((voterCount.rows[0] as unknown as { cnt: string })?.cnt || '0')

  if (totalVoters >= attendees.length) {
    // All voted, auto-close
    return closeDecisionInternal(protocolId, actionItemId, null)
  }

  const outcome = await db.execute(sql`
    SELECT is_closed, result FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  const outcomeRow = outcome.rows[0] as unknown as { is_closed: boolean; result: string } | undefined
  return {
    isClosed: outcomeRow?.is_closed || false,
    result: outcomeRow?.result || 'pending',
  }
}

/**
 * Internal close logic shared by auto-close and manual close.
 */
async function closeDecisionInternal(
  protocolId: string,
  actionItemId: string,
  closedBy: string | null,
): Promise<{ isClosed: boolean; result: string }> {
  // Get current counts
  const outcome = await db.execute(sql`
    SELECT votes_up, votes_down FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  const outcomeRow = outcome.rows[0] as unknown as { votes_up: number; votes_down: number } | undefined
  const votesUp = outcomeRow?.votes_up || 0
  const votesDown = outcomeRow?.votes_down || 0
  const result = votesUp > votesDown ? 'approved' : 'rejected'

  await db.execute(sql`
    UPDATE ${sql.raw(pdoTable)}
    SET is_closed = true, closed_by = ${closedBy}, closed_at = NOW(), result = ${result}, updated_at = NOW()
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  logger.info('Decision closed', {
    protocolId, actionItemId, result, votesUp, votesDown, closedBy,
  })

  return { isClosed: true, result }
}

/**
 * Manually close a decision (by protocol creator).
 */
export async function closeDecision(
  protocolId: string,
  actionItemId: string,
  closedBy: string,
): Promise<{ isClosed: boolean; result: string; votesUp: number; votesDown: number }> {
  // Check if already closed
  const existing = await db.execute(sql`
    SELECT is_closed FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  if ((existing.rows[0] as unknown as { is_closed: boolean } | undefined)?.is_closed) {
    throw new Error('DECISION_ALREADY_CLOSED')
  }

  // Ensure outcome exists with current counts
  await recountVotes(protocolId, actionItemId)

  const closeResult = await closeDecisionInternal(protocolId, actionItemId, closedBy)

  const counts = await db.execute(sql`
    SELECT votes_up, votes_down FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  const countsRow = counts.rows[0] as unknown as { votes_up: number; votes_down: number } | undefined
  return {
    ...closeResult,
    votesUp: countsRow?.votes_up || 0,
    votesDown: countsRow?.votes_down || 0,
  }
}

/**
 * Get all decision votes and outcomes for a protocol.
 */
export async function getDecisionData(
  protocolId: string,
): Promise<{ votes: DecisionVoteRecord[]; outcomes: DecisionOutcomeRecord[] }> {
  const [votesResult, outcomesResult] = await Promise.all([
    db.execute(sql`
      SELECT * FROM ${sql.raw(pdvTable)} WHERE protocol_id = ${protocolId} ORDER BY created_at
    `),
    db.execute(sql`
      SELECT * FROM ${sql.raw(pdoTable)} WHERE protocol_id = ${protocolId}
    `),
  ])

  return {
    votes: votesResult.rows as unknown as DecisionVoteRecord[],
    outcomes: outcomesResult.rows as unknown as DecisionOutcomeRecord[],
  }
}

// =============================================================================
// TASK PROPOSALS
// =============================================================================

/**
 * Generate AI task proposals for an approved decision.
 */
export async function generateTaskProposals(
  protocolId: string,
  actionItemId: string,
): Promise<{ proposals: ProposedTask[]; model: string }> {
  // Get outcome — must be closed and approved
  const outcomeResult = await db.execute(sql`
    SELECT * FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  const outcome = outcomeResult.rows[0] as unknown as DecisionOutcomeRecord | undefined
  if (!outcome || !outcome.is_closed) {
    throw new Error('DECISION_NOT_FOUND')
  }
  if (outcome.result !== 'approved') {
    throw new Error('DECISION_NOT_APPROVED')
  }

  // Get protocol context
  const protocolResult = await db.execute(sql`
    SELECT title, meeting_type, attendees, structured_notes
    FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
  `)

  const protocol = protocolResult.rows[0] as unknown as {
    title: string
    meeting_type: MeetingType
    attendees: string[]
    structured_notes: StructuredNotes | null
  } | undefined
  if (!protocol) throw new Error('PROTOCOL_NOT_FOUND')

  // Find the decision action item
  const actionItem = protocol.structured_notes?.action_items.find(ai => ai.id === actionItemId)
  if (!actionItem) throw new Error('DECISION_NOT_FOUND')

  // Find related topic for context
  const topic = actionItem.topic_id
    ? protocol.structured_notes?.topics.find(t => t.id === actionItem.topic_id)
    : null

  // Resolve attendee names
  const attendeeNames = await resolveAttendeeIds(protocol.attendees)

  // Build prompt
  const prompt = fillPromptTemplate(PROTOCOL_PROMPTS.proposeTasksFromDecision, {
    decision: actionItem.description,
    topicContext: topic ? `${topic.title}: ${topic.discussion}` : 'Kein zusätzlicher Kontext',
    protocolTitle: protocol.title,
    meetingType: MEETING_TYPE_LABELS[protocol.meeting_type],
    attendees: attendeeNames.join(', ') || 'Keine Teilnehmer definiert',
    schema: PROTOCOL_PROMPTS.proposalSchema,
  })

  const aiResult = await processDecisionProposal(prompt)

  if (!aiResult) {
    throw new Error('AI_PROPOSAL_FAILED')
  }

  // Store proposals in outcome
  await db.execute(sql`
    UPDATE ${sql.raw(pdoTable)}
    SET proposed_tasks = ${JSON.stringify(aiResult.proposals)}::jsonb, proposal_model = ${aiResult.model}, updated_at = NOW()
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  logger.info('Task proposals generated', {
    protocolId, actionItemId, proposalCount: aiResult.proposals.length, model: aiResult.model,
  })

  return { proposals: aiResult.proposals, model: aiResult.model }
}

/**
 * Resolve attendee user IDs to names.
 */
async function resolveAttendeeIds(attendeeIds: string[]): Promise<string[]> {
  if (!attendeeIds || attendeeIds.length === 0) return []

  const result = await db.execute(sql`
    SELECT name FROM ${sql.raw(uTable)}
    WHERE id = ANY(${attendeeIds}::uuid[]) AND name IS NOT NULL
  `)

  return (result.rows as unknown as Array<{ name: string }>).map(r => r.name)
}

/**
 * Create system tasks from AI-proposed tasks for an approved decision.
 */
export async function createProposedTasks(
  protocolId: string,
  actionItemId: string,
  createdBy: string,
): Promise<{ taskCount: number; taskIds: string[] }> {
  // Get outcome with proposals
  const outcomeResult = await db.execute(sql`
    SELECT * FROM ${sql.raw(pdoTable)}
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  const outcome = outcomeResult.rows[0] as unknown as DecisionOutcomeRecord | undefined
  if (!outcome) throw new Error('DECISION_NOT_FOUND')
  if (outcome.result !== 'approved') throw new Error('DECISION_NOT_APPROVED')
  if (outcome.tasks_created) throw new Error('TASKS_ALREADY_CREATED')
  if (!outcome.proposed_tasks || outcome.proposed_tasks.length === 0) {
    throw new Error('AI_PROPOSAL_FAILED')
  }

  const taskIds: string[] = []

  for (const proposal of outcome.proposed_tasks) {
    const { taskId } = await linkActionItemToTask(
      protocolId,
      actionItemId,
      {
        title: proposal.title,
        description: proposal.description || `Aus Entscheidung: ${actionItemId}`,
        task_type: 'one_time',
        category: 'admin',
        priority: proposal.priority || 'normal',
      },
      createdBy,
    )
    taskIds.push(taskId)
  }

  // Mark tasks as created
  await db.execute(sql`
    UPDATE ${sql.raw(pdoTable)}
    SET tasks_created = true, updated_at = NOW()
    WHERE protocol_id = ${protocolId} AND action_item_id = ${actionItemId}
  `)

  logger.info('Decision tasks created', {
    protocolId, actionItemId, taskCount: taskIds.length,
  })

  return { taskCount: taskIds.length, taskIds }
}
