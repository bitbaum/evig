/**
 * Timecard Validation Schemas
 *
 * Zod schemas for staff timecard drafts, submission, and review workflows.
 * Types are derived from the schemas so UI/API layers share one contract.
 */

import { z } from 'zod'
import {
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_ENTRY_SOURCE_OPTIONS,
  TIMECARD_LIMITS,
  TIMECARD_PERIOD_TYPE_OPTIONS,
  TIMECARD_STATUS_OPTIONS,
  TIMECARD_STATUSES,
} from '@/config/timecards'

const timecardStatuses = TIMECARD_STATUS_OPTIONS as [string, ...string[]]
const timecardEntryCategories = TIMECARD_ENTRY_CATEGORY_OPTIONS as [string, ...string[]]
const timecardEntrySources = TIMECARD_ENTRY_SOURCE_OPTIONS as [string, ...string[]]
const timecardPeriodTypes = TIMECARD_PERIOD_TYPE_OPTIONS as [string, ...string[]]
const timecardReviewStatuses = [TIMECARD_STATUSES.APPROVED, TIMECARD_STATUSES.REJECTED] as const

export const timecardEntrySchema = z.object({
  id: z.string().uuid().optional(),
  work_date: z.string().min(1),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  break_minutes: z.number().int().min(0).max(TIMECARD_LIMITS.MAX_DAILY_MINUTES).default(0),
  duration_minutes: z
    .number()
    .int()
    .min(TIMECARD_LIMITS.MIN_ENTRY_MINUTES)
    .max(TIMECARD_LIMITS.MAX_ENTRY_MINUTES),
  category: z.enum(timecardEntryCategories).default('other'),
  description: z.string().max(TIMECARD_LIMITS.MAX_DESCRIPTION_LENGTH).optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  protocol_id: z.string().uuid().optional().nullable(),
  source: z.enum(timecardEntrySources).default('manual'),
})

export const timecardDraftSchema = z.object({
  user_id: z.string().uuid().optional(),
  period_type: z.enum(timecardPeriodTypes).default('week'),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  status: z.enum(timecardStatuses).default(TIMECARD_STATUSES.DRAFT),
  notes: z.string().max(TIMECARD_LIMITS.MAX_NOTE_LENGTH).optional().nullable(),
  entries: z.array(timecardEntrySchema).max(TIMECARD_LIMITS.MAX_PERIOD_ENTRIES).default([]),
})

export const submitTimecardSchema = z.object({
  notes: z.string().max(TIMECARD_LIMITS.MAX_NOTE_LENGTH).optional().nullable(),
})

export const reviewTimecardSchema = z.object({
  status: z.enum([TIMECARD_STATUSES.APPROVED, TIMECARD_STATUSES.REJECTED]),
  review_notes: z.string().max(TIMECARD_LIMITS.MAX_REVIEW_NOTE_LENGTH).optional().nullable(),
})

export const timecardAssistSchema = z.object({
  prompt: z.string().min(1).max(TIMECARD_LIMITS.MAX_AI_PROMPT_LENGTH),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  current_entries: z.array(timecardEntrySchema).max(TIMECARD_LIMITS.MAX_PERIOD_ENTRIES).optional().default([]),
})

export const timecardFilterSchema = z.object({
  user_id: z.string().uuid().optional(),
  status: z.enum([...timecardStatuses, 'all'] as [string, ...string[]]).optional().default('all'),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
})

export const timecardPeriodQuerySchema = z.object({
  period_type: z.enum(timecardPeriodTypes).optional().default('month'),
  period_date: z.string().optional(),
})

export const timecardSaveSchema = z.object({
  period_type: z.enum(timecardPeriodTypes).default('month'),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  notes: z.string().max(TIMECARD_LIMITS.MAX_NOTE_LENGTH).optional().nullable(),
  entries: z.array(timecardEntrySchema).max(TIMECARD_LIMITS.MAX_PERIOD_ENTRIES),
})

export const timecardReviewActionSchema = z.object({
  status: z.enum(timecardReviewStatuses),
  review_notes: z.string().max(TIMECARD_LIMITS.MAX_REVIEW_NOTE_LENGTH).optional().nullable(),
})

export const timecardBulkReviewSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(timecardReviewStatuses),
  review_notes: z.string().max(TIMECARD_LIMITS.MAX_REVIEW_NOTE_LENGTH).optional().nullable(),
})

export type TimecardEntryInput = z.infer<typeof timecardEntrySchema>
export type TimecardDraftInput = z.infer<typeof timecardDraftSchema>
export type SubmitTimecardInput = z.infer<typeof submitTimecardSchema>
export type ReviewTimecardInput = z.infer<typeof reviewTimecardSchema>
export type TimecardAssistInput = z.infer<typeof timecardAssistSchema>
export type TimecardFilter = z.infer<typeof timecardFilterSchema>
export type TimecardPeriodQuery = z.infer<typeof timecardPeriodQuerySchema>
export type TimecardSaveInput = z.infer<typeof timecardSaveSchema>
export type TimecardReviewActionInput = z.infer<typeof timecardReviewActionSchema>

export interface TimecardEntry {
  id: string
  timecard_id: string
  user_id: string
  work_date: string
  start_time: string | null
  end_time: string | null
  break_minutes: number
  duration_minutes: number
  category: string
  description: string | null
  task_id: string | null
  protocol_id: string | null
  source: string
  created_at: string
  updated_at: string
}

export interface Timecard {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  period_type: string
  period_start: string
  period_end: string
  status: string
  notes: string | null
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  total_minutes: number
  created_at: string
  updated_at: string
  entries: TimecardEntry[]
}

export function validateTimecardDraft(data: unknown) {
  return timecardDraftSchema.safeParse(data)
}

export function validateSubmitTimecard(data: unknown) {
  return submitTimecardSchema.safeParse(data)
}

export function validateReviewTimecard(data: unknown) {
  return reviewTimecardSchema.safeParse(data)
}

export function validateTimecardAssist(data: unknown) {
  return timecardAssistSchema.safeParse(data)
}
