/**
 * API: List Permission Requests
 *
 * GET /api/admin/permissions/requests
 * Super admins can see all pending permission requests.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { staffPermissionRequests, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin } from '@/lib/permissions'
import { apiSuccess, apiError, apiForbidden } from '@/lib/api/helpers'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'

const reviewer = alias(users, 'reviewer')

export const GET = withAdmin('users', async (request, session) => {
  try {
    // Only super admins can view permission requests
    if (!isSuperAdmin(session.user.email)) {
      return apiForbidden('Nur Super-Admins können Berechtigungsanfragen einsehen')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || PERMISSION_REQUEST_STATUS.PENDING

    const rows = await db
      .select({
        id: staffPermissionRequests.id,
        user_id: staffPermissionRequests.userId,
        user_name: users.name,
        user_email: users.email,
        requested_sections: staffPermissionRequests.requestedSections,
        reason: staffPermissionRequests.reason,
        status: staffPermissionRequests.status,
        created_at: staffPermissionRequests.createdAt,
        reviewed_by: staffPermissionRequests.reviewedBy,
        reviewer_name: reviewer.name,
        reviewed_at: staffPermissionRequests.reviewedAt,
        review_notes: staffPermissionRequests.reviewNotes,
      })
      .from(staffPermissionRequests)
      .innerJoin(users, eq(staffPermissionRequests.userId, users.id))
      .leftJoin(reviewer, eq(staffPermissionRequests.reviewedBy, reviewer.id))
      .where(eq(staffPermissionRequests.status, status))
      .orderBy(desc(staffPermissionRequests.createdAt))
      .limit(100)

    return apiSuccess({ requests: rows })
  } catch (error) {
    return apiError(error, 'Berechtigungsanfragen konnten nicht geladen werden')
  }
})
