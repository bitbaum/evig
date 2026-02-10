/**
 * Meeting Protocols Service Layer
 *
 * Core business logic for meeting protocols.
 * AI processing, visibility filtering, action item linking.
 *
 * Created: 2026-02-10
 */

import { query, transaction } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { MEETING_TYPE_LABELS, MEETING_TYPE_TEMPLATES } from '@/config/protocols'
import { PROTOCOL_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { processProtocolTranscript, processProtocolNotes, processTaskList, processDecisionProposal } from '@/lib/ai/protocol-processing'
import { logger } from '@/lib/logger'
import type { MeetingType } from '@/config/protocols'
import type {
  ProtocolListItem,
  ProtocolDetail,
  ActionLinkRecord,
  StructuredNotes,
  CreateProtocolInput,
  UpdateProtocolInput,
  DecisionVoteRecord,
  DecisionOutcomeRecord,
  ProposedTask,
} from '@/lib/schemas/protocols'
import { structuredNotesSchema, parsedTaskListSchema, proposedTaskListSchema } from '@/lib/schemas/protocols'
import type { DecisionVoteType } from '@/config/protocols'

// =============================================================================
// QUERIES
// =============================================================================

interface ProtocolStats {
  total: number
  draft: number
  review: number
  finalized: number
}

/**
 * Get protocol stats with visibility filtering
 */
export async function getProtocolStats(
  userId: string,
  isSuperAdmin: boolean,
): Promise<ProtocolStats> {
  const result = await query<{
    total: string
    draft: string
    review: string
    finalized: string
  }>(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'draft') as draft,
      COUNT(*) FILTER (WHERE status = 'review') as review,
      COUNT(*) FILTER (WHERE status = 'finalized') as finalized
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    WHERE (
      mp.visibility = 'team'
      OR mp.created_by = $1
      OR mp.attendees @> to_jsonb($1::text)
      OR $2 = true
    )
  `, [userId, isSuperAdmin])

  const row = result.rows[0]
  return {
    total: parseInt(row?.total || '0'),
    draft: parseInt(row?.draft || '0'),
    review: parseInt(row?.review || '0'),
    finalized: parseInt(row?.finalized || '0'),
  }
}

/**
 * Get team members for attendee mapping
 */
export async function getTeamMembers(): Promise<Array<{ id: string; name: string }>> {
  const result = await query<{ id: string; name: string }>(
    `SELECT id, name FROM ${TABLE_NAMES.USERS} WHERE name IS NOT NULL ORDER BY name`
  )
  return result.rows
}

/**
 * List protocols with visibility filtering
 */
export async function getProtocols(
  userId: string,
  isSuperAdmin: boolean,
  filters?: { meeting_type?: string; status?: string; q?: string }
): Promise<ProtocolListItem[]> {
  let queryText = `
    SELECT
      mp.id,
      mp.title,
      mp.meeting_date,
      mp.meeting_type,
      mp.visibility,
      mp.attendees,
      mp.status,
      mp.created_at,
      u.name as created_by_name,
      (
        SELECT COUNT(*)::int
        FROM jsonb_array_elements(COALESCE(mp.structured_notes->'action_items', '[]'::jsonb)) ai
      ) as action_item_count
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    LEFT JOIN ${TABLE_NAMES.USERS} u ON mp.created_by = u.id
    WHERE (
      mp.visibility = 'team'
      OR mp.created_by = $1
      OR mp.attendees @> to_jsonb($1::text)
      OR $2 = true
    )
  `

  const params: (string | boolean)[] = [userId, isSuperAdmin]
  let paramIndex = 3

  if (filters?.meeting_type) {
    queryText += ` AND mp.meeting_type = $${paramIndex++}`
    params.push(filters.meeting_type)
  }

  if (filters?.status) {
    queryText += ` AND mp.status = $${paramIndex++}`
    params.push(filters.status)
  }

  if (filters?.q) {
    queryText += ` AND mp.title ILIKE '%' || $${paramIndex++} || '%'`
    params.push(filters.q)
  }

  queryText += ` ORDER BY mp.meeting_date DESC, mp.created_at DESC LIMIT 100`

  const result = await query<ProtocolListItem>(queryText, params)
  return result.rows
}

/**
 * Get single protocol with visibility check
 */
export async function getProtocolById(
  id: string,
  userId: string,
  isSuperAdmin: boolean,
): Promise<ProtocolDetail | null> {
  const result = await query<ProtocolDetail>(
    `SELECT
      mp.*,
      u.name as created_by_name,
      u.email as created_by_email
    FROM ${TABLE_NAMES.MEETING_PROTOCOLS} mp
    LEFT JOIN ${TABLE_NAMES.USERS} u ON mp.created_by = u.id
    WHERE mp.id = $1
    AND (
      mp.visibility = 'team'
      OR mp.created_by = $2
      OR mp.attendees @> to_jsonb($2::text)
      OR $3 = true
    )`,
    [id, userId, isSuperAdmin]
  )
  return result.rows[0] || null
}

/**
 * Create protocol in draft status
 */
export async function createProtocol(
  data: CreateProtocolInput,
  createdBy: string
): Promise<{ id: string }> {
  const result = await query<{ id: string }>(
    `INSERT INTO ${TABLE_NAMES.MEETING_PROTOCOLS} (
      title, meeting_date, meeting_type, visibility, attendees, input_method, created_by
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    RETURNING id`,
    [
      data.title,
      data.meeting_date,
      data.meeting_type,
      data.visibility,
      JSON.stringify(data.attendees || []),
      data.input_method || 'transcript',
      createdBy,
    ]
  )
  return result.rows[0]
}

/**
 * Update protocol (draft/review only)
 */
export async function updateProtocol(
  id: string,
  data: UpdateProtocolInput,
  userId: string,
): Promise<ProtocolDetail | null> {
  // Verify protocol exists and is editable
  const existing = await query<{ status: string; created_by: string }>(
    `SELECT status, created_by FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [id]
  )

  if (existing.rows.length === 0) return null

  const { status } = existing.rows[0]
  if (status !== 'draft' && status !== 'review') {
    throw new Error('PROTOCOL_NOT_EDITABLE')
  }

  // Build dynamic update
  const updates: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  const fieldMap: Record<string, unknown> = {
    title: data.title,
    meeting_date: data.meeting_date,
    meeting_type: data.meeting_type,
    visibility: data.visibility,
    attendees: data.attendees ? JSON.stringify(data.attendees) : undefined,
    structured_notes: data.structured_notes ? JSON.stringify(data.structured_notes) : undefined,
  }

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      if (field === 'attendees') {
        updates.push(`${field} = $${paramIndex++}::jsonb`)
      } else if (field === 'structured_notes') {
        updates.push(`${field} = $${paramIndex++}::jsonb`)
      } else {
        updates.push(`${field} = $${paramIndex++}`)
      }
      params.push(value)
    }
  }

  if (updates.length === 0) return null

  params.push(id)

  const result = await query<ProtocolDetail>(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  )

  return result.rows[0] || null
}

