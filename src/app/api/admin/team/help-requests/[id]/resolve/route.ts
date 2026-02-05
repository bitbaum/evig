/**
 * API: Resolve Help Request
 *
 * POST /api/admin/team/help-requests/[id]/resolve - Mark request as resolved
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { canAccessSection } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { validateResolveHelpRequest } from '@/lib/schemas/activity'

interface RequestContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/team/help-requests/[id]/resolve
 * Mark a help request as resolved
 */
export async function POST(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'team')) {
      return apiForbidden('Kein Zugriff auf Team-Bereich')
    }

    const { id } = await context.params
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

    if (existing.rows[0].status === 'resolved') {
      return apiBadRequest('Hilfsanfrage ist bereits gelöst')
    }

    if (existing.rows[0].status === 'cancelled') {
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
       SET status = 'resolved',
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
}
