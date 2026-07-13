import { z } from 'zod'
import {
  DELIVERABLE_TYPES,
  DELIVERABLE_STATUSES,
  DELIVERABLE_VISIBILITY,
  FEEDBACK_KINDS,
  FEEDBACK_STATUSES,
  type DeliverableType,
  type DeliverableStatus,
  type DeliverableVisibility,
  type FeedbackKind,
  type FeedbackStatus,
} from '@/config/deliverables'

// Enums as tuples for z.enum (derived from config — never hand-listed)
const types = Object.values(DELIVERABLE_TYPES) as [string, ...string[]]
const statuses = Object.values(DELIVERABLE_STATUSES) as [string, ...string[]]
const visibilities = Object.values(DELIVERABLE_VISIBILITY) as [string, ...string[]]
const feedbackKinds = Object.values(FEEDBACK_KINDS) as [string, ...string[]]
const feedbackStatuses = Object.values(FEEDBACK_STATUSES) as [string, ...string[]]

// ---- Deliverable create / update -------------------------------------------

export const createDeliverableSchema = z.object({
  title: z.string().min(1, 'Titel erforderlich').max(200, 'Titel zu lang (max 200 Zeichen)'),
  description: z.string().max(2000, 'Beschreibung zu lang').optional().nullable(),
  type: z.enum(types).default('other'),
  url: z.string().max(1000, 'URL zu lang').optional().nullable(),
  source_path: z.string().max(500, 'Pfad zu lang').optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  visibility: z.enum(visibilities).default('team'),
  status: z.enum(statuses).default('draft'),
})

export const updateDeliverableSchema = createDeliverableSchema.partial().extend({
  current_version: z.number().int().min(1).optional(),
})

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>

// ---- Feedback --------------------------------------------------------------

/** Internal (logged-in staff) feedback. */
export const createFeedbackSchema = z.object({
  kind: z.enum(feedbackKinds).default('comment'),
  body: z.string().min(1, 'Text erforderlich').max(4000, 'Text zu lang'),
  target: z.string().max(200).optional().nullable(),
})

/** External (share-link, no login) feedback — requires a display name. */
export const createPublicFeedbackSchema = createFeedbackSchema.extend({
  author_name: z.string().min(1, 'Name erforderlich').max(120, 'Name zu lang'),
})

/** Resolve a change_request item. */
export const updateFeedbackSchema = z.object({
  feedback_id: z.string().uuid(),
  status: z.enum(feedbackStatuses),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
export type CreatePublicFeedbackInput = z.infer<typeof createPublicFeedbackSchema>
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>

// ---- Ask Hirn (context-aware Q&A) ------------------------------------------

export const askDeliverableSchema = z.object({
  message: z.string().min(1, 'Frage erforderlich').max(2000, 'Frage zu lang'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
})

export type AskDeliverableInput = z.infer<typeof askDeliverableSchema>

// ---- Row shapes (SSOT for data returned to pages) --------------------------

export interface DeliverableListItem {
  id: string
  title: string
  description: string | null
  type: DeliverableType
  status: DeliverableStatus
  visibility: DeliverableVisibility
  url: string | null
  current_version: number
  owner_name: string | null
  open_feedback_count: number
  created_at: string
  updated_at: string
}

export interface FeedbackItem {
  id: string
  kind: FeedbackKind
  status: FeedbackStatus
  target: string | null
  body: string
  author_user_id: string | null
  author_name: string | null
  created_at: string
}

export interface DeliverableDetail {
  id: string
  title: string
  description: string | null
  type: DeliverableType
  status: DeliverableStatus
  visibility: DeliverableVisibility
  url: string | null
  source_path: string | null
  task_id: string | null
  task_title: string | null
  share_token: string | null
  current_version: number
  files: { name: string; url: string }[]
  delivered_at: string | null
  owner_user_id: string
  owner_name: string | null
  owner_email: string | null
  created_at: string
  updated_at: string
}
