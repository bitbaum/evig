/** Shared row + filter types for the approval queue slice (parent owns state; sub-components consume). */

import { TIMECARD_STATUSES } from '@/config/timecards'

export interface ApprovalRow {
  id: string
  user_id: string
  team_profile_id: string | null
  user_name: string | null
  user_email: string
  department: string | null
  position: string | null
  employment_type: string | null
  period_type: string
  period_start: string
  period_end: string
  status: string
  total_minutes: number
  submitted_at: string | null
}

export type PeriodFilter = 'all' | 'week' | 'month'
export type StatusFilter = typeof TIMECARD_STATUSES.SUBMITTED | typeof TIMECARD_STATUSES.APPROVED
