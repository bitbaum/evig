/**
 * Blog Submission Service
 *
 * Business logic for blog submission review actions:
 * approve, reject, publish, request changes, and edit.
 */

import { db } from '@/db'
import { blogSubmissions, blogPosts, notifications } from '@/db/schema'
import { eq, sql, getTableName } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { createEditSnapshot, appendEditHistory, type EditHistoryEntry } from '@/lib/admin/edit-utils'

/**
 * Create an in-app notification for a submitter when their blog submission
 * status changes. Fire-and-forget: never throws — a failed notification must
 * not block the admin action.
 */
async function notifySubmitterOfStatusChange(
  submission: Submission,
  status: string,
  title: string,
  content: string,
): Promise<void> {
  if (!submission.userId) return
  try {
    await db.insert(notifications).values({
      userId: submission.userId,
      type: NOTIFICATION_TYPES.BLOG_SUBMISSION_STATUS,
      title,
      content,
      relatedId: submission.id,
      sentInApp: true,
    })
  } catch (error) {
    logger.warn('Failed to create blog submission in-app notification', {
      submissionId: submission.id,
      status,
      error,
    })
  }
}

// ============================================================================
// Types
// ============================================================================

/** The submission row shape returned by the caller's SELECT */
type Submission = typeof blogSubmissions.$inferSelect

export interface EditFields {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  category_id?: string
  category_name?: string
  tags?: string[]
  submission_type?: string
}

export interface ApproveResult {
  status: string
  message: string
}

export interface RejectResult {
  status: string
  message: string
}

export interface PublishResult {
  status: string
  message: string
  postId: string
  postSlug: string | null
}

export interface RequestChangesResult {
  status: string
  message: string
}

export interface EditResult {
  submission: Record<string, unknown>
  message: string
}

// ============================================================================
// Actions
// ============================================================================

/** Approve a pending blog submission */
export async function approveSubmission(
  submission: Submission,
  reviewerId: string,
  reviewNotes?: string | null
): Promise<ApproveResult> {
  await db
    .update(blogSubmissions)
    .set({
      status: APPROVAL_STATUS.APPROVED,
      reviewedBy: reviewerId,
      reviewedAt: sql`NOW()`,
      reviewNotes: reviewNotes || null,
    })
    .where(eq(blogSubmissions.id, submission.id))

  // Fire-and-forget email
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
    submissionId: submission.id,
    reviewerId,
  })

  await notifySubmitterOfStatusChange(
    submission,
    APPROVAL_STATUS.APPROVED,
    'Ihr Beitrag wurde genehmigt',
    `«${submission.title}» wurde vom Redaktionsteam genehmigt und wird bald veröffentlicht.`,
  )

  return { status: APPROVAL_STATUS.APPROVED, message: 'Einreichung genehmigt' }
}

/** Reject a blog submission with a required reason */
export async function rejectSubmission(
  submission: Submission,
  reviewerId: string,
  rejectionReason: string,
  reviewNotes?: string | null
): Promise<RejectResult> {
  await db
    .update(blogSubmissions)
    .set({
      status: APPROVAL_STATUS.REJECTED,
      reviewedBy: reviewerId,
      reviewedAt: sql`NOW()`,
      reviewNotes: reviewNotes || null,
      rejectionReason: rejectionReason,
    })
    .where(eq(blogSubmissions.id, submission.id))

  try {
    await sendEmail(
      submission.submitterEmail,
      'blogSubmissionRejected',
      submission.submitterName,
      submission.title,
      rejectionReason
    )
  } catch (emailError) {
    logger.warn('Failed to send rejection email', { error: emailError })
  }

  logger.info('Blog submission rejected', {
    submissionId: submission.id,
    reviewerId,
    reason: rejectionReason,
  })

  await notifySubmitterOfStatusChange(
    submission,
    APPROVAL_STATUS.REJECTED,
    'Ihr Beitrag wurde abgelehnt',
    `«${submission.title}» wurde leider abgelehnt. Grund: ${rejectionReason}`,
  )

  return { status: APPROVAL_STATUS.REJECTED, message: 'Einreichung abgelehnt' }
}