// =============================================================================
// AI PROCESSING
// =============================================================================

/**
 * Process transcript with AI and store structured notes
 */
export async function processTranscript(
  protocolId: string,
  rawTranscript: string,
): Promise<{ success: boolean; model?: string; error?: string }> {
  // Set status to processing
  await query(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET status = 'processing', raw_transcript = $2
     WHERE id = $1`,
    [protocolId, rawTranscript]
  )

  // Get protocol metadata for prompt context
  const protocolResult = await query<{ meeting_type: MeetingType }>(
    `SELECT meeting_type FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [protocolId]
  )

  if (protocolResult.rows.length === 0) {
    return { success: false, error: 'Protokoll nicht gefunden' }
  }

  const { meeting_type } = protocolResult.rows[0]
  const template = MEETING_TYPE_TEMPLATES[meeting_type]
  const meetingTypeLabel = MEETING_TYPE_LABELS[meeting_type]

  // Build prompt
  const prompt = fillPromptTemplate(PROTOCOL_PROMPTS.extract, {
    transcript: rawTranscript,
    meetingType: meetingTypeLabel,
    agendaHints: template.agenda_hints.join(', ') || 'Keine',
    schema: PROTOCOL_PROMPTS.schema,
  })

  // Call AI module
  const aiResult = await processProtocolTranscript(prompt)

  if (!aiResult) {
    // Reset status on failure
    await query(
      `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
       SET status = 'draft'
       WHERE id = $1`,
      [protocolId]
    )
    return { success: false, error: 'KI-Verarbeitung fehlgeschlagen' }
  }

  // Try to resolve attendee names
  const resolvedNotes = await resolveAttendeeNames(aiResult.notes)

  // Store results
  await query(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET structured_notes = $2::jsonb,
         processing_model = $3,
         status = 'review'
     WHERE id = $1`,
    [protocolId, JSON.stringify(resolvedNotes), aiResult.model]
  )

  logger.info('Protocol transcript processed', {
    protocolId,
    model: aiResult.model,
    topicCount: resolvedNotes.topics.length,
    actionItemCount: resolvedNotes.action_items.length,
  })

  return { success: true, model: aiResult.model }
}

// =============================================================================
// NOTES PROCESSING (Step 3)
// =============================================================================

/**
 * Process notes content — auto-detects JSON vs free text.
 * JSON: validates and stores directly. Free text: sends to AI.
 */
export async function processNotes(
  protocolId: string,
  content: string,
): Promise<{ success: boolean; model?: string; source?: 'json' | 'ai'; error?: string }> {
  // Try JSON first
  try {
    const parsed = JSON.parse(content)
    const validated = structuredNotesSchema.safeParse(parsed)

    if (validated.success) {
      // Valid structured notes JSON — store directly
      const resolvedNotes = await resolveAttendeeNames(validated.data)

      await query(
        `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
         SET structured_notes = $2::jsonb,
             processing_model = 'json-import',
             status = 'review'
         WHERE id = $1`,
        [protocolId, JSON.stringify(resolvedNotes)]
      )

      logger.info('Notes imported from JSON', { protocolId })
      return { success: true, source: 'json' }
    }

    // Valid JSON but wrong shape
    return {
      success: false,
      error: 'JSON-Format stimmt nicht mit dem erwarteten Schema überein',
    }
  } catch {
    // Not JSON — treat as free text, send to AI
  }

  // Free text path
  await query(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET status = 'processing'
     WHERE id = $1`,
    [protocolId]
  )

  const protocolResult = await query<{ meeting_type: MeetingType }>(
    `SELECT meeting_type FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [protocolId]
  )

  if (protocolResult.rows.length === 0) {
    return { success: false, error: 'Protokoll nicht gefunden' }
  }

  const { meeting_type } = protocolResult.rows[0]
  const template = MEETING_TYPE_TEMPLATES[meeting_type]
  const meetingTypeLabel = MEETING_TYPE_LABELS[meeting_type]

  const prompt = fillPromptTemplate(PROTOCOL_PROMPTS.structureNotes, {
    notes: content,
    meetingType: meetingTypeLabel,
    agendaHints: template.agenda_hints.join(', ') || 'Keine',
    schema: PROTOCOL_PROMPTS.schema,
  })

  const aiResult = await processProtocolNotes(prompt)

  if (!aiResult) {
    await query(
      `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
       SET status = 'draft'
       WHERE id = $1`,
      [protocolId]
    )
    return { success: false, error: 'KI-Verarbeitung der Notizen fehlgeschlagen' }
  }

  const resolvedNotes = await resolveAttendeeNames(aiResult.notes)

  await query(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET structured_notes = $2::jsonb,
         processing_model = $3,
         status = 'review'
     WHERE id = $1`,
    [protocolId, JSON.stringify(resolvedNotes), aiResult.model]
  )

  logger.info('Notes processed via AI', {
    protocolId,
    model: aiResult.model,
    topicCount: resolvedNotes.topics.length,
  })

  return { success: true, model: aiResult.model, source: 'ai' }
}

