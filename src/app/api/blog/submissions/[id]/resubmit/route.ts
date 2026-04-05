/**
 * API: Resubmit a blog submission
 *
 * POST /api/blog/submissions/[id]/resubmit
 *
 * Allows the original submitter to update the content of a submission that
 * the admin marked as `requires_changes` and send it back into the review
 * queue. Notifies staff that a revision is waiting.
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { blogSubmissions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiForbidden,
  apiBadRequest,
} from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { notifyAllStaff } from '@/lib/services/notifications'

interface ResubmitBody {
  title?: string
  content?: string
  excerpt?: string
}

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Ungültige Einreichungs-ID')

    const body = (await request.json().catch(() => ({}))) as ResubmitBody
    const { title, content, excerpt } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return apiBadRequest('Inhalt ist erforderlich')
    }
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return apiBadRequest('Titel darf nicht leer sein')
    }

    const [existing] = await db
      .select()
      .from(blogSubmissions)
      .where(eq(blogSubmissions.id, id))

    if (!existing) return apiNotFound('Einreichung')

    // Ownership check — only the original submitter may resubmit.
    if (existing.userId !== session.user.id) {
      return apiForbidden('Sie dürfen diese Einreichung nicht bearbeiten')
    }

    if (existing.status !== APPROVAL_STATUS.REQUIRES_CHANGES) {
      return apiBadRequest(
        'Nur Einreichungen mit Status «Änderungen erforderlich» können erneut eingereicht werden',
      )
    }

    await db
      .update(blogSubmissions)
      .set({
        title: title?.trim() || existing.title,
        content: content,
        excerpt: excerpt ?? existing.excerpt,
        status: APPROVAL_STATUS.PENDING,
        // Clear previous review metadata so the admin sees a fresh review.
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(blogSubmissions.id, id))

    logger.info('Blog submission resubmitted', {
      submissionId: id,
      userId: session.user.id,
    })

    // Fire-and-forget staff notification.
    try {
      await notifyAllStaff({
        type: 'system',
        title: 'Blog-Beitrag erneut eingereicht',
        content: `«${title?.trim() || existing.title}» wurde vom Autor überarbeitet und wartet auf erneute Prüfung.`,
      })
    } catch (notifyError) {
      logger.warn('Failed to notify staff of resubmission', {
        submissionId: id,
        error: notifyError,
      })
    }

    return apiSuccess({
      message: 'Einreichung erneut eingereicht',
      id,
      status: APPROVAL_STATUS.PENDING,
    })
  } catch (error) {
    logger.error('Failed to resubmit blog submission', { error })
    return apiError(error, 'Fehler beim erneuten Einreichen')
  }
})
