import { db } from '@/db'
import { tasks } from '@/db/schema'
import { TASK_TYPES, TASK_CATEGORIES, TASK_PRIORITIES } from '@/config/tasks'
import { DECISION_TYPES, VOTING_METHODS } from '@/config/decisions'
import { MEETING_TYPES, PROTOCOL_VISIBILITY } from '@/config/protocols'
import { createTaskSchema } from '@/lib/schemas/tasks'
import { createDecisionSchema } from '@/lib/schemas/decisions'
import { createProtocolSchema } from '@/lib/schemas/protocols'
import { createDecision } from '@/lib/services/decisions'
import { createProtocol } from '@/lib/services/protocols'
import { logger } from '@/lib/logger'
import {
  type ExecuteActionInput,
  isRiskyAction,
} from './action-executor-contracts'

/** Coerce AI-generated task payload to match schema enums.
 *  The LLM doesn't know exact enum values — apply sensible defaults. */
function coerceTaskPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const validTypes: ReadonlySet<string> = new Set(Object.values(TASK_TYPES))
  const validCategories: ReadonlySet<string> = new Set(Object.values(TASK_CATEGORIES))
  const validPriorities: ReadonlySet<string> = new Set(Object.values(TASK_PRIORITIES))

  const taskType = validTypes.has(String(payload.task_type ?? ''))
    ? payload.task_type
    : TASK_TYPES.ONE_TIME
  const category = validCategories.has(String(payload.category ?? ''))
    ? payload.category
    : TASK_CATEGORIES.ADMIN
  const priority = validPriorities.has(String(payload.priority ?? ''))
    ? payload.priority
    : TASK_PRIORITIES.NORMAL

  return { ...payload, task_type: taskType, category, priority }
}

/** Coerce AI-generated decision payload to match schema enums. */
function coerceDecisionPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const validDecisionTypes: ReadonlySet<string> = new Set(DECISION_TYPES)
  const validVotingMethods: ReadonlySet<string> = new Set(VOTING_METHODS)

  const decisionType = validDecisionTypes.has(String(payload.decisionType ?? ''))
    ? payload.decisionType
    : 'sense_check'
  const votingMethod = validVotingMethods.has(String(payload.votingMethod ?? ''))
    ? payload.votingMethod
    : 'consent'

  return { ...payload, decisionType, votingMethod }
}

/** Coerce AI-generated protocol payload to match schema enums. */
function coerceProtocolPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const validMeetingTypes: ReadonlySet<string> = new Set(Object.values(MEETING_TYPES))
  const validVisibility: ReadonlySet<string> = new Set(Object.values(PROTOCOL_VISIBILITY))

  const meetingType = validMeetingTypes.has(String(payload.meeting_type ?? ''))
    ? payload.meeting_type
    : MEETING_TYPES.AD_HOC
  const visibility = validVisibility.has(String(payload.visibility ?? ''))
    ? payload.visibility
    : PROTOCOL_VISIBILITY.TEAM

  // Ensure meeting_date is present — default to today
  const meetingDate = payload.meeting_date || new Date().toISOString().split('T')[0]

  // LLM may send "participants" instead of "attendees", and names instead of UUIDs.
  // Strip non-UUID entries — attendees schema requires uuid[] and defaults to [].
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const rawAttendees = payload.attendees ?? payload.participants ?? []
  const attendees = Array.isArray(rawAttendees)
    ? rawAttendees.filter((a): a is string => typeof a === 'string' && UUID_RE.test(a))
    : []

  return { ...payload, meeting_type: meetingType, visibility, meeting_date: meetingDate, attendees }
}

export async function executeHirnAction(input: ExecuteActionInput, dbUserId: string) {
  if (isRiskyAction(input.actionType) && input.dryRun) {
    return {
      mode: 'dry-run' as const,
      preview: buildPreview(input.actionType, input.payload),
      suggestedNextStep: 'Wenn alles passt, klick uf «Jetzt usfüehre».',
    }
  }

  switch (input.actionType) {
    case 'create_task': {
      const parsed = createTaskSchema.safeParse(coerceTaskPayload(input.payload))
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Task-Date')
      }

      const [task] = await db
        .insert(tasks)
        .values({
          title: parsed.data.title,
          description: parsed.data.description || null,
          instructions: parsed.data.instructions || null,
          taskType: parsed.data.task_type,
          scheduleCron: parsed.data.schedule_cron || null,
          scheduleHuman: parsed.data.schedule_human || null,
          category: parsed.data.category,
          tags: parsed.data.tags || [],
          priority: parsed.data.priority,
          estimatedMinutes: parsed.data.estimated_minutes || null,
          projectId: parsed.data.project_id || null,
          createdBy: dbUserId,
        })
        .returning({ id: tasks.id, title: tasks.title })

      return {
        mode: 'executed' as const,
        entity: { type: 'task', id: task.id, title: task.title, link: `/admin/tasks/${task.id}` },
        suggestedNextStep: 'Wötsch grad Verantwortlichi oder Fälligkeit ergänze?',
      }
    }

    case 'create_decision_draft': {
      const parsed = createDecisionSchema.safeParse(coerceDecisionPayload(input.payload))
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Entscheid-Date')
      }

      const decision = await createDecision({ ...parsed.data, initialStatus: 'draft' }, dbUserId)
      return {
        mode: 'executed' as const,
        entity: { type: 'decision', id: decision.id, title: decision.title, link: `/admin/decisions/${decision.id}` },
        suggestedNextStep: 'Lad Teilnehmer:innen ii oder starte d Diskussionsphase.',
      }
    }

    case 'create_protocol_draft': {
      const parsed = createProtocolSchema.safeParse(coerceProtocolPayload(input.payload))
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Protokoll-Date')
      }

      const protocol = await createProtocol(parsed.data, dbUserId)
      return {
        mode: 'executed' as const,
        entity: { type: 'protocol', id: protocol.id, title: parsed.data.title, link: `/admin/protocols/${protocol.id}` },
        suggestedNextStep: 'Füeg jetzt Notize oder es Transkript fürs Processing hinzu.',
      }
    }

    case 'navigate': {
      const url = typeof input.payload.url === 'string' ? input.payload.url : '/admin'
      return {
        mode: 'navigate' as const,
        url,
        suggestedNextStep: null,
      }
    }
  }
}

function buildPreview(actionType: ExecuteActionInput['actionType'], payload: Record<string, unknown>) {
  return {
    title: 'Aktion wird vorbereitet',
    fields: payload,
  }
}
