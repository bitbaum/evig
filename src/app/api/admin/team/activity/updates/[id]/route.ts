/**
 * API: Activity Update Detail
 *
 * GET    /api/admin/team/activity/updates/[id] - Get update details
 * PUT    /api/admin/team/activity/updates/[id] - Update activity
 * DELETE /api/admin/team/activity/updates/[id] - Delete activity
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { activityUpdates, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateUpdateActivityUpdate } from '@/lib/schemas/activity'

/**
 * GET /api/admin/team/activity/updates/[id]
 * Get activity update details
 */
export const GET = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!

    const [row] = await db
      .select({
        id: activityUpdates.id,
        user_id: activityUpdates.userId,
        user_name: users.name,
        user_email: users.email,
        update_type: activityUpdates.updateType,
        title: activityUpdates.title,
        description: activityUpdates.description,
        category: activityUpdates.category,
        visibility: activityUpdates.visibility,
        occurred_at: activityUpdates.occurredAt,
        created_at: activityUpdates.createdAt,
        updated_at: activityUpdates.updatedAt,
      })
      .from(activityUpdates)
      .innerJoin(users, eq(activityUpdates.userId, users.id))
      .where(eq(activityUpdates.id, id))

    if (!row) {
      return apiNotFound('Aktivität')
    }

    return apiSuccess(row)
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht geladen werden')
  }
})

/**
 * PUT /api/admin/team/activity/updates/[id]
 * Update an activity update
 */
export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!
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

    // Get existing update to check existence
    const [existing] = await db
      .select({ id: activityUpdates.id, userId: activityUpdates.userId, userEmail: users.email })
      .from(activityUpdates)
      .innerJoin(users, eq(activityUpdates.userId, users.id))
      .where(eq(activityUpdates.id, id))

    if (!existing) {
      return apiNotFound('Aktivität')
    }

    // Build update object
    const update: Record<string, unknown> = {}
    if (data.update_type !== undefined) update.updateType = data.update_type
    if (data.title !== undefined) update.title = data.title
    if (data.description !== undefined) update.description = data.description
    if (data.category !== undefined) update.category = data.category
    if (data.visibility !== undefined) update.visibility = data.visibility
    if (data.occurred_at !== undefined) update.occurredAt = data.occurred_at

    if (Object.keys(update).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    update.updatedAt = sql`NOW()`
    await db.update(activityUpdates).set(update).where(eq(activityUpdates.id, id))

    logger.info('Activity update modified', {
      updateId: id,
      modifiedBy: session.user.email,
      fields: Object.keys(data),
    })

    return apiSuccess({ message: 'Aktivität aktualisiert' })
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht aktualisiert werden')
  }
})

/**
 * DELETE /api/admin/team/activity/updates/[id]
 * Delete an activity update
 */
export const DELETE = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Get existing update to check existence
    const [existing] = await db
      .select({ id: activityUpdates.id, userId: activityUpdates.userId, userEmail: users.email })
      .from(activityUpdates)
      .innerJoin(users, eq(activityUpdates.userId, users.id))
      .where(eq(activityUpdates.id, id))

    if (!existing) {
      return apiNotFound('Aktivität')
    }

    await db.delete(activityUpdates).where(eq(activityUpdates.id, id))

    logger.info('Activity update deleted', {
      updateId: id,
      deletedBy: session.user.email,
    })

    return apiSuccess({ message: 'Aktivität gelöscht' })
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht gelöscht werden')
  }
})
