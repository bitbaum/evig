/**
 * Pure helpers for TimecardsClient draft state.
 *
 * Extracted from the main component to keep the render scope focused.
 * No React dependency — these are testable in isolation.
 */

import { TIMECARD_STATUSES } from '@/config/timecards'
import type { Timecard, TimecardEntryInput } from '@/lib/schemas/timecards'
import type { DraftState } from './types'

export function createDraft(entries: TimecardEntryInput[], selectedDate: string): DraftState {
  return {
    entries,
    notes: '',
    status: TIMECARD_STATUSES.DRAFT,
    selectedDate,
  }
}

export function toDraftState(timecard: Timecard, fallbackSelectedDate: string): DraftState {
  return {
    entries: timecard.entries,
    notes: timecard.notes ?? '',
    status: timecard.status as DraftState['status'],
    selectedDate:
      timecard.entries.find(entry => entry.work_date === fallbackSelectedDate)?.work_date ||
      timecard.entries[0]?.work_date ||
      fallbackSelectedDate,
  }
}
