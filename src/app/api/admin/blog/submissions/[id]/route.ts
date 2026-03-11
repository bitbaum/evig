/**
 * API: Single Blog Submission Management
 *
 * GET /api/admin/blog/submissions/[id] - Get submission details
 * PATCH /api/admin/blog/submissions/[id] - Update submission (approve, reject, etc.)
 * DELETE /api/admin/blog/submissions/[id] - Delete submission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { blogSubmissions, blogCategories, blogPosts, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { sendEmail } from '@/lib/email'
import { createEditSnapshot, appendEditHistory, type EditHistoryEntry } from '@/lib/admin/edit-utils'

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

    // Handle different actions
    switch (action) {
      case 'approve': {
        // Update submission status
        await db
          .update(blogSubmissions)
          .set({
            status: APPROVAL_STATUS.APPROVED,
            reviewedBy: reviewerId,
            reviewedAt: sql`NOW()`,
            reviewNotes: review_notes || null,
          })
          .where(eq(blogSubmissions.id, id))

        // Send approval email to submitter
        try {
          await sendEmail(
            submission.submitterEmail,
            'blogSubmissionApproved',
            submission.submitterName,
            submission.title
          )
        } catch (emailError) {
          logger.warn('Failed to send approval email', { error: emailError })
        }

        logger.info('Blog submission approved', {
          submissionId: id,
          reviewerId,
        })

        return apiSuccess({ status: APPROVAL_STATUS.APPROVED, message: 'Einreichung genehmigt' })
      }

      case 'edit': {
        // Admin editing before approval
        const { fields } = body

        if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
          return apiBadRequest('Keine Felder zum Bearbeiten angegeben')
        }

        // Only allow editing pending submissions
        if (submission.status !== APPROVAL_STATUS.PENDING) {
          return apiBadRequest(
            `Einreichung kann nicht bearbeitet werden (Status: ${submission.status})`
          )
        }

        // Create edit snapshot
        const editorName = session.user.name || session.user.email || 'Admin'
        const editEntry = createEditSnapshot(
          submission,
          fields,
          reviewerId,
          editorName
        )

        // Only create entry if there are actual changes
        if (editEntry.fields_changed.length === 0) {
          return apiSuccess({
            submission,
            message: 'Keine Änderungen erkannt',
          })
        }

        const updatedHistory = appendEditHistory(
          (submission.editHistory as EditHistoryEntry[] | null) || null,
          editEntry
        )

        // Build dynamic UPDATE using sql template for proper parameterization
        // Field names are validated against a whitelist to prevent SQL injection
        const allowedFields = ['title', 'slug', 'content', 'excerpt', 'category_id', 'category_name', 'tags', 'submission_type']
        const updateFields = Object.keys(fields).filter(f => allowedFields.includes(f))

        if (updateFields.length === 0) {
          return apiBadRequest('Keine gültigen Felder zum Bearbeiten')
        }

        const setFragments = updateFields.map((field) =>
          sql`${sql.raw(field)} = ${fields[field]}`
        )
        const allSets = [
          ...setFragments,
          sql`edit_history = ${JSON.stringify(updatedHistory)}`,
          sql`last_edited_by = ${reviewerId}`,
          sql`last_edited_at = NOW()`,
          sql`updated_at = NOW()`,
        ]

        const updateResult = await db.execute(sql`
          UPDATE ${sql.raw(TABLE_NAMES.BLOG_SUBMISSIONS)}
          SET ${sql.join(allSets, sql`, `)}
          WHERE id = ${id}
          RETURNING *
        `)

        logger.info('Blog submission edited by admin', {
          submissionId: id,
          editorId: reviewerId,
          fieldsChanged: editEntry.fields_changed,
        })

        return apiSuccess({
          submission: updateResult.rows[0],
          message: 'Einreichung erfolgreich aktualisiert',
        })
      }

      case 'reject': {
        if (!rejection_reason) {
          return apiBadRequest('Ablehnungsgrund ist erforderlich')
        }

        await db
          .update(blogSubmissions)
          .set({
            status: APPROVAL_STATUS.REJECTED,
            reviewedBy: reviewerId,
            reviewedAt: sql`NOW()`,
            reviewNotes: review_notes || null,
            rejectionReason: rejection_reason,
          })
          .where(eq(blogSubmissions.id, id))

        // Send rejection email to submitter
        try {
          await sendEmail(
            submission.submitterEmail,
            'blogSubmissionRejected',
            submission.submitterName,
            submission.title,
            rejection_reason
          )
        } catch (emailError) {
          logger.warn('Failed to send rejection email', { error: emailError })
        }

        logger.info('Blog submission rejected', {
          submissionId: id,
          reviewerId,
          reason: rejection_reason,
        })

        return apiSuccess({ status: APPROVAL_STATUS.REJECTED, message: 'Einreichung abgelehnt' })
      }

      case 'publish': {
        // Wrap INSERT + UPDATE in Drizzle transaction
        const { postId, postSlug } = await db.transaction(async (tx) => {
          const [post] = await tx
            .insert(blogPosts)
            .values({
              slug: submission.slug!,
              title: submission.title,
              content: submission.content,
              excerpt: submission.content.substring(0, 200) + '...',
              categoryId: submission.categoryId,
              tags: submission.tags || [],
              isPublished: true,
              publishedAt: sql`NOW()`,
              createdBy: reviewerId,
              seoTitle: submission.title,
              seoDescription: submission.content.substring(0, 160),
            })
            .returning({ id: blogPosts.id })

          const createdPostId = post.id

          // Update submission with link to published post
          await tx
            .update(blogSubmissions)
            .set({
              status: APPROVAL_STATUS.PUBLISHED,
              reviewedBy: reviewerId,
              reviewedAt: sql`NOW()`,
              reviewNotes: review_notes || 'Veröffentlicht',
              publishedPostId: createdPostId,
              publishedAt: sql`NOW()`,
            })
            .where(eq(blogSubmissions.id, id))

          return { postId: createdPostId, postSlug: submission.slug }
        })

        // Send published notification email
        try {
          await sendEmail(
            submission.submitterEmail,
            'blogSubmissionPublished',
            submission.submitterName,
            submission.title,
            `/blog/${submission.slug}`
          )
        } catch (emailError) {
          logger.warn('Failed to send publish notification email', {
            error: emailError,
          })
        }

        logger.info('Blog submission published', {
          submissionId: id,
          postId,
          reviewerId,
        })

        return apiSuccess({
          status: APPROVAL_STATUS.PUBLISHED,
          message: 'Beitrag veröffentlicht',
          postId,
          postSlug,
        })
      }

      case 'request_changes': {
        if (!review_notes) {
          return apiBadRequest('Änderungshinweise sind erforderlich')
        }

        await db
          .update(blogSubmissions)
          .set({
            status: APPROVAL_STATUS.PENDING,
            reviewedBy: reviewerId,
            reviewedAt: sql`NOW()`,
            reviewNotes: review_notes,
          })
          .where(eq(blogSubmissions.id, id))

        // Send change request email
        try {
          await sendEmail(
            submission.submitterEmail,
            'blogSubmissionChangesRequested',
            submission.submitterName,
            submission.title,
            review_notes
          )
        } catch (emailError) {
          logger.warn('Failed to send changes requested email', {
            error: emailError,
          })
        }

        logger.info('Blog submission changes requested', {
          submissionId: id,
          reviewerId,
        })

        return apiSuccess({
          status: APPROVAL_STATUS.PENDING,
          message: 'Änderungen angefragt',
        })
      }

      default:
        return apiBadRequest('Ungültige Aktion')
    }
  } catch (error) {
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