// =============================================================================
// TASK IMPORT (Step 4)
// =============================================================================

/**
 * Import tasks from content — auto-detects JSON vs plain text.
 * Creates action items and optionally links them to system tasks.
 */
export async function importTasks(
  protocolId: string,
  content: string,
  createdBy: string,
): Promise<{ success: boolean; taskCount?: number; model?: string; source?: 'json' | 'ai'; error?: string }> {
  let tasks: Array<{ description: string; assigned_to_name: string | null; priority: string; due_hint: string | null }>

  let model: string | undefined
  let source: 'json' | 'ai'

  // Try JSON first
  try {
    const parsed = JSON.parse(content)
    const validated = parsedTaskListSchema.safeParse(parsed)

    if (validated.success) {
      tasks = validated.data
      source = 'json'
    } else {
      return {
        success: false,
        error: 'JSON-Format stimmt nicht mit dem erwarteten Schema überein',
      }
    }
  } catch {
    // Not JSON — send to AI
    const prompt = fillPromptTemplate(PROTOCOL_PROMPTS.parseTasks, {
      taskList: content,
      schema: PROTOCOL_PROMPTS.taskSchema,
    })

    const aiResult = await processTaskList(prompt)

    if (!aiResult) {
      return { success: false, error: 'KI-Verarbeitung der Aufgabenliste fehlgeschlagen' }
    }

    tasks = aiResult.tasks
    model = aiResult.model
    source = 'ai'
  }

  if (tasks.length === 0) {
    return { success: false, error: 'Keine Aufgaben erkannt' }
  }

  // Resolve assigned names to user IDs
  const usersResult = await query<{ id: string; name: string }>(
    `SELECT id, name FROM ${TABLE_NAMES.USERS} WHERE name IS NOT NULL`
  )
  const users = usersResult.rows

  // Build action items for structured_notes and create system tasks
  const actionItems = []
  let taskCount = 0

  for (const task of tasks) {
    const actionItemId = crypto.randomUUID()

    // Fuzzy match assigned_to_name → user ID
    let assignedToId: string | null = null
    if (task.assigned_to_name) {
      const match = users.find(u => {
        const userName = u.name.toLowerCase()
        const assignedName = task.assigned_to_name!.toLowerCase()
        return userName.includes(assignedName) ||
          assignedName.includes(userName.split(' ')[0])
      })
      if (match) assignedToId = match.id
    }

    actionItems.push({
      id: actionItemId,
      description: task.description,
      assigned_to_name: task.assigned_to_name,
      assigned_to_id: assignedToId,
      due_hint: task.due_hint,
      item_type: 'task' as const,
      topic_id: null,
      priority_hint: task.priority as 'low' | 'normal' | 'high',
    })

    // Create system task via existing linkActionItemToTask
    await linkActionItemToTask(
      protocolId,
      actionItemId,
      {
        title: task.description,
        description: `Importiert aus Protokoll (Aufgabenliste)`,
        task_type: 'one_time',
        category: 'admin',
        priority: task.priority,
      },
      createdBy,
    )
    taskCount++
  }

  // Store action items in structured_notes
  const existingResult = await query<{ structured_notes: StructuredNotes | null }>(
    `SELECT structured_notes FROM ${TABLE_NAMES.MEETING_PROTOCOLS} WHERE id = $1`,
    [protocolId]
  )

  const existingNotes = existingResult.rows[0]?.structured_notes
  const updatedNotes: StructuredNotes = {
    summary: existingNotes?.summary || 'Aufgaben importiert',
    detected_attendees: existingNotes?.detected_attendees || [],
    topics: existingNotes?.topics || [],
    action_items: [...(existingNotes?.action_items || []), ...actionItems],
    follow_ups: existingNotes?.follow_ups || [],
  }

  await query(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET structured_notes = $2::jsonb,
         processing_model = $3,
         status = 'review'
     WHERE id = $1`,
    [protocolId, JSON.stringify(updatedNotes), model || 'json-import']
  )

  logger.info('Tasks imported', {
    protocolId,
    taskCount,
    source,
    model,
  })

  return { success: true, taskCount, model, source }
}

// =============================================================================
// ATTENDEE NAME RESOLUTION
// =============================================================================

/**
 * Fuzzy match detected attendee names against users table
 */
async function resolveAttendeeNames(notes: StructuredNotes): Promise<StructuredNotes> {
  if (!notes.detected_attendees || notes.detected_attendees.length === 0) {
    return notes
  }

  try {
    // Get all staff users
    const usersResult = await query<{ id: string; name: string }>(
      `SELECT id, name FROM ${TABLE_NAMES.USERS} WHERE name IS NOT NULL`
    )

    if (usersResult.rows.length === 0) return notes

    const users = usersResult.rows

    // For each action item with assigned_to_name, try to find matching user
    const resolvedActionItems = notes.action_items.map(item => {
      if (!item.assigned_to_name || item.assigned_to_id) return item

      const match = users.find(u => {
        const userName = u.name.toLowerCase()
        const assignedName = item.assigned_to_name!.toLowerCase()
        // Match on first name or full name
        return userName.includes(assignedName) ||
          assignedName.includes(userName.split(' ')[0])
      })

      if (match) {
        return { ...item, assigned_to_id: match.id }
      }
      return item
    })

    return { ...notes, action_items: resolvedActionItems }
  } catch (error) {
    logger.warn('Error resolving attendee names', { error })
    return notes
  }
}

// =============================================================================
// FINALIZE
// =============================================================================

/**
 * Mark protocol as finalized
 */
export async function finalizeProtocol(
  id: string,
): Promise<boolean> {
  const result = await query(
    `UPDATE ${TABLE_NAMES.MEETING_PROTOCOLS}
     SET status = 'finalized'
     WHERE id = $1 AND status = 'review'
     RETURNING id`,
    [id]
  )
  return result.rows.length > 0
}

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
    `SELECT is_closed FROM ${TABLE_NAMES.DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  if (outcomeResult.rows[0]?.is_closed) {
    throw new Error('DECISION_ALREADY_CLOSED')
  }

  // Check existing vote
  const existingVote = await query<{ vote_type: string }>(
    `SELECT vote_type FROM ${TABLE_NAMES.DECISION_VOTES}
     WHERE protocol_id = $1 AND action_item_id = $2 AND voter_id = $3`,
    [protocolId, actionItemId, voterId]
  )

  let action: 'added' | 'changed' | 'removed'

  if (existingVote.rows.length > 0) {
    if (existingVote.rows[0].vote_type === voteType) {
      // Same vote → remove (toggle off)
      await query(
        `DELETE FROM ${TABLE_NAMES.DECISION_VOTES}
         WHERE protocol_id = $1 AND action_item_id = $2 AND voter_id = $3`,
        [protocolId, actionItemId, voterId]
      )
      action = 'removed'
    } else {
      // Different vote → change
      await query(
        `UPDATE ${TABLE_NAMES.DECISION_VOTES}
         SET vote_type = $4
         WHERE protocol_id = $1 AND action_item_id = $2 AND voter_id = $3`,
        [protocolId, actionItemId, voterId, voteType]
      )
      action = 'changed'
    }
  } else {
    // New vote
    await query(
      `INSERT INTO ${TABLE_NAMES.DECISION_VOTES} (protocol_id, action_item_id, voter_id, vote_type)
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
     FROM ${TABLE_NAMES.DECISION_VOTES}
     WHERE protocol_id = $1 AND action_item_id = $2
     GROUP BY vote_type`,
    [protocolId, actionItemId]
  )

  const votesUp = parseInt(countResult.rows.find(r => r.vote_type === 'up')?.cnt || '0')
  const votesDown = parseInt(countResult.rows.find(r => r.vote_type === 'down')?.cnt || '0')

  // Upsert outcome with counts
  await query(
    `INSERT INTO ${TABLE_NAMES.DECISION_OUTCOMES} (protocol_id, action_item_id, votes_up, votes_down)
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
      `SELECT is_closed, result FROM ${TABLE_NAMES.DECISION_OUTCOMES}
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
     FROM ${TABLE_NAMES.DECISION_VOTES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  const totalVoters = parseInt(voterCount.rows[0]?.cnt || '0')

  if (totalVoters >= attendees.length) {
    // All voted, auto-close
    return closeDecisionInternal(protocolId, actionItemId, null)
  }

  const outcome = await query<{ is_closed: boolean; result: string }>(
    `SELECT is_closed, result FROM ${TABLE_NAMES.DECISION_OUTCOMES}
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
    `SELECT votes_up, votes_down FROM ${TABLE_NAMES.DECISION_OUTCOMES}
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  const votesUp = outcome.rows[0]?.votes_up || 0
  const votesDown = outcome.rows[0]?.votes_down || 0
  const result = votesUp > votesDown ? 'approved' : 'rejected'

  await query(
    `UPDATE ${TABLE_NAMES.DECISION_OUTCOMES}
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
    `SELECT is_closed FROM ${TABLE_NAMES.DECISION_OUTCOMES}
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
    `SELECT votes_up, votes_down FROM ${TABLE_NAMES.DECISION_OUTCOMES}
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
      `SELECT * FROM ${TABLE_NAMES.DECISION_VOTES} WHERE protocol_id = $1 ORDER BY created_at`,
      [protocolId]
    ),
    query<DecisionOutcomeRecord>(
      `SELECT * FROM ${TABLE_NAMES.DECISION_OUTCOMES} WHERE protocol_id = $1`,
      [protocolId]
    ),
  ])

  return {
    votes: votesResult.rows,
    outcomes: outcomesResult.rows,
  }
}

/**
 * Generate AI task proposals for an approved decision.
 */
export async function generateTaskProposals(
  protocolId: string,
  actionItemId: string,
): Promise<{ proposals: ProposedTask[]; model: string }> {
  // Get outcome — must be closed and approved
  const outcomeResult = await query<DecisionOutcomeRecord>(
    `SELECT * FROM ${TABLE_NAMES.DECISION_OUTCOMES}
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
    `UPDATE ${TABLE_NAMES.DECISION_OUTCOMES}
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
    `SELECT * FROM ${TABLE_NAMES.DECISION_OUTCOMES}
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
    `UPDATE ${TABLE_NAMES.DECISION_OUTCOMES}
     SET tasks_created = true, updated_at = NOW()
     WHERE protocol_id = $1 AND action_item_id = $2`,
    [protocolId, actionItemId]
  )

  logger.info('Decision tasks created', {
    protocolId, actionItemId, taskCount: taskIds.length,
  })

  return { taskCount: taskIds.length, taskIds }
}
