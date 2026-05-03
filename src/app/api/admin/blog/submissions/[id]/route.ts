/**
 * API: Single Blog Submission Management
 *
 * GET /api/admin/blog/submissions/[id] - Get submission details
 * PATCH /api/admin/blog/submissions/[id] - Update submission (approve, reject, etc.)
 * DELETE /api/admin/blog/submissions/[id] - Delete submission
 */

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { blogSubmissions, blogCategories, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import {
  approveSubmission,
  rejectSubmission,
  publishSubmission,
  requestChanges,
  editSubmission,
  EditNotAllowedError,
  NoFieldsError,
} from '@/lib/services/blog-submission'

export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {
  try {
    const { id } = context!.params!

    const aliasedReviewer = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .as('reviewer')

    const rows = await db
      .select({
        // All blogSubmissions columns
        id: blogSubmissions.id,
        submitterName: blogSubmissions.submitterName,
        submitterEmail: blogSubmissions.submitterEmail,
        userId: blogSubmissions.userId,
        title: blogSubmissions.title,
        slug: blogSubmissions.slug,
        content: blogSubmissions.content,
        excerpt: blogSubmissions.excerpt,
        submissionType: blogSubmissions.submissionType,
        categoryId: blogSubmissions.categoryId,
        categoryName: blogSubmissions.categoryName,
        tags: blogSubmissions.tags,
        status: blogSubmissions.status,
        reviewedBy: blogSubmissions.reviewedBy,
        reviewedAt: blogSubmissions.reviewedAt,
        reviewNotes: blogSubmissions.reviewNotes,
        rejectionReason: blogSubmissions.rejectionReason,
        publishedPostId: blogSubmissions.publishedPostId,
        publishedAt: blogSubmissions.publishedAt,
        editHistory: blogSubmissions.editHistory,
        lastEditedBy: blogSubmissions.lastEditedBy,
        lastEditedAt: blogSubmissions.lastEditedAt,
        submittedAt: blogSubmissions.submittedAt,
        createdAt: blogSubmissions.createdAt,
        updatedAt: blogSubmissions.updatedAt,
        // Joined columns
        categoryLabel: blogCategories.name,
        reviewerName: aliasedReviewer.name,
        reviewerEmail: aliasedReviewer.email,
      })
      .from(blogSubmissions)
      .leftJoin(blogCategories, eq(blogSubmissions.categoryId, blogCategories.id))
      .leftJoin(aliasedReviewer, eq(blogSubmissions.reviewedBy, aliasedReviewer.id))
      .where(eq(blogSubmissions.id, id))

    if (rows.length === 0) {
      return apiNotFound('Einreichung')
    }

    // Flatten to match the old raw SQL output shape (s.*, plus joined fields)
    const row = rows[0]
    return apiSuccess({
      ...row,
      category_label: row.categoryLabel,
      reviewer_name: row.reviewerName,
      reviewer_email: row.reviewerEmail,
    })
  } catch (error) {
    logger.error('Failed to get blog submission', { error })
    return apiError(error, 'Fehler beim Laden der Einreichung')
  }
})

export const PATCH = withAdmin<{ id: string }>('content', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const { action, review_notes, rejection_reason } = body

    // Verify submission exists
    const existingRows = await db
      .select()
      .from(blogSubmissions)
      .where(eq(blogSubmissions.id, id))

    if (existingRows.length === 0) {
      return apiNotFound('Einreichung')
    }

    const submission = existingRows[0]
    const reviewerId = session.user.id

    switch (action) {
      case 'approve':
        return apiSuccess(await approveSubmission(submission, reviewerId, review_notes))

      case 'reject': {
        if (!rejection_reason) {
          return apiBadRequest('Ablehnungsgrund ist erforderlich')
        }
        return apiSuccess(await rejectSubmission(submission, reviewerId, rejection_reason, review_notes))
      }

      case 'publish':
        return apiSuccess(await publishSubmission(submission, reviewerId, review_notes))

      case 'request_changes': {
        if (!review_notes) {
          return apiBadRequest('Änderungshinweise sind erforderlich')
        }
        return apiSuccess(await requestChanges(submission, reviewerId, review_notes))
      }

      case 'edit': {
        const editorName = session.user.name || session.user.email || 'Admin'
        const result = await editSubmission(submission, reviewerId, editorName, body.fields)

        if ('noChanges' in result) {
          return apiSuccess({ submission: result.submission, message: 'Keine Änderungen erkannt' })
        }
        return apiSuccess(result)
      }

      default:
        return apiBadRequest(ERROR_MESSAGES.INVALID_ACTION)
    }
  } catch (error) {
    if (error instanceof EditNotAllowedError || error instanceof NoFieldsError) {
      return apiBadRequest(error.message)
    }
    logger.error('Failed to update blog submission', { error })
    return apiError(error, 'Fehler beim Aktualisieren der Einreichung')
  }
})

export const DELETE = withAdmin<{ id: string }>('content', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check if submission exists
    const existingRows = await db
      .select({ id: blogSubmissions.id, title: blogSubmissions.title })
      .from(blogSubmissions)
      .where(eq(blogSubmissions.id, id))

    if (existingRows.length === 0) {
      return apiNotFound('Einreichung')
    }

    // Delete submission
    await db
      .delete(blogSubmissions)
      .where(eq(blogSubmissions.id, id))

    logger.info('Blog submission deleted', {
      submissionId: id,
      title: existingRows[0].title,
      deletedBy: session.user.id,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete blog submission', { error })
    return apiError(error, 'Fehler beim Löschen der Einreichung')
  }
})
