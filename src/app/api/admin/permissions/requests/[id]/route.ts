/**
 * API: Approve/Reject Permission Request
 *
 * POST /api/admin/permissions/requests/[id]
 * Super admins can approve or reject permission requests.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { isSuperAdmin } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
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
    const requestResult = await query<{
      id: string
      user_id: string
      requested_sections: string[]
      status: string
    }>(
      `SELECT id, user_id, requested_sections, status
       FROM ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS}
       WHERE id = $1`,
      [id]
    )

    if (requestResult.rows.length === 0) {
      return apiNotFound('Berechtigungsanfrage')
    }

    const permRequest = requestResult.rows[0]

    if (permRequest.status !== PERMISSION_REQUEST_STATUS.PENDING) {
      return apiBadRequest('Diese Anfrage wurde bereits bearbeitet')
    }

    // Update the request status
    await query(
      `UPDATE ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS}
       SET status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_notes = $3
       WHERE id = $4`,
      [action === 'approve' ? 'approved' : 'rejected', session.user.id, notes || null, id]
    )

    // If approved, add the permissions to the user
    if (action === 'approve') {
      // Get current permissions
      const userResult = await query<{ staff_permissions: string[] | null }>(
        `SELECT staff_permissions FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
        [permRequest.user_id]
      )

      const currentPermissions = userResult.rows[0]?.staff_permissions || []

      // Merge new permissions (avoid duplicates)
      const newPermissions = [...new Set([...currentPermissions, ...permRequest.requested_sections])]

      // Update user permissions
      await query(
        `UPDATE ${TABLE_NAMES.USERS}
         SET staff_permissions = $1,
             is_staff = true
         WHERE id = $2`,
        [newPermissions, permRequest.user_id]
      )
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
