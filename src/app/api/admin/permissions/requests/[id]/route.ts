/**
 * API: Approve/Reject Permission Request
 *
 * POST /api/admin/permissions/requests/[id]
 * Super admins can approve or reject permission requests.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { staffPermissionRequests, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin } from '@/lib/permissions'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'
import { apiSuccess, apiError, apiForbidden, apiBadRequest, apiNotFound } from '@/lib/api/helpers'

export const POST = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    // Only super admins can approve/reject
    if (!isSuperAdmin(session.user.email)) {
      return apiForbidden('Nur Super-Admins können Berechtigungsanfragen genehmigen')
    }

    const { id } = context!.params!
    const body = await request.json()
    const { action, notes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return apiBadRequest('Ungültige Aktion. Verwenden Sie "approve" oder "reject"')
    }

    // Get the request details
    const [permRequest] = await db
      .select({
        id: staffPermissionRequests.id,
        userId: staffPermissionRequests.userId,
        requestedSections: staffPermissionRequests.requestedSections,
        status: staffPermissionRequests.status,
      })
      .from(staffPermissionRequests)
      .where(eq(staffPermissionRequests.id, id))

    if (!permRequest) {
      return apiNotFound('Berechtigungsanfrage')
    }

    if (permRequest.status !== PERMISSION_REQUEST_STATUS.PENDING) {
      return apiBadRequest('Diese Anfrage wurde bereits bearbeitet')
    }

    // Update the request status
    await db
      .update(staffPermissionRequests)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: sql`NOW()`,
        reviewNotes: notes || null,
      })
      .where(eq(staffPermissionRequests.id, id))

    // If approved, add the permissions to the user
    if (action === 'approve') {
      const [user] = await db
        .select({ staffPermissions: users.staffPermissions })
        .from(users)
        .where(eq(users.id, permRequest.userId))

      const currentPermissions = user?.staffPermissions || []
      const newPermissions = [...new Set([...currentPermissions, ...permRequest.requestedSections])]

      await db
        .update(users)
        .set({
          staffPermissions: newPermissions,
          isStaff: true,
        })
        .where(eq(users.id, permRequest.userId))
    }

    return apiSuccess({
      message: action === 'approve'
        ? 'Berechtigungsanfrage genehmigt. Der Benutzer hat nun Zugriff auf die angeforderten Bereiche.'
        : 'Berechtigungsanfrage abgelehnt.',
    })
  } catch (error) {
    return apiError(error, 'Berechtigungsanfrage konnte nicht verarbeitet werden')
  }
})
