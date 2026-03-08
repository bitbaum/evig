/**
 * Admin Approval Action API
 * PATCH /api/admin/approvals/[id] - Approve or reject a content submission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody, AdminApprovalActionSchema } from '@/lib/schemas'
import { TABLE_NAMES } from '@/config/database'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

export const PATCH = withAdmin<{ id: string }>('approvals', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminApprovalActionSchema, body)
    if (!validation.success) return validation.error
    const { action } = validation.data

    // Verify submission exists and is pending
    const submissionResult = await query(
      `SELECT id, status, title, content_type, content_id FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} WHERE id = $1`,
      [id]
    )

    if (submissionResult.rows.length === 0) {
      return apiNotFound('Einreichung nicht gefunden')
    }

    const submission = submissionResult.rows[0] as {
      id: string; status: string; title: string; content_type: string; content_id: string | null
    }

    // Allow pending → approved/rejected, and rejected → pending (re-review)
    const VALID_TRANSITIONS: Record<string, string[]> = {
      [APPROVAL_STATUS.PENDING]: [APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED],
      [APPROVAL_STATUS.REJECTED]: [APPROVAL_STATUS.PENDING],
    }

    const newStatus = action === 'approve' ? APPROVAL_STATUS.APPROVED : action === 'reopen' ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.REJECTED
    const allowedNext = VALID_TRANSITIONS[submission.status]

    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return apiBadRequest(
        submission.status === APPROVAL_STATUS.APPROVED
          ? 'Genehmigte Einreichungen können nicht geändert werden'
          : `Ungültiger Statusübergang: ${submission.status} → ${newStatus}`
      )
    }

    await query(
      `UPDATE ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [newStatus, session.user.id, id]
    )

    // Send notification email to submitter
    try {
      const submitterResult = await query(
        `SELECT u.email, u.name FROM ${TABLE_NAMES.USERS} u
         JOIN ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} s ON s.user_id = u.id
         WHERE s.id = $1`,
        [id]
      )
      if (submitterResult.rows.length > 0) {
        const submitter = submitterResult.rows[0] as { email: string; name: string | null }
        const templateName = action === 'approve' ? 'contentSubmissionApproved' : 'contentSubmissionRejected'
        await sendEmail(
          submitter.email,
          templateName,
          submitter.name || 'Benutzer',
          submission.title,
          submission.content_type
        )
      }
    } catch (emailError) {
      logger.warn('Failed to send content approval email', { error: emailError, submissionId: id, action })
    }

    logger.info('Content submission reviewed', {
      submissionId: id,
      action: newStatus,
      reviewerId: session.user.id,
      title: submission.title,
    })

    return apiSuccess({
      message: action === 'approve' ? 'Inhalt genehmigt' : 'Inhalt abgelehnt',
      status: newStatus,
    })
  } catch (error) {
    logger.error('Error processing approval', { error })
    return apiError(error, 'Freigabe konnte nicht verarbeitet werden')
  }
})
