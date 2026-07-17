/**
 * Activity feed helpers — fire-and-forget writes for the dashboard team feed.
 *
 * Never awaited from the caller — failures are logged and swallowed so they
 * can never block the primary action that triggered them.
 */

import { db } from '@/db'
import { activityFeed } from '@/db/schema/misc'
import { logger } from '@/lib/logger'

export type ActivityAction =
  | 'approved_listing'
  | 'rejected_listing'
  | 'closed_it_hilfe'
  | 'captured_device'
  | 'approved_blog'
  | 'approved_repairer'
  | 'submitted_timecard'
  | 'approved_timecard'
  | 'rejected_timecard'
  | 'edited_timecard'
  | 'opened_timecard_for_user'
  | 'submitted_timecard_for_user'
  | 'updated_zeit_pensum'
  | 'reopened_timecard'
  | 'recorded_membership_payment'

interface ActivityParams {
  actorId: string
  action: ActivityAction
  subjectType?: string
  subjectId?: string
  subjectLabel?: string
}

/**
 * Log an activity event. Fire-and-forget — never throws.
 */
export function logActivity(params: ActivityParams): void {
  db.insert(activityFeed).values({
    actorId: params.actorId,
    action: params.action,
    subjectType: params.subjectType ?? null,
    subjectId: params.subjectId ?? null,
    subjectLabel: params.subjectLabel ?? null,
  }).catch(err => {
    logger.warn('activity feed insert failed', { error: err, action: params.action })
  })
}
