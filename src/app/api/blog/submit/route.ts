/**
 * API: Blog Submissions (Admin)
 *
 * GET /api/blog/submit - Admin: List all submissions
 *
 * For public submissions, use POST /api/public/blog/submit
 */

import { NextRequest } from 'next/server'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
} from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { db } from '@/db'
import { blogSubmissions, blogCategories, users } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { canAccessSection } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Authentication required
    const session = await auth()
    if (!session?.user) {
      return apiUnauthorized('Anmeldung erforderlich')
    }

    // Check admin access
    const userForPermissions = {
      email: session.user.email || '',
      is_staff: session.user.isStaff || false,
      staff_permissions: session.user.staffPermissions || [],
    }

    if (!canAccessSection(userForPermissions, 'content')) {
      return apiUnauthorized('Keine Berechtigung für diesen Bereich')
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const reviewer = alias(users, 'reviewer')

    const conditions = []
    if (status && status !== 'all') {
      conditions.push(eq(blogSubmissions.status, status))
    }

    const where = conditions.length > 0 ? conditions[0] : undefined

    const rows = await db
      .select({
        id: blogSubmissions.id,
        submitter_name: blogSubmissions.submitterName,
        submitter_email: blogSubmissions.submitterEmail,
        user_id: blogSubmissions.userId,
        title: blogSubmissions.title,
        slug: blogSubmissions.slug,
        content: blogSubmissions.content,
        excerpt: blogSubmissions.excerpt,
        submission_type: blogSubmissions.submissionType,
        category_id: blogSubmissions.categoryId,
        category_name: blogSubmissions.categoryName,
        category_label: blogCategories.name,
        tags: blogSubmissions.tags,
        status: blogSubmissions.status,
        reviewed_by: blogSubmissions.reviewedBy,
        reviewed_at: blogSubmissions.reviewedAt,
        review_notes: blogSubmissions.reviewNotes,
        rejection_reason: blogSubmissions.rejectionReason,
        published_post_id: blogSubmissions.publishedPostId,
        published_at: blogSubmissions.publishedAt,
        submitted_at: blogSubmissions.submittedAt,
        reviewer_name: reviewer.name,
      })
      .from(blogSubmissions)
      .leftJoin(blogCategories, eq(blogSubmissions.categoryId, blogCategories.id))
      .leftJoin(reviewer, eq(blogSubmissions.reviewedBy, reviewer.id))
      .where(where)
      .orderBy(desc(blogSubmissions.submittedAt))

    return apiSuccess({ submissions: rows })
  } catch (error) {
    logger.error('Failed to fetch blog submissions', { error })
    return apiError(error, 'Fehler beim Laden der Einreichungen')
  }
}
