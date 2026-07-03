/**
 * Admin Approval Action API
 * PATCH /api/admin/approvals/[id] - Approve, reject or reopen a content submission
 *
 * Pilot B of the shared review-workflow core: the transition table, FOR UPDATE
 * race safety, review-column writes and the side-effect fan-out (in-app +
 * email + activity + audit) all run through lifecycle/review-workflow —
 * this route only maps HTTP ⇄ core.
 *
 * Behavior note (intentional): the decision email now goes through the fused
 * notification path, so it respects the user's email_notifications preference
 * (the old direct sendEmail bypassed it). The in-app notification is the
 * guaranteed channel.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody, AdminApprovalActionSchema } from '@/lib/schemas'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { runReviewTransition } from '@/lib/lifecycle/review-workflow'
import type { TransitionTable } from '@/lib/lifecycle'
import type { WorkflowEvent } from '@/lib/lifecycle/dispatch'

const CONTENT_TRANSITIONS: TransitionTable = [
  { action: 'approve', from: APPROVAL_STATUS.PENDING, to: APPROVAL_STATUS.APPROVED },
  { action: 'reject', from: APPROVAL_STATUS.PENDING, to: APPROVAL_STATUS.REJECTED },
  // Re-review: a rejected submission can be reopened (approved is terminal).
  { action: 'reopen', from: APPROVAL_STATUS.REJECTED, to: APPROVAL_STATUS.PENDING },
]

const SUCCESS_MESSAGES: Record<string, string> = {
  approve: 'Inhalt genehmigt',
  reject: 'Inhalt abgelehnt',
  reopen: 'Zur erneuten Prüfung geöffnet',
}

interface SubmissionRow extends Record<string, unknown> {
  status: string
  user_id: string
  title: string
  content_type: string
  content_id: string | null
}

export const PATCH = withAdmin<{ id: string }>('approvals', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminApprovalActionSchema, body)
    if (!validation.success) return validation.error
    const { action, reason } = validation.data

    const result = await runReviewTransition<SubmissionRow>({
      target: {
        table: TABLE_NAMES.USER_CONTENT_SUBMISSIONS,
        columns: { reason: 'rejection_reason' },
        select: ['user_id', 'title', 'content_type', 'content_id'],
      },
      transitions: CONTENT_TRANSITIONS,
      id,
      action,
      actor: { id: session.user.id },
      reason: reason ?? null,
      // Only a rejection writes the reason column; approve/reopen leave it.
      write: {
        approve: { reason: 'skip' },
        reopen: { reason: 'skip' },
      },
      emit: async (row, ctx): Promise<WorkflowEvent | null> => {
        if (ctx.action !== 'approve' && ctx.action !== 'reject') return null
        const approved = ctx.action === 'approve'

        const [submitter] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, row.user_id))

        return {
          type: NOTIFICATION_TYPES.CONTENT_SUBMISSION_STATUS,
          recipients: { userId: row.user_id },
          title: approved ? 'Einreichung genehmigt' : 'Einreichung abgelehnt',
          content: approved
            ? `«${row.title}» wurde genehmigt und wird veröffentlicht.`
            : `«${row.title}» wurde abgelehnt.${reason ? ` Begründung: ${reason}` : ''}`,
          metadata: {
            action: ctx.action,
            submitterName: submitter?.name || 'Benutzer',
            title: row.title,
            contentType: row.content_type,
            ...(reason ? { reason } : {}),
          },
          activity: {
            actorId: session.user.id,
            // Historic verbs kept for feed continuity.
            action: approved ? 'approved_blog' : 'rejected_listing',
            subjectType: row.content_type ?? undefined,
            subjectId: row.content_id ?? id,
            subjectLabel: row.title ?? row.content_type ?? undefined,
          },
          audit: {
            kind: 'content_decision',
            ctx: {
              userId: session.user.id,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown',
            },
            contentType: row.content_type ?? 'unknown',
            contentId: row.content_id ?? id,
            decision: approved ? 'approved' : 'rejected',
          },
        }
      },
    })

    if (!result.ok) {
      switch (result.code) {
        case 'not_found':
          return apiNotFound('Einreichung nicht gefunden')
        case 'invalid_transition':
          return apiBadRequest(
            result.from === APPROVAL_STATUS.APPROVED
              ? 'Genehmigte Einreichungen können nicht geändert werden'
              : `Ungültiger Statusübergang: ${result.from} (${action})`,
          )
        case 'conflict':
          return apiBadRequest('Der Status wurde soeben von jemand anderem geändert — bitte neu laden.')
        default:
          return apiBadRequest('Aktion nicht möglich')
      }
    }

    logger.info('Content submission reviewed', {
      submissionId: id,
      action: result.to,
      reviewerId: session.user.id,
      title: result.row.title,
    })

    return apiSuccess({
      message: SUCCESS_MESSAGES[action] ?? 'Aktualisiert',
      status: result.to,
    })
  } catch (error) {
    logger.error('Error processing approval action', { error })
    return apiError(error, 'Aktion konnte nicht verarbeitet werden')
  }
})
