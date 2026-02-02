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
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
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

    // Build query
    let sql = `
      SELECT
        s.id,
        s.submitter_name,
        s.submitter_email,
        s.user_id,
        s.title,
        s.slug,
        s.content,
        s.excerpt,
        s.submission_type,
        s.category_id,
        s.category_name,
        c.name as category_label,
        s.tags,
        s.status,
        s.reviewed_by,
        s.reviewed_at,
        s.review_notes,
        s.rejection_reason,
        s.published_post_id,
        s.published_at,
        s.submitted_at,
        r.name as reviewer_name
      FROM ${TABLE_NAMES.BLOG_SUBMISSIONS} s
      LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON s.category_id = c.id
      LEFT JOIN ${TABLE_NAMES.USERS} r ON s.reviewed_by = r.id
    `

    const params: string[] = []
    if (status && status !== 'all') {
      sql += ` WHERE s.status = $1`
      params.push(status)
    }

    sql += ` ORDER BY s.submitted_at DESC`

    const result = await query(sql, params)

    return apiSuccess({ submissions: result.rows })
  } catch (error) {
    logger.error('Failed to fetch blog submissions', { error })
    return apiError(error, 'Fehler beim Laden der Einreichungen')
  }
}
