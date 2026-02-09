/**
 * Admin Approval Action API
 * PATCH /api/admin/approvals/[id] - Approve or reject a content submission
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return apiForbidden('Nicht authentifiziert')
    }

    const user = {
      email: session.user.email || '',
      is_staff: (session.user as Record<string, unknown>).isStaff as boolean,
      staff_permissions: (session.user as Record<string, unknown>).staffPermissions as string[],
    }

    if (!canAccessSection(user, 'approvals')) {
      return apiForbidden('Keine Berechtigung für Freigaben')
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return apiBadRequest('Ungültige Aktion. Erwartet: approve oder reject')
    }

    // Verify submission exists and is pending
    const submissionResult = await query(
      `SELECT id, status, title FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} WHERE id = $1`,
      [id]
    )

    if (submissionResult.rows.length === 0) {
      return apiNotFound('Einreichung nicht gefunden')
    }

    const submission = submissionResult.rows[0] as { id: string; status: string; title: string }

    if (submission.status !== 'pending') {
      return apiBadRequest('Diese Einreichung wurde bereits bearbeitet')
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    await query(
      `UPDATE ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [newStatus, session.user.id, id]
    )

    logger.info('Content submission reviewed', {
      submissionId: id,
      action: newStatus,
      reviewerId: session.user.id,
      title: submission.title,
    })

    return apiSuccess({
      message: action === 'approve' ? 'Inhalt genehmigt' : 'Inhalt abgelehnt',
      status: newStatus,
    })
  } catch (error) {
    logger.error('Error processing approval', { error })
    return apiError(error, 'Freigabe konnte nicht verarbeitet werden')
  }
}
