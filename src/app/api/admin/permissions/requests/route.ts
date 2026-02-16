/**
 * API: List Permission Requests
 *
 * GET /api/admin/permissions/requests
 * Super admins can see all pending permission requests.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { isSuperAdmin } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { apiSuccess, apiError, apiForbidden } from '@/lib/api/helpers'

interface PermissionRequest {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  requested_sections: string[]
  reason: string
  status: string
  created_at: string
  reviewed_by: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  review_notes: string | null
}

export const GET = withAdmin(async (request, session) => {
  try {
    // Only super admins can view permission requests
    if (!isSuperAdmin(session.user.email)) {
      return apiForbidden('Nur Super-Admins können Berechtigungsanfragen einsehen')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const result = await query<PermissionRequest>(
      `SELECT
        r.id,
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        r.requested_sections,
        r.reason,
        r.status,
        r.created_at,
        r.reviewed_by,
        rev.name as reviewer_name,
        r.reviewed_at,
        r.review_notes
       FROM ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS} r
       JOIN ${TABLE_NAMES.USERS} u ON r.user_id = u.id
       LEFT JOIN ${TABLE_NAMES.USERS} rev ON r.reviewed_by = rev.id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [status]
    )

    return apiSuccess({ requests: result.rows })
  } catch (error) {
    return apiError(error, 'Berechtigungsanfragen konnten nicht geladen werden')
  }
})
