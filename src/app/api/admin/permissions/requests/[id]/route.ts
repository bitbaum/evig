/**
 * API: Approve/Reject Permission Request
 *
 * POST /api/admin/permissions/requests/[id]
 * Super admins can approve or reject permission requests.
 */

import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin } from '@/lib/permissions'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { TABLE_NAMES } from '@/config/database'
import { apiSuccess, apiError, apiForbidden, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { runReviewTransition, type ReviewGuard } from '@/lib/lifecycle/review-workflow'
import type { TransitionTable } from '@/lib/lifecycle'
import type { WorkflowEvent } from '@/lib/lifecycle/dispatch'

interface PermissionRequestRow extends Record<string, unknown> {
  status: string
  user_id: string
  requested_sections: string[]
}

const PERMISSION_REQUEST_TRANSITIONS: TransitionTable = [
  { action: 'approve', from: PERMISSION_REQUEST_STATUS.PENDING, to: PERMISSION_REQUEST_STATUS.APPROVED },
  { action: 'reject', from: PERMISSION_REQUEST_STATUS.PENDING, to: PERMISSION_REQUEST_STATUS.REJECTED },
]

const SUPER_ADMIN_GUARD: readonly ReviewGuard<PermissionRequestRow>[] = [
  {
    code: 'super_admin_only',
    check: (_row, actor) => actor.role === 'super_admin',
  },
]

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
      return apiBadRequest('Ungültige Aktion. Verwende "approve" oder "reject"')
    }

    const reviewNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null
    const result = await runReviewTransition<PermissionRequestRow>({
      target: {
        table: TABLE_NAMES.STAFF_PERMISSION_REQUESTS,
        select: ['user_id', 'requested_sections'],
      },
      transitions: PERMISSION_REQUEST_TRANSITIONS,
      id,
      action,
      actor: { id: session.user.id, role: 'super_admin' },
      guards: SUPER_ADMIN_GUARD,
      reason: reviewNotes,
      applyInTxn: async (tx, row, ctx) => {
        if (ctx.action !== 'approve') return
        await tx.execute(sql`
          UPDATE users
          SET
            staff_permissions = ARRAY(
              SELECT DISTINCT permission
              FROM unnest(COALESCE(staff_permissions, ARRAY[]::text[]) || ${row.requested_sections}::text[]) AS permission
            ),
            is_staff = true
          WHERE id = ${row.user_id}
        `)
      },
      emit: (row, ctx): WorkflowEvent => ({
        type: NOTIFICATION_TYPES.PERMISSION_REQUEST_REVIEWED,
        recipients: { userId: row.user_id },
        title: ctx.action === 'approve' ? 'Berechtigungsanfrage genehmigt' : 'Berechtigungsanfrage abgelehnt',
        content: ctx.action === 'approve'
          ? `Deine Anfrage für ${row.requested_sections.join(', ')} wurde genehmigt.`
          : `Deine Anfrage für ${row.requested_sections.join(', ')} wurde abgelehnt.${reviewNotes ? ` Hinweis: ${reviewNotes}` : ''}`,
      }),
    })

    if (!result.ok) {
      if (result.code === 'not_found') return apiNotFound('Berechtigungsanfrage')
      if (result.code === 'guard_failed' && result.guard === 'super_admin_only') {
        return apiForbidden('Nur Super-Admins können Berechtigungsanfragen genehmigen')
      }
      return apiBadRequest('Diese Anfrage wurde bereits bearbeitet')
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
