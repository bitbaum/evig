/**
 * Meeting Protocols — Decision Voting & Task Proposals
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
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

// =============================================================================
// DECISION VOTING
// =============================================================================

/**
 * Cast a vote on a decision action item (toggle pattern).
 * Same vote again → remove. Different vote → change. New → insert.
 * After every vote: recount and check auto-close.
 */
export async function castDecisionVote(
  protocolId: string,
  actionItemId: string,
  voterId: string,
  voteType: DecisionVoteType,
): Promise<{ action: 'added' | 'changed' | 'removed'; votesUp: number; votesDown: number; isClosed: boolean; result: string }> {
  // Check if already closed
  const outcomeResult = await query<{ is_closed: boolean }>(
    `SELECT is_closed FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  if (outcomeResult.rows[0]?.is_closed) {
    throw new Error('DECISION_ALREADY_CLOSED')
  }

  // Check existing vote
  const existingVote = await query<{ vote_type: string }>(
    `SELECT vote_type FROM ${TABLE_NAMES.PROTOCOL_DECISION_VOTES}
     WHERE protocol_id = $1 AND action_item_id = $2 AND voter_id = $3`,
    [protocolId, actionItemId, voterId]
  )

  let action: 'added' | 'changed' | 'removed'

  if (existingVote.rows.length > 0) {
    if (existingVote.rows[0].vote_type === voteType) {
      // Same vote → remove (toggle off)
      await query(
        `DELETE FROM ${TABLE_NAMES.PROTOCOL_DECISION_VOTES}
         WHERE protocol_id = $1 AND action_item_id = $2 AND voter_id = $3`,
        [protocolId, actionItemId, voterId]
      )
      action = 'removed'
    } else {
      // Different vote → change
      await query(
        `UPDATE ${TABLE_NAMES.PROTOCOL_DECISION_VOTES}
         SET vote_type = $4
         WHERE protocol_id = $1 AND action_item_id = $2 AND voter_id = $3`,
        [protocolId, actionItemId, voterId, voteType]
      )
      action = 'changed'
    }
  } else {
    // New vote
    await query(
      `INSERT INTO ${TABLE_NAMES.PROTOCOL_DECISION_VOTES} (protocol_id, action_item_id, voter_id, vote_type)
       VALUES ($1, $2, $3, $4)`,
      [protocolId, actionItemId, voterId, voteType]
    )
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
  const countResult = await query<{ vote_type: string; cnt: string }>(
    `SELECT vote_type, COUNT(*)::text as cnt
     FROM ${TABLE_NAMES.PROTOCOL_DECISION_VOTES}
     WHERE protocol_id = $1 AND action_item_id = $2
     GROUP BY vote_type`,
    [protocolId, actionItemId]
  )

  const votesUp = parseInt(countResult.rows.find(r => r.vote_type === 'up')?.cnt || '0')
  const votesDown = parseInt(countResult.rows.find(r => r.vote_type === 'down')?.cnt || '0')

  // Upsert outcome with counts
  await query(
    `INSERT INTO ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES} (protocol_id, action_item_id, votes_up, votes_down)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (protocol_id, action_item_id)
     DO UPDATE SET votes_up = $3, votes_down = $4, updated_at = NOW()`,
    [protocolId, actionItemId, votesUp, votesDown]
  )

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
  const protocolResult = await query<{ attendees: string[] }>(
    `SELECT attendees FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [protocolId]
  )

  const attendees = protocolResult.rows[0]?.attendees || []
  if (attendees.length === 0) {
    // No attendees defined, can't auto-close
    const outcome = await query<{ is_closed: boolean; result: string }>(
      `SELECT is_closed, result FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
       WHERE protocol_id = $1 AND action_item_id = $2`,
      [protocolId, actionItemId]
    )
    return {
      isClosed: outcome.rows[0]?.is_closed || false,
      result: outcome.rows[0]?.result || 'pending',
    }
  }

  // Count distinct voters
  const voterCount = await query<{ cnt: string }>(
    `SELECT COUNT(DISTINCT voter_id)::text as cnt
     FROM ${TABLE_NAMES.PROTOCOL_DECISION_VOTES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  const totalVoters = parseInt(voterCount.rows[0]?.cnt || '0')

  if (totalVoters >= attendees.length) {
    // All voted, auto-close
    return closeDecisionInternal(protocolId, actionItemId, null)
  }

  const outcome = await query<{ is_closed: boolean; result: string }>(
    `SELECT is_closed, result FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  return {
    isClosed: outcome.rows[0]?.is_closed || false,
    result: outcome.rows[0]?.result || 'pending',
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
  const outcome = await query<{ votes_up: number; votes_down: number }>(
    `SELECT votes_up, votes_down FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  const votesUp = outcome.rows[0]?.votes_up || 0
  const votesDown = outcome.rows[0]?.votes_down || 0
  const result = votesUp > votesDown ? 'approved' : 'rejected'

  await query(
    `UPDATE ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     SET is_closed = true, closed_by = $3, closed_at = NOW(), result = $4, updated_at = NOW()
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId, closedBy, result]
  )

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
  const existing = await query<{ is_closed: boolean }>(
    `SELECT is_closed FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  if (existing.rows[0]?.is_closed) {
    throw new Error('DECISION_ALREADY_CLOSED')
  }

  // Ensure outcome exists with current counts
  await recountVotes(protocolId, actionItemId)

  const closeResult = await closeDecisionInternal(protocolId, actionItemId, closedBy)

  const counts = await query<{ votes_up: number; votes_down: number }>(
    `SELECT votes_up, votes_down FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  return {
    ...closeResult,
    votesUp: counts.rows[0]?.votes_up || 0,
    votesDown: counts.rows[0]?.votes_down || 0,
  }
}

/**
 * Get all decision votes and outcomes for a protocol.
 */
export async function getDecisionData(
  protocolId: string,
): Promise<{ votes: DecisionVoteRecord[]; outcomes: DecisionOutcomeRecord[] }> {
  const [votesResult, outcomesResult] = await Promise.all([
    query<DecisionVoteRecord>(
      `SELECT * FROM ${TABLE_NAMES.PROTOCOL_DECISION_VOTES} WHERE protocol_id = $1 ORDER BY created_at`,
      [protocolId]
    ),
    query<DecisionOutcomeRecord>(
      `SELECT * FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES} WHERE protocol_id = $1`,
      [protocolId]
    ),
  ])

  return {
    votes: votesResult.rows,
    outcomes: outcomesResult.rows,
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
  const outcomeResult = await query<DecisionOutcomeRecord>(
    `SELECT * FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  const outcome = outcomeResult.rows[0]
  if (!outcome || !outcome.is_closed) {
    throw new Error('DECISION_NOT_FOUND')
  }
  if (outcome.result !== 'approved') {
    throw new Error('DECISION_NOT_APPROVED')
  }

  // Get protocol context
  const protocolResult = await query<{
    title: string
    meeting_type: MeetingType
    attendees: string[]
    structured_notes: StructuredNotes | null
  }>(
    `SELECT title, meeting_type, attendees, structured_notes
     FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [protocolId]
  )

  const protocol = protocolResult.rows[0]
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
  await query(
    `UPDATE ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     SET proposed_tasks = $3::jsonb, proposal_model = $4, updated_at = NOW()
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId, JSON.stringify(aiResult.proposals), aiResult.model]
  )

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

  const result = await query<{ name: string }>(
    `SELECT name FROM ${TABLE_NAMES.USERS}
     WHERE id = ANY($1::uuid[]) AND name IS NOT NULL`,
    [attendeeIds]
  )

  return result.rows.map(r => r.name)
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
  const outcomeResult = await query<DecisionOutcomeRecord>(
    `SELECT * FROM ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  const outcome = outcomeResult.rows[0]
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
  await query(
    `UPDATE ${TABLE_NAMES.PROTOCOL_DECISION_OUTCOMES}
     SET tasks_created = true, updated_at = NOW()
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  logger.info('Decision tasks created', {
    protocolId, actionItemId, taskCount: taskIds.length,
  })

  return { taskCount: taskIds.length, taskIds }
}
