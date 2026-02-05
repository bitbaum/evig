/**
 * API: Activity Update Detail
 *
 * GET    /api/admin/team/activity/updates/[id] - Get update details
 * PUT    /api/admin/team/activity/updates/[id] - Update activity
 * DELETE /api/admin/team/activity/updates/[id] - Delete activity
 *
 * Access: Staff with 'team' permission (or own update)
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
import { validateUpdateActivityUpdate } from '@/lib/schemas/activity'

interface RequestContext {
  params: Promise<{ id: string }>
}

interface ActivityUpdate {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  update_type: string
  title: string
  description: string | null
  category: string | null
  visibility: string
  occurred_at: string
  created_at: string
  updated_at: string
}

/**
 * GET /api/admin/team/activity/updates/[id]
 * Get activity update details
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

    const result = await query<ActivityUpdate>(
      `SELECT
        au.id,
        au.user_id,
        u.name as user_name,
        u.email as user_email,
        au.update_type,
        au.title,
        au.description,
        au.category,
        au.visibility,
        au.occurred_at,
        au.created_at,
        au.updated_at
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
       WHERE au.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Aktivität')
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht geladen werden')
  }
}

/**
 * PUT /api/admin/team/activity/updates/[id]
 * Update an activity update
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
    const validation = validateUpdateActivityUpdate(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Get existing update to check ownership
    const existing = await query<{ id: string; user_id: string; user_email: string }>(
      `SELECT au.id, au.user_id, u.email as user_email
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
       WHERE au.id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Aktivität')
    }

    const isOwnUpdate = existing.rows[0].user_email === session.user.email

    // Allow if own update OR has team permission
    if (!isOwnUpdate) {
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

    const allowedFields = ['update_type', 'title', 'description', 'category', 'visibility', 'occurred_at']

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
      `UPDATE ${TABLE_NAMES.ACTIVITY_UPDATES}
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}`,
      values
    )

    logger.info('Activity update modified', {
      updateId: id,
      modifiedBy: session.user.email,
      fields: Object.keys(data),
    })

    return apiSuccess({ message: 'Aktivität aktualisiert' })
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht aktualisiert werden')
  }
}

/**
 * DELETE /api/admin/team/activity/updates/[id]
 * Delete an activity update
 */
export async function DELETE(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const { id } = await context.params

    // Get existing update to check ownership
    const existing = await query<{ id: string; user_id: string; user_email: string }>(
      `SELECT au.id, au.user_id, u.email as user_email
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
       WHERE au.id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound('Aktivität')
    }

    const isOwnUpdate = existing.rows[0].user_email === session.user.email

    // Allow if own update OR has team permission
    if (!isOwnUpdate) {
      const user = {
        email: session.user.email,
        is_staff: session.user.isStaff,
        staff_permissions: session.user.staffPermissions,
      }

      if (!canAccessSection(user, 'team')) {
        return apiForbidden('Kein Zugriff')
      }
    }

    await query(
      `DELETE FROM ${TABLE_NAMES.ACTIVITY_UPDATES} WHERE id = $1`,
      [id]
    )

    logger.info('Activity update deleted', {
      updateId: id,
      deletedBy: session.user.email,
    })

    return apiSuccess({ message: 'Aktivität gelöscht' })
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht gelöscht werden')
  }
}
