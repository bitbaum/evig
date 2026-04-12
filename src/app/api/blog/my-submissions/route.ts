/**
 * API: My Blog Submissions
 *
 * GET /api/blog/my-submissions
 * Returns the list of blog submissions belonging to the authenticated user
 * so submitters can track status, feedback, and next steps.
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { blogSubmissions, blogPosts } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import {
  APPROVAL_STATUS,
  getApprovalStatusLabel,
} from '@/config/approval-status'

interface MySubmissionRow {
  id: string
  title: string
  slug: string | null
  status: string
  statusLabel: string
  submissionType: string
  reviewNotes: string | null
  rejectionReason: string | null
  adminFeedback: string | null
  nextAction: string | null
  publishedPostId: string | null
  publishedPostSlug: string | null
  publishedAt: string | null
  submittedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

function getNextAction(status: string): string | null {
  switch (status) {
    case APPROVAL_STATUS.PENDING:
      return 'Wir prüfen deinen Beitrag. Du wirst informiert, sobald eine Entscheidung vorliegt.'
    case APPROVAL_STATUS.APPROVED:
      return 'Ihr Beitrag wurde genehmigt und wird in Kürze veröffentlicht.'
    case APPROVAL_STATUS.PUBLISHED:
      return 'Ihr Beitrag ist live.'
    case APPROVAL_STATUS.REJECTED:
      return 'Dieser Beitrag wurde abgelehnt. Du kannst jederzeit einen neuen Beitrag einreichen.'
    case APPROVAL_STATUS.REQUIRES_CHANGES:
      return 'Bitte überarbeite den Beitrag basierend auf dem Feedback und reiche ihn erneut ein.'
    default:
      return null
  }
}

export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const userId = session.user.id

    const rows = await db
      .select({
        id: blogSubmissions.id,
        title: blogSubmissions.title,
        slug: blogSubmissions.slug,
        status: blogSubmissions.status,
        submissionType: blogSubmissions.submissionType,
        reviewNotes: blogSubmissions.reviewNotes,
        rejectionReason: blogSubmissions.rejectionReason,
        publishedPostId: blogSubmissions.publishedPostId,
        publishedPostSlug: blogPosts.slug,
        publishedAt: blogSubmissions.publishedAt,
        submittedAt: blogSubmissions.submittedAt,
        createdAt: blogSubmissions.createdAt,
        updatedAt: blogSubmissions.updatedAt,
      })
      .from(blogSubmissions)
      .leftJoin(blogPosts, eq(blogSubmissions.publishedPostId, blogPosts.id))
      .where(eq(blogSubmissions.userId, userId))
      .orderBy(desc(blogSubmissions.createdAt))

    const submissions: MySubmissionRow[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      statusLabel: getApprovalStatusLabel(r.status),
      submissionType: r.submissionType,
      reviewNotes: r.reviewNotes,
      rejectionReason: r.rejectionReason,
      adminFeedback: r.rejectionReason ?? r.reviewNotes ?? null,
      nextAction: getNextAction(r.status),
      publishedPostId: r.publishedPostId,
      publishedPostSlug: r.publishedPostSlug,
      publishedAt: r.publishedAt,
      submittedAt: r.submittedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    return apiSuccess({ submissions })
  } catch (error) {
    logger.error('Failed to fetch my blog submissions', { error })
    return apiError(error, 'Fehler beim Laden Ihrer Einreichungen')
  }
})
