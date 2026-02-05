/**
 * API: Help Request Detail
 *
 * GET /api/admin/team/help-requests/[id] - Get request details
 * PUT /api/admin/team/help-requests/[id] - Update request
 *
 * Access: Staff with 'team' permission (or own request)
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
import { validateUpdateHelpRequest } from '@/lib/schemas/activity'

interface RequestContext {
  params: Promise<{ id: string }>
}

interface HelpRequest {
  id: string
  requester_id: string
  requester_name: string | null
  requester_email: string
  title: string
  description: string | null
  category: string | null
  urgency: string
  requested_user_id: string | null
  requested_user_name: string | null
  requested_user_email: string | null
  is_broadcast: boolean
  status: string
  resolved_by: string | null
  resolved_by_name: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * GET /api/admin/team/help-requests/[id]
 * Get help request details
 */
export async function GET(request: NextRequest, context: RequestContext) {
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

    const result = await query<HelpRequest>(
      `SELECT
        hr.id,
        hr.requester_id,
        req_u.name as requester_name,
        req_u.email as requester_email,
        hr.title,
        hr.description,
        hr.category,
        hr.urgency,
        hr.requested_user_id,
        target_u.name as requested_user_name,
        target_u.email as requested_user_email,
        hr.is_broadcast,
        hr.status,
        hr.resolved_by,
        resolver_u.name as resolved_by_name,
        hr.resolved_at,
        hr.resolution_notes,
        hr.created_at,
        hr.updated_at
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       JOIN ${TABLE_NAMES.USERS} req_u ON hr.requester_id = req_u.id
       LEFT JOIN ${TABLE_NAMES.USERS} target_u ON hr.requested_user_id = target_u.id
       LEFT JOIN ${TABLE_NAMES.USERS} resolver_u ON hr.resolved_by = resolver_u.id
       WHERE hr.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Hilfsanfrage')
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht geladen werden')
  }
}

/**
 * PUT /api/admin/team/help-requests/[id]
 * Update a help request
 */
export async function PUT(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const { id } = await context.params
    const body = await request.json()

    // Validate input
    const validation = validateUpdateHelpRequest(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Get existing request to check ownership
    const existing = await query<{ id: string; requester_id: string; requester_email: string }>(
      `SELECT hr.id, hr.requester_id, u.email as requester_email
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       JOIN ${TABLE_NAMES.USERS} u ON hr.requester_id = u.id
       WHERE hr.id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Hilfsanfrage')
    }

    const isOwnRequest = existing.rows[0].requester_email === session.user.email

    // Allow if own request OR has team permission
    if (!isOwnRequest) {
      const user = {
        email: session.user.email,
        is_staff: session.user.isStaff,
        staff_permissions: session.user.staffPermissions,
      }

      if (!canAccessSection(user, 'team')) {
        return apiForbidden('Kein Zugriff')
      }
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: (string | null)[] = []
    let paramIndex = 1

    const allowedFields = ['title', 'description', 'category', 'urgency', 'status']

    for (const field of allowedFields) {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = $${paramIndex}`)
        values.push(data[field as keyof typeof data] as string | null)
        paramIndex++
      }
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Felder zum Aktualisieren')
    }

    values.push(id)

    await query(
      `UPDATE ${TABLE_NAMES.HELP_REQUESTS}
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}`,
      values
    )

    logger.info('Help request updated', {
      requestId: id,
      updatedBy: session.user.email,
      fields: Object.keys(data),
    })

    return apiSuccess({ message: 'Hilfsanfrage aktualisiert' })
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht aktualisiert werden')
  }
}
