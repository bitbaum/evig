/**
 * Time-off request validation schemas (Zod). Types derive from the schemas so
 * API and UI share one contract.
 */

import { z } from 'zod'
import {
  TIME_OFF_KIND_OPTIONS,
  TIME_OFF_STATUSES,
  TIME_OFF_LIMITS,
} from '@/config/time-off'

const kinds = TIME_OFF_KIND_OPTIONS as [string, ...string[]]
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT')

export const createTimeOffSchema = z
  .object({
    kind: z.enum(kinds),
    starts_on: isoDate,
    ends_on: isoDate,
    half_day: z.boolean().default(false),
    note: z.string().max(TIME_OFF_LIMITS.MAX_NOTE_LENGTH).optional().nullable(),
  })
  .refine(d => d.ends_on >= d.starts_on, {
    message: 'Das Enddatum muss am oder nach dem Startdatum liegen.',
    path: ['ends_on'],
  })

export const reviewTimeOffSchema = z.object({
  status: z.enum([TIME_OFF_STATUSES.APPROVED, TIME_OFF_STATUSES.REJECTED]),
  review_notes: z.string().max(TIME_OFF_LIMITS.MAX_REVIEW_NOTE_LENGTH).optional().nullable(),
})

export type CreateTimeOffInput = z.infer<typeof createTimeOffSchema>
export type ReviewTimeOffInput = z.infer<typeof reviewTimeOffSchema>

export interface TimeOffRequest {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  kind: string
  starts_on: string
  ends_on: string
  half_day: boolean
  note: string | null
  status: string
  reviewed_by: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
}
