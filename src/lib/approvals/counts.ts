import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { TIMECARD_STATUSES } from '@/config/timecards'
import { TIME_OFF_STATUSES } from '@/config/time-off'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'

export interface ApprovalCount {
  pending: number
  oldestAt: string | null
  /** Count query failed — surface it instead of a misleading "0". */
  failed: boolean
}

export type ApprovalCounts = Record<string, ApprovalCount>

/**
 * One count descriptor per approval source (keyed to APPROVAL_SOURCES). Status is
 * a BOUND PARAMETER ($1), never string-interpolated — the previous approvals page
 * inlined the status literal into the SQL. Table names come from TABLE_NAMES (or
 * a vetted literal where a table isn't registered there, e.g. `timecards`).
 */
const COUNT_DESCRIPTORS: Record<string, { table: string; statusColumn: string; pendingValue: string; timeColumn: string }> = {
  blog: { table: TABLE_NAMES.BLOG_SUBMISSIONS, statusColumn: 'status', pendingValue: APPROVAL_STATUS.PENDING, timeColumn: 'created_at' },
  workshop_proposal: { table: TABLE_NAMES.WORKSHOP_PROPOSALS, statusColumn: 'status', pendingValue: APPROVAL_STATUS.PENDING, timeColumn: 'created_at' },
  location: { table: TABLE_NAMES.LOCATIONS, statusColumn: 'approval_status', pendingValue: APPROVAL_STATUS.PENDING, timeColumn: 'created_at' },
  timecard: { table: 'timecards', statusColumn: 'status', pendingValue: TIMECARD_STATUSES.SUBMITTED, timeColumn: 'submitted_at' },
  time_off: { table: TABLE_NAMES.TIME_OFF_REQUESTS, statusColumn: 'status', pendingValue: TIME_OFF_STATUSES.PENDING, timeColumn: 'created_at' },
  permission_request: { table: TABLE_NAMES.STAFF_PERMISSION_REQUESTS, statusColumn: 'status', pendingValue: PERMISSION_REQUEST_STATUS.PENDING, timeColumn: 'created_at' },
}

/**
 * Pending count + oldest-pending timestamp for every approval source — the
 * single count engine consumed by both the Freigaben hub and the dashboard
 * queue (previously two engines that drifted). Only LIVE tables are queried;
 * the dead `user_content_submissions` table is gone.
 */
export async function getApprovalCounts(): Promise<ApprovalCounts> {
  const entries = await Promise.all(
    Object.entries(COUNT_DESCRIPTORS).map(async ([key, d]): Promise<[string, ApprovalCount]> => {
      // Table/column identifiers are from vetted constants (not user input);
      // the runtime VALUE (status) is the only dynamic part → bound as $1.
      const sql = `SELECT COUNT(*)::int AS count, MIN(${d.timeColumn}) AS oldest
                   FROM ${d.table} WHERE ${d.statusColumn} = $1`
      try {
        const result = await query<{ count: number; oldest: string | null }>(sql, [d.pendingValue])
        const row = result.rows[0]
        return [key, { pending: row?.count ?? 0, oldestAt: row?.oldest ?? null, failed: false }]
      } catch (error) {
        logger.error('Approval count failed', { source: key, error })
        return [key, { pending: 0, oldestAt: null, failed: true }]
      }
    }),
  )
  return Object.fromEntries(entries)
}

/** Total pending across all sources (single number, no double-count). */
export function totalPending(counts: ApprovalCounts): number {
  return Object.values(counts).reduce((sum, c) => sum + c.pending, 0)
}

/** Oldest pending timestamp across all sources, or null. */
export function oldestPendingAt(counts: ApprovalCounts): string | null {
  const times = Object.values(counts).map(c => c.oldestAt).filter((t): t is string => !!t)
  if (times.length === 0) return null
  return times.reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b))
}
