/**
 * API: Help Request Detail
 *
 * GET /api/admin/team/help-requests/[id] - Get request details
 * PUT /api/admin/team/help-requests/[id] - Update request
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { helpRequests, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateUpdateHelpRequest } from '@/lib/schemas/activity'

const targetUser = alias(users, 'target_user')
const resolverUser = alias(users, 'resolver_user')

/**
 * GET /api/admin/team/help-requests/[id]
 * Get help request details
 */
export const GET = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!

    const [row] = await db
      .select({
        id: helpRequests.id,
        requester_id: helpRequests.requesterId,
        requester_name: users.name,
        requester_email: users.email,
        title: helpRequests.title,
        description: helpRequests.description,
        category: helpRequests.category,
        urgency: helpRequests.urgency,
        requested_user_id: helpRequests.requestedUserId,
        requested_user_name: targetUser.name,
        requested_user_email: targetUser.email,
        is_broadcast: helpRequests.isBroadcast,
        status: helpRequests.status,
        resolved_by: helpRequests.resolvedBy,
        resolved_by_name: resolverUser.name,
        resolved_at: helpRequests.resolvedAt,
        resolution_notes: helpRequests.resolutionNotes,
        created_at: helpRequests.createdAt,
        updated_at: helpRequests.updatedAt,
      })
      .from(helpRequests)
      .innerJoin(users, eq(helpRequests.requesterId, users.id))
      .leftJoin(targetUser, eq(helpRequests.requestedUserId, targetUser.id))
      .leftJoin(resolverUser, eq(helpRequests.resolvedBy, resolverUser.id))
      .where(eq(helpRequests.id, id))

    if (!row) {
      return apiNotFound('Hilfsanfrage')
    }

    return apiSuccess(row)
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht geladen werden')
  }
})

/**
 * PUT /api/admin/team/help-requests/[id]
 * Update a help request
 */
export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()

    // Validate input
    const validation = validateUpdateHelpRequest(body)
    if (!validation.success) {
      return apiBadRequest(
        ERROR_MESSAGES.VALIDATION_ERROR,
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Check existence
    const [existing] = await db
      .select({ id: helpRequests.id })
      .from(helpRequests)
      .where(eq(helpRequests.id, id))

    if (!existing) {
      return apiNotFound('Hilfsanfrage')
    }

    // Build dynamic update
    const update: Record<string, unknown> = {}

    if (data.title !== undefined) update.title = data.title
    if (data.description !== undefined) update.description = data.description
    if (data.category !== undefined) update.category = data.category
    if (data.urgency !== undefined) update.urgency = data.urgency
    if (data.status !== undefined) update.status = data.status

    if (Object.keys(update).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    update.updatedAt = sql`NOW()`

    await db
      .update(helpRequests)
      .set(update)
      .where(eq(helpRequests.id, id))

    logger.info('Help request updated', {
      requestId: id,
      updatedBy: session.user.email,
      fields: Object.keys(data),
    })

    return apiSuccess({ message: 'Hilfsanfrage aktualisiert' })
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht aktualisiert werden')
  }
})
