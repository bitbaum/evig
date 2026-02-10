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
import { processProtocolTranscript } from '@/lib/ai/protocol-processing'
import { logger } from '@/lib/logger'
import type { MeetingType } from '@/config/protocols'
import type {
  ProtocolListItem,
  ProtocolDetail,
  ActionLinkRecord,
  StructuredNotes,
  CreateProtocolInput,
  UpdateProtocolInput,
} from '@/lib/schemas/protocols'

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
      title, meeting_date, meeting_type, visibility, attendees, created_by
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
    RETURNING id`,
    [
      data.title,
      data.meeting_date,
      data.meeting_type,
      data.visibility,
      JSON.stringify(data.attendees || []),
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
      t.current_status as linked_task_status
    FROM ${TABLE_NAMES.PROTOCOL_ACTION_LINKS} pal
    LEFT JOIN ${TABLE_NAMES.TASKS} t ON pal.linked_task_id = t.id
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