/** Publish a blog submission — creates a blog post in a transaction */
export async function publishSubmission(
  submission: Submission,
  reviewerId: string,
  reviewNotes?: string | null
): Promise<PublishResult> {
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

    await tx
      .update(blogSubmissions)
      .set({
        status: APPROVAL_STATUS.PUBLISHED,
        reviewedBy: reviewerId,
        reviewedAt: sql`NOW()`,
        reviewNotes: reviewNotes || 'Veröffentlicht',
        publishedPostId: createdPostId,
        publishedAt: sql`NOW()`,
      })
      .where(eq(blogSubmissions.id, submission.id))

    return { postId: createdPostId, postSlug: submission.slug }
  })

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
    submissionId: submission.id,
    postId,
    reviewerId,
  })

  await notifySubmitterOfStatusChange(
    submission,
    APPROVAL_STATUS.PUBLISHED,
    'Ihr Beitrag ist jetzt online',
    `«${submission.title}» wurde veröffentlicht und ist jetzt im Blog verfügbar.`,
  )

  return {
    status: APPROVAL_STATUS.PUBLISHED,
    message: 'Beitrag veröffentlicht',
    postId,
    postSlug,
  }
}

/** Request changes on a blog submission */
export async function requestChanges(
  submission: Submission,
  reviewerId: string,
  reviewNotes: string
): Promise<RequestChangesResult> {
  await db
    .update(blogSubmissions)
    .set({
      status: APPROVAL_STATUS.REQUIRES_CHANGES,
      reviewedBy: reviewerId,
      reviewedAt: sql`NOW()`,
      reviewNotes: reviewNotes,
    })
    .where(eq(blogSubmissions.id, submission.id))

  try {
    await sendEmail(
      submission.submitterEmail,
      'blogSubmissionChangesRequested',
      submission.submitterName,
      submission.title,
      reviewNotes
    )
  } catch (emailError) {
    logger.warn('Failed to send changes requested email', {
      error: emailError,
    })
  }

  logger.info('Blog submission changes requested', {
    submissionId: submission.id,
    reviewerId,
  })

  await notifySubmitterOfStatusChange(
    submission,
    APPROVAL_STATUS.REQUIRES_CHANGES,
    'Überarbeitung erforderlich',
    `Das Redaktionsteam hat Änderungen für «${submission.title}» angefragt: ${reviewNotes}`,
  )

  return {
    status: APPROVAL_STATUS.REQUIRES_CHANGES,
    message: 'Änderungen angefragt',
  }
}

/** Admin edit of a pending submission — tracks edit history */
export async function editSubmission(
  submission: Submission,
  reviewerId: string,
  editorName: string,
  fields: EditFields
): Promise<EditResult | { noChanges: true; submission: Submission }> {
  // Only allow editing pending submissions
  if (submission.status !== APPROVAL_STATUS.PENDING) {
    throw new EditNotAllowedError(
      `Einreichung kann nicht bearbeitet werden (Status: ${submission.status})`
    )
  }

  if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    throw new NoFieldsError('Keine Felder zum Bearbeiten angegeben')
  }

  // Create edit snapshot
  const editEntry = createEditSnapshot(
    submission,
    fields,
    reviewerId,
    editorName
  )

  // No actual changes detected
  if (editEntry.fields_changed.length === 0) {
    return { noChanges: true, submission }
  }

  const updatedHistory = appendEditHistory(
    (submission.editHistory as EditHistoryEntry[] | null) || null,
    editEntry
  )

  // Validate field names against whitelist
  const allowedFields = ['title', 'slug', 'content', 'excerpt', 'category_id', 'category_name', 'tags', 'submission_type']
  const updateFields = Object.keys(fields).filter(f => allowedFields.includes(f))

  if (updateFields.length === 0) {
    throw new NoFieldsError('Keine gültigen Felder zum Bearbeiten')
  }

  const setFragments = updateFields.map((field) =>
    sql`${sql.raw(field)} = ${fields[field as keyof EditFields]}`
  )
  const allSets = [
    ...setFragments,
    sql`edit_history = ${JSON.stringify(updatedHistory)}`,
    sql`last_edited_by = ${reviewerId}`,
    sql`last_edited_at = NOW()`,
    sql`updated_at = NOW()`,
  ]

  const updateResult = await db.execute(sql`
    UPDATE ${sql.raw(getTableName(blogSubmissions))}
    SET ${sql.join(allSets, sql`, `)}
    WHERE id = ${submission.id}
    RETURNING *
  `)

  logger.info('Blog submission edited by admin', {
    submissionId: submission.id,
    editorId: reviewerId,
    fieldsChanged: editEntry.fields_changed,
  })

  return {
    submission: updateResult.rows[0] as Record<string, unknown>,
    message: 'Einreichung erfolgreich aktualisiert',
  }
}

// ============================================================================
// Custom errors for the route to map to HTTP responses
// ============================================================================

export class EditNotAllowedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EditNotAllowedError'
  }
}

export class NoFieldsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NoFieldsError'
  }
}
