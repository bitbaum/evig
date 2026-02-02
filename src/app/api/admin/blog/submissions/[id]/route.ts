/**
 * API: Single Blog Submission Management
 *
 * GET /api/admin/blog/submissions/[id] - Get submission details
 * PATCH /api/admin/blog/submissions/[id] - Update submission (approve, reject, etc.)
 * DELETE /api/admin/blog/submissions/[id] - Delete submission
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { canAccessSection } from '@/lib/permissions'
import { sendEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Helper to check admin access
async function checkAdminAccess(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user) {
    return { allowed: false, error: 'Anmeldung erforderlich' }
  }

  const userForPermissions = {
    email: session.user.email || '',
    is_staff: session.user.isStaff || false,
    staff_permissions: session.user.staffPermissions || [],
  }

  if (!canAccessSection(userForPermissions, 'content')) {
    return { allowed: false, error: 'Keine Berechtigung für diesen Bereich' }
  }

  return { allowed: true, error: null }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const access = await checkAdminAccess(session)
    if (!access.allowed) {
      return apiUnauthorized(access.error!)
    }

    const { id } = await params

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
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const access = await checkAdminAccess(session)
    if (!access.allowed) {
      return apiUnauthorized(access.error!)
    }

    const { id } = await params
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
    }>(
      `SELECT * FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Einreichung')
    }

    const submission = existing.rows[0]
    const reviewerId = session!.user!.id

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
        // Create blog post from submission
        const postResult = await query<{ id: string }>(
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

        const postId = postResult.rows[0].id

        // Update submission with link to published post
        await query(
          `UPDATE ${TABLE_NAMES.BLOG_SUBMISSIONS}
           SET status = 'published', reviewed_by = $1, reviewed_at = NOW(),
               review_notes = $2, published_post_id = $3, published_at = NOW()
           WHERE id = $4`,
          [reviewerId, review_notes || 'Veröffentlicht', postId, id]
        )

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
          postSlug: submission.slug,
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
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const access = await checkAdminAccess(session)
    if (!access.allowed) {
      return apiUnauthorized(access.error!)
    }

    const { id } = await params

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
      deletedBy: session!.user!.id,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete blog submission', { error })
    return apiError(error, 'Fehler beim Löschen der Einreichung')
  }
}
