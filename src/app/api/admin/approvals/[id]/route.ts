/**
 * Admin Approval Action API
 * PATCH /api/admin/approvals/[id] - Approve or reject a content submission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { userContentSubmissions, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody, AdminApprovalActionSchema } from '@/lib/schemas'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'

export const PATCH = withAdmin<{ id: string }>('approvals', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminApprovalActionSchema, body)
    if (!validation.success) return validation.error
    const { action } = validation.data

    // Verify submission exists and is pending
    const [submission] = await db
      .select({
        id: userContentSubmissions.id,
        status: userContentSubmissions.status,
        title: userContentSubmissions.title,
        contentType: userContentSubmissions.contentType,
        contentId: userContentSubmissions.contentId,
      })
      .from(userContentSubmissions)
      .where(eq(userContentSubmissions.id, id))

    if (!submission) {
      return apiNotFound('Einreichung nicht gefunden')
    }

    // Allow pending → approved/rejected, and rejected → pending (re-review)
    const VALID_TRANSITIONS: Record<string, string[]> = {
      [APPROVAL_STATUS.PENDING]: [APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED],
      [APPROVAL_STATUS.REJECTED]: [APPROVAL_STATUS.PENDING],
    }

    const newStatus = action === 'approve' ? APPROVAL_STATUS.APPROVED : action === 'reopen' ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.REJECTED
    const allowedNext = VALID_TRANSITIONS[submission.status!]

    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return apiBadRequest(
        submission.status === APPROVAL_STATUS.APPROVED
          ? 'Genehmigte Einreichungen können nicht geändert werden'
          : `Ungültiger Statusübergang: ${submission.status} → ${newStatus}`
      )
    }

    await db
      .update(userContentSubmissions)
      .set({
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(userContentSubmissions.id, id))

    // Send notification email to submitter. sendEmail RESOLVES with
    // {success:false,error} on SMTP/Listmonk failure rather than throwing,
    // so the bare try/catch only catches the rare exception path.
    // Realistic failures slipped through with no log entry. Same pattern
    // as c610bb72 / 87f084af. Content-submission decisions have no
    // in-app notification fallback, so the email is the submitter's
    // only signal — silent SMTP failure leaves them unaware.
    try {
      const [submitter] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .innerJoin(userContentSubmissions, eq(userContentSubmissions.userId, users.id))
        .where(eq(userContentSubmissions.id, id))

      if (submitter) {
        const templateName = action === 'approve' ? 'contentSubmissionApproved' : 'contentSubmissionRejected'
        const emailResult = await sendEmail(
          submitter.email,
          templateName,
          submitter.name || 'Benutzer',
          submission.title,
          submission.contentType
        )
        if (!emailResult.success) {
          logger.warn('Content approval email failed (resolved)', {
            submissionId: id,
            action,
            error: emailResult.error,
          })
        }
      }
    } catch (emailError) {
      logger.warn('Content approval email failed (rejected)', { error: emailError, submissionId: id, action })
    }

    logger.info('Content submission reviewed', {
      submissionId: id,
      action: newStatus,
      reviewerId: session.user.id,
      title: submission.title,
    })

    if (action === 'approve' || action === 'reject') {
      logActivity({
        actorId: session.user.id,
        action: action === 'approve' ? 'approved_blog' : 'rejected_listing',
        subjectType: submission.contentType ?? undefined,
        subjectId: submission.contentId ?? undefined,
        subjectLabel: submission.title ?? submission.contentType ?? undefined,
      })
    }

    return apiSuccess({
      message: action === 'approve' ? 'Inhalt genehmigt' : 'Inhalt abgelehnt',
      status: newStatus,
    })
  } catch (error) {
    logger.error('Error processing approval', { error })
    return apiError(error, 'Freigabe konnte nicht verarbeitet werden')
  }
})
