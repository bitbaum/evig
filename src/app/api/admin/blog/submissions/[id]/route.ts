/**
 * API: Single Blog Submission Management
 *
 * GET /api/admin/blog/submissions/[id] - Get submission details
 * PATCH /api/admin/blog/submissions/[id] - Update submission (approve, reject, etc.)
 * DELETE /api/admin/blog/submissions/[id] - Delete submission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query, transaction } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
  apiForbidden,
} from '@/lib/api/helpers'
import { canAccessSection } from '@/lib/permissions'
import { sendEmail } from '@/lib/email'
import { createEditSnapshot, appendEditHistory } from '@/lib/admin/edit-utils'

// Helper to check content section access
function checkContentAccess(session: { user: { email: string; isStaff: boolean; staffPermissions: string[] } }) {
  const userForPermissions = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  return canAccessSection(userForPermissions, 'content')
}

export const GET = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    if (!checkContentAccess(session)) {
      return apiForbidden('Keine Berechtigung für diesen Bereich')
    }

    const { id } = context!.params!

    const result = await query(
      `SELECT
        s.*,
        c.name as category_label,
        r.name as reviewer_name,
        r.email as reviewer_email
       FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} s
       LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON s.category_id = c.id
       LEFT JOIN ${TABLE_NAMES.USERS} r ON s.reviewed_by = r.id
       WHERE s.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Einreichung')
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    logger.error('Failed to get blog submission', { error })
    return apiError(error, 'Fehler beim Laden der Einreichung')
  }
})

export const PATCH = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    if (!checkContentAccess(session)) {
      return apiForbidden('Keine Berechtigung für diesen Bereich')
    }

    const { id } = context!.params!
    const body = await request.json()
    const { action, review_notes, rejection_reason } = body

    // Verify submission exists
    const existing = await query<{
      id: string
      title: string
      slug: string
      content: string
      submitter_name: string
      submitter_email: string
      category_id: string | null
      tags: string[]
      status: string
      edit_history?: any[]
    }>(
      `SELECT * FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Einreichung')
    }

    const submission = existing.rows[0]
    const reviewerId = session.user.id

    // Handle different actions
    switch (action) {
      case 'approve': {
        // Update submission status
        await query(
          `UPDATE ${TABLE_NAMES.BLOG_SUBMISSIONS}
           SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), review_notes = $2
           WHERE id = $3`,
          [reviewerId, review_notes || null, id]
        )

        // Send approval email to submitter
        try {
          await sendEmail(
            submission.submitter_email,
            'blogSubmissionApproved',
            submission.submitter_name,
            submission.title
          )
        } catch (emailError) {
          logger.warn('Failed to send approval email', { error: emailError })
        }

        logger.info('Blog submission approved', {
          submissionId: id,
          reviewerId,
        })

        return apiSuccess({ status: 'approved', message: 'Einreichung genehmigt' })
      }

      case 'edit': {
        // Admin editing before approval
        const { fields } = body

        if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
          return apiBadRequest('Keine Felder zum Bearbeiten angegeben')
        }

        // Only allow editing pending submissions
        if (submission.status !== 'pending') {
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
          submission.edit_history || null,
          editEntry
        )

        // Build dynamic UPDATE query
        const updateFields = Object.keys(fields)
        const setClause = updateFields
          .map((field, idx) => `${field} = $${idx + 2}`)
          .join(', ')
        const values = [id, ...updateFields.map((f) => fields[f])]

        const updateQuery = `
          UPDATE ${TABLE_NAMES.BLOG_SUBMISSIONS}
          SET ${setClause},
              edit_history = $${values.length + 1},
              last_edited_by = $${values.length + 2},
              last_edited_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `

        const updateResult = await query(updateQuery, [
          ...values,
          JSON.stringify(updatedHistory),
          reviewerId,
        ])

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

        await query(
          `UPDATE ${TABLE_NAMES.BLOG_SUBMISSIONS}
           SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(),
               review_notes = $2, rejection_reason = $3
           WHERE id = $4`,
          [reviewerId, review_notes || null, rejection_reason, id]
        )

        // Send rejection email to submitter
        try {
          await sendEmail(
            submission.submitter_email,
            'blogSubmissionRejected',
            submission.submitter_name,
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

        return apiSuccess({ status: 'rejected', message: 'Einreichung abgelehnt' })
      }

      case 'publish': {
        // Wrap INSERT + UPDATE in transaction to prevent orphaned posts
        const { postId, postSlug } = await transaction(async (client) => {
          const postResult = await client.query(
            `INSERT INTO ${TABLE_NAMES.BLOG_POSTS}
             (slug, title, content, excerpt, category_id, tags, is_published, published_at,
              created_by, seo_title, seo_description)
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), $7, $8, $9)
             RETURNING id`,
            [
              submission.slug,
              submission.title,
              submission.content,
              submission.content.substring(0, 200) + '...',
              submission.category_id,
              submission.tags || [],
              reviewerId,
              submission.title,
              submission.content.substring(0, 160),
            ]
          )

          const createdPostId = (postResult.rows[0] as { id: string }).id

          // Update submission with link to published post
          await client.query(
            `UPDATE ${TABLE_NAMES.BLOG_SUBMISSIONS}
             SET status = 'published', reviewed_by = $1, reviewed_at = NOW(),
                 review_notes = $2, published_post_id = $3, published_at = NOW()
             WHERE id = $4`,
            [reviewerId, review_notes || 'Veröffentlicht', createdPostId, id]
          )

          return { postId: createdPostId, postSlug: submission.slug }
        })

        // Send published notification email
        try {
          await sendEmail(
            submission.submitter_email,
            'blogSubmissionPublished',
            submission.submitter_name,
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
          status: 'published',
          message: 'Beitrag veröffentlicht',
          postId,
          postSlug,
        })
      }

      case 'request_changes': {
        if (!review_notes) {
          return apiBadRequest('Änderungshinweise sind erforderlich')
        }

        await query(
          `UPDATE ${TABLE_NAMES.BLOG_SUBMISSIONS}
           SET status = 'pending', reviewed_by = $1, reviewed_at = NOW(), review_notes = $2
           WHERE id = $3`,
          [reviewerId, review_notes, id]
        )

        // Send change request email
        try {
          await sendEmail(
            submission.submitter_email,
            'blogSubmissionChangesRequested',
            submission.submitter_name,
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
          status: 'pending',
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

export const DELETE = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    if (!checkContentAccess(session)) {
      return apiForbidden('Keine Berechtigung für diesen Bereich')
    }

    const { id } = context!.params!

    // Check if submission exists
    const existing = await query<{ id: string; title: string }>(
      `SELECT id, title FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Einreichung')
    }

    // Delete submission
    await query(`DELETE FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} WHERE id = $1`, [
      id,
    ])

    logger.info('Blog submission deleted', {
      submissionId: id,
      title: existing.rows[0].title,
      deletedBy: session.user.id,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete blog submission', { error })
    return apiError(error, 'Fehler beim Löschen der Einreichung')
  }
})
