/**
 * API: Resolve Help Request
 *
 * POST /api/admin/team/help-requests/[id]/resolve - Mark request as resolved
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { HELP_REQUEST_STATUS } from '@/config/help-request-status'
import { validateResolveHelpRequest } from '@/lib/schemas/activity'

/**
 * POST /api/admin/team/help-requests/[id]/resolve
 * Mark a help request as resolved
 */
export const POST = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()

    // Validate input
    const validation = validateResolveHelpRequest(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { resolution_notes } = validation.data

    // Check if request exists and is not already resolved
    const existing = await query<{ id: string; status: string; requester_email: string }>(
      `SELECT hr.id, hr.status, u.email as requester_email
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       JOIN ${TABLE_NAMES.USERS} u ON hr.requester_id = u.id
       WHERE hr.id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Hilfsanfrage')
    }

    if (existing.rows[0].status === HELP_REQUEST_STATUS.RESOLVED) {
      return apiBadRequest('Hilfsanfrage ist bereits gelöst')
    }

    if (existing.rows[0].status === HELP_REQUEST_STATUS.CANCELLED) {
      return apiBadRequest('Hilfsanfrage wurde abgebrochen')
    }

    // Look up resolver user ID from session email (lowercase to match auth system)
    const resolverResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [session.user.email.toLowerCase()]
    )

    if (resolverResult.rows.length === 0) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    const resolverId = resolverResult.rows[0].id

    // Update request as resolved
    await query(
      `UPDATE ${TABLE_NAMES.HELP_REQUESTS}
       SET status = '${HELP_REQUEST_STATUS.RESOLVED}',
           resolved_by = $1,
           resolved_at = NOW(),
           resolution_notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [resolverId, resolution_notes || null, id]
    )

    logger.info('Help request resolved', {
      requestId: id,
      resolvedBy: session.user.email,
      hasNotes: !!resolution_notes,
    })

    return apiSuccess({
      message: 'Hilfsanfrage gelöst',
      resolved_at: new Date().toISOString(),
    })
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht gelöst werden')
  }
})
