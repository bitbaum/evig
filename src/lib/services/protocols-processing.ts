/**
 * Meeting Protocols — AI Processing (transcript, notes, task import)
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { meetingProtocols } from '@/db/schema/misc'
import { users } from '@/db/schema/auth'
import { PROTOCOL_STATUS } from '@/config/protocol-status'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { MEETING_TYPE_LABELS, MEETING_TYPE_TEMPLATES } from '@/config/protocols'
import { PROTOCOL_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { processProtocolTranscript, processProtocolNotes, processTaskList } from '@/lib/ai/protocol-processing'
import { logger } from '@/lib/logger'
import type { MeetingType } from '@/config/protocols'
import type { StructuredNotes } from '@/lib/schemas/protocols'
import { structuredNotesSchema, parsedTaskListSchema } from '@/lib/schemas/protocols'
import { linkActionItemToTask } from './protocols-linking'

// Table name refs
const mpTable = getTableName(meetingProtocols)
const uTable = getTableName(users)

type UserRow = { id: string; name: string }

/**
 * Fetch all users with names for roster injection into AI prompts.
 * Returns first names for the prompt string and full rows for post-processing.
 */
async function getTeamRoster(): Promise<{ promptString: string; userRows: UserRow[] }> {
  try {
    const result = await db.execute(sql`SELECT id, name FROM ${sql.raw(uTable)} WHERE name IS NOT NULL`)
    const userRows = result.rows as unknown as UserRow[]
    const firstNames = userRows.map(u => u.name.split(' ')[0]).filter(Boolean)
    return { promptString: firstNames.join(', ') || 'Unbekannt', userRows }
  } catch {
    return { promptString: 'Unbekannt', userRows: [] }
  }
}

/**
 * Fuzzy-match an AI-extracted name against known users.
 * Matches on: exact first name, one being a prefix of the other (≥3 chars).
 */
