/**
 * Workflow event dispatcher — ONE entry point for the side effects every
 * review/transition fires: in-app notification (+ preference-gated email via
 * the fused notifications service), activity feed, audit log.
 *
 * Before this existed, every domain hand-rolled the same fan-out with its own
 * failure policy — some `.catch(() => {})` silently, some warn, some let
 * notification errors break the transition. The dispatcher fixes the policy
 * ONCE:
 *
 *   - NEVER throws into the caller — a failed side effect must not break or
 *     roll back the domain action that triggered it.
 *   - Each channel is isolated: one failing channel doesn't stop the others.
 *   - Every failure is logged with the event type (no silent swallowing).
 *   - `dedupe` (delete-then-insert by related_id + type) runs UNCONDITIONALLY,
 *     even when recipients resolve to zero — the timecard-resubmit contract:
 *     stale "eingereicht" notifications must vanish regardless of who is
 *     currently an approver.
 *
 * Emit events AFTER the transaction commits (runReviewTransition enforces
 * this) — emails must never fire under a row lock or for a rolled-back write.
 */

import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { logger } from '@/lib/logger'
import { notifyUsers, notifyAllStaff } from '@/lib/services/notifications'
import { logActivity, type ActivityAction } from '@/lib/activity'
import { logContentDecision, type AuditContext } from '@/lib/auth/audit'

export type WorkflowRecipients =
  | { userId: string }
  | { userIds: string[] }
  /** Resolved at dispatch time, e.g. () => getTimecardApproverIds(ownerId). */
  | { resolve: () => Promise<string[]> }
  | { allStaff: true; excludeUserId?: string }

export interface WorkflowEvent {
  /** NOTIFICATION_TYPES value. */
  type: string
  recipients: WorkflowRecipients
  title: string
  content: string
  related?: { type: string; id: string }
  /** Template args for getEmailContent's type-specific email branches. */
  metadata?: Record<string, string>
  /** Delete stale rows matching (relatedId, type) before inserting. */
  dedupe?: { relatedId: string; type: string }
  activity?: {
    actorId: string
    action: ActivityAction
    subjectType?: string
    subjectId?: string
    subjectLabel?: string
  }
  audit?:
    | {
        kind: 'content_decision'
        ctx: AuditContext
        contentType: string
        contentId: string
        decision: 'approved' | 'rejected' | 'edited'
      }
    | { kind: 'custom'; log: () => void }
}

async function resolveRecipients(recipients: WorkflowRecipients): Promise<string[] | 'all-staff'> {
  if ('allStaff' in recipients) return 'all-staff'
  if ('userId' in recipients) return [recipients.userId]
  if ('userIds' in recipients) return recipients.userIds
  return recipients.resolve()
}

export async function dispatchWorkflowEvent(event: WorkflowEvent): Promise<void> {
  // 1. Dedupe — unconditional, before any insert (see file header).
  if (event.dedupe) {
    try {
      await db.delete(notifications).where(and(
        eq(notifications.relatedId, event.dedupe.relatedId),
        eq(notifications.type, event.dedupe.type),
      ))
    } catch (error) {
      logger.warn('workflow event channel failed', { type: event.type, channel: 'dedupe', error })
    }
  }

  // 2. In-app notification + preference-gated email (fused in the service).
  try {
    const payload = {
      type: event.type,
      title: event.title,
      content: event.content,
      related_type: event.related?.type,
      related_id: event.related?.id,
      metadata: event.metadata,
    }
    const resolved = await resolveRecipients(event.recipients)
    if (resolved === 'all-staff') {
      const exclude = 'excludeUserId' in event.recipients ? event.recipients.excludeUserId : undefined
      await notifyAllStaff(payload, exclude)
    } else if (resolved.length > 0) {
      await notifyUsers(resolved, payload)
    }
  } catch (error) {
    logger.warn('workflow event channel failed', { type: event.type, channel: 'notify', error })
  }

  // 3. Activity feed (logActivity is already fire-and-forget internally).
  if (event.activity) {
    try {
      logActivity(event.activity)
    } catch (error) {
      logger.warn('workflow event channel failed', { type: event.type, channel: 'activity', error })
    }
  }

  // 4. Audit log.
  if (event.audit) {
    try {
      if (event.audit.kind === 'content_decision') {
        logContentDecision(
          event.audit.ctx,
          event.audit.contentType,
          event.audit.contentId,
          event.audit.decision,
        )
      } else {
        event.audit.log()
      }
    } catch (error) {
      logger.warn('workflow event channel failed', { type: event.type, channel: 'audit', error })
    }
  }
}
