/**
 * TimecardsClient — internal types extracted for clarity.
 *
 * Kept colocated with the only consumer (TimecardsClient) since these
 * shapes describe UI state, not a domain contract used elsewhere.
 */

import type { TimecardStatus } from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'

export type PeriodMode = 'month' | 'week'

export interface TimecardAIResult {
  entries?: TimecardEntryInput[]
  notes?: string
}

export interface DraftState {
  entries: TimecardEntryInput[]
  notes: string
  status: TimecardStatus
  selectedDate: string
}