function fuzzyMatchUser(aiName: string, userRows: UserRow[]): UserRow | undefined {
  const normalized = aiName.toLowerCase().trim()
  return userRows.find(u => {
    const firstName = u.name.split(' ')[0].toLowerCase()
    return firstName === normalized ||
      (normalized.length >= 3 && firstName.startsWith(normalized)) ||
      (firstName.length >= 3 && normalized.startsWith(firstName))
  })
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
): Promise<{
  success: boolean
  model?: string
  error?: string
  retryable?: boolean
  code?: 'PROTOCOL_NOT_FOUND' | 'NO_PROVIDER' | 'INVALID_JSON' | 'INVALID_SCHEMA' | 'UNKNOWN'
}> {
  const resetToDraft = async () => {
    await db.execute(sql`
      UPDATE ${sql.raw(mpTable)}
      SET status = ${PROTOCOL_STATUS.DRAFT}
      WHERE id = ${protocolId}
    `)
  }

  try {
    // Set status to processing
    await db.execute(sql`
      UPDATE ${sql.raw(mpTable)}
      SET status = ${PROTOCOL_STATUS.PROCESSING}, raw_transcript = ${rawTranscript}
      WHERE id = ${protocolId}
    `)

    // Get protocol metadata for prompt context
    const protocolResult = await db.execute(sql`
      SELECT meeting_type FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
    `)

    if (protocolResult.rows.length === 0) {
      await resetToDraft()
      return { success: false, code: 'PROTOCOL_NOT_FOUND', retryable: false, error: ERROR_MESSAGES.PROTOCOL_NOT_FOUND }
    }

    const { meeting_type } = protocolResult.rows[0] as unknown as { meeting_type: MeetingType }
    const template = MEETING_TYPE_TEMPLATES[meeting_type]
    const meetingTypeLabel = MEETING_TYPE_LABELS[meeting_type]

    // Fetch team roster — grounds the LLM in real names so it doesn't hallucinate variants
    const { promptString: knownAttendees, userRows } = await getTeamRoster()

    // Build prompt
    const prompt = fillPromptTemplate(PROTOCOL_PROMPTS.extract, {
      transcript: rawTranscript,
      meetingType: meetingTypeLabel,
      agendaHints: template.agenda_hints.join(', ') || 'Keine',
      knownAttendees,
      schema: PROTOCOL_PROMPTS.schema,
    })

    // Call AI module
    const aiResult = await processProtocolTranscript(prompt)

    if (!aiResult.success) {
      await resetToDraft()
      return {
        success: false,
        code: aiResult.failure.code,
        retryable: aiResult.failure.retryable,
        error: aiResult.failure.error,
      }
    }

    // Normalize attendee names + resolve action item assignments against real user DB
    const resolvedNotes = resolveAttendeeNames(aiResult.result.notes, userRows)

    // Store results
    await db.execute(sql`
      UPDATE ${sql.raw(mpTable)}
      SET structured_notes = ${JSON.stringify(resolvedNotes)}::jsonb,
          processing_model = ${aiResult.result.model},
          status = ${PROTOCOL_STATUS.REVIEW}
      WHERE id = ${protocolId}
    `)

    logger.info('Protocol transcript processed', {
      protocolId,
      model: aiResult.result.model,
      topicCount: resolvedNotes.topics.length,
      actionItemCount: resolvedNotes.action_items.length,
    })

    return { success: true, model: aiResult.result.model }
  } catch (error) {
    logger.error('Unexpected error while processing protocol transcript', { protocolId, error })
    await resetToDraft()
    return {
      success: false,
      code: 'UNKNOWN',
      retryable: true,
      error: 'Unerwarteter Fehler bei der Verarbeitung. Bitte erneut versuchen.',
    }
  }
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
      const { userRows } = await getTeamRoster()
      const resolvedNotes = resolveAttendeeNames(validated.data, userRows)

      await db.execute(sql`
        UPDATE ${sql.raw(mpTable)}
        SET structured_notes = ${JSON.stringify(resolvedNotes)}::jsonb,
            processing_model = 'json-import',
            status = ${PROTOCOL_STATUS.REVIEW}
        WHERE id = ${protocolId}
      `)

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
  await db.execute(sql`
    UPDATE ${sql.raw(mpTable)}
    SET status = ${PROTOCOL_STATUS.PROCESSING}
    WHERE id = ${protocolId}
  `)

  const protocolResult = await db.execute(sql`
    SELECT meeting_type FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
  `)

  if (protocolResult.rows.length === 0) {
    return { success: false, error: ERROR_MESSAGES.PROTOCOL_NOT_FOUND }
  }

  const { meeting_type } = protocolResult.rows[0] as unknown as { meeting_type: MeetingType }
  const template = MEETING_TYPE_TEMPLATES[meeting_type]
  const meetingTypeLabel = MEETING_TYPE_LABELS[meeting_type]

  const { promptString: knownAttendees, userRows } = await getTeamRoster()

  const prompt = fillPromptTemplate(PROTOCOL_PROMPTS.structureNotes, {
    notes: content,
    meetingType: meetingTypeLabel,
    agendaHints: template.agenda_hints.join(', ') || 'Keine',
    knownAttendees,
    schema: PROTOCOL_PROMPTS.schema,
  })

  const aiResult = await processProtocolNotes(prompt)

  if (!aiResult) {
    await db.execute(sql`
      UPDATE ${sql.raw(mpTable)}
      SET status = ${PROTOCOL_STATUS.DRAFT}
      WHERE id = ${protocolId}
    `)
    return { success: false, error: 'KI-Verarbeitung der Notizen fehlgeschlagen. Kein Provider erreichbar. Details im Server-Log.' }
  }

  const resolvedNotes = resolveAttendeeNames(aiResult.notes, userRows)

  await db.execute(sql`
    UPDATE ${sql.raw(mpTable)}
    SET structured_notes = ${JSON.stringify(resolvedNotes)}::jsonb,
        processing_model = ${aiResult.model},
        status = ${PROTOCOL_STATUS.REVIEW}
    WHERE id = ${protocolId}
  `)

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
      return { success: false, error: 'KI-Verarbeitung der Aufgabenliste fehlgeschlagen. Kein Provider erreichbar. Details im Server-Log.' }
    }

    tasks = aiResult.tasks
    model = aiResult.model
    source = 'ai'
  }

  if (tasks.length === 0) {
    return { success: false, error: 'Keine Aufgaben erkannt' }
  }

  // Resolve assigned names to user IDs
  const usersResult = await db.execute(sql`
    SELECT id, name FROM ${sql.raw(uTable)} WHERE name IS NOT NULL
  `)
  const userRows = usersResult.rows as unknown as Array<{ id: string; name: string }>

  // Build action items for structured_notes and create system tasks
  const actionItems = []
  let taskCount = 0

  for (const task of tasks) {
    const actionItemId = crypto.randomUUID()

    // Fuzzy match assigned_to_name -> user ID
    let assignedToId: string | null = null
    if (task.assigned_to_name) {
      const match = userRows.find(u => {
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
        assigned_to: assignedToId,
      },
      createdBy,
    )
    taskCount++
  }

  // Store action items in structured_notes
  const existingResult = await db.execute(sql`
    SELECT structured_notes FROM ${sql.raw(mpTable)} WHERE id = ${protocolId}
  `)

  const existingRow = existingResult.rows[0] as unknown as { structured_notes: StructuredNotes | null } | undefined
  const existingNotes = existingRow?.structured_notes
  const updatedNotes: StructuredNotes = {
    summary: existingNotes?.summary || 'Aufgaben importiert',
    detected_attendees: existingNotes?.detected_attendees || [],
    topics: existingNotes?.topics || [],
    action_items: [...(existingNotes?.action_items || []), ...actionItems],
    follow_ups: existingNotes?.follow_ups || [],
  }

  await db.execute(sql`
    UPDATE ${sql.raw(mpTable)}
    SET structured_notes = ${JSON.stringify(updatedNotes)}::jsonb,
        processing_model = ${model || 'json-import'},
        status = ${PROTOCOL_STATUS.REVIEW}
    WHERE id = ${protocolId}
  `)

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
 * Match AI-extracted attendee names against real users.
 * Normalizes detected_attendees to canonical DB names and resolves action item assignments.
 * Synchronous — caller passes userRows fetched during roster lookup.
 */
function resolveAttendeeNames(notes: StructuredNotes, userRows: UserRow[]): StructuredNotes {
  if (userRows.length === 0) return notes

  // Normalize detected_attendees: snap AI-guessed names to canonical first names
  const normalizedAttendees = (notes.detected_attendees ?? []).map(aiName => {
    const match = fuzzyMatchUser(aiName, userRows)
    return match ? match.name.split(' ')[0] : aiName
  })

  // Resolve action item assignments: set assigned_to_id where we find a match
  const resolvedActionItems = notes.action_items.map(item => {
    if (!item.assigned_to_name || item.assigned_to_id) return item
    const match = fuzzyMatchUser(item.assigned_to_name, userRows)
    if (!match) return item
    return {
      ...item,
      assigned_to_name: match.name.split(' ')[0],
      assigned_to_id: match.id,
    }
  })

  return { ...notes, detected_attendees: normalizedAttendees, action_items: resolvedActionItems }
}
