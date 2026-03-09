/**
 * API: Activity Updates
 *
 * GET  /api/admin/team/activity/updates - List activity updates
 * POST /api/admin/team/activity/updates - Create activity update
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { activityUpdates, users } from '@/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import {
  validateCreateActivityUpdate,
  activityStreamFilterSchema,
} from '@/lib/schemas/activity'

/**
 * GET /api/admin/team/activity/updates
 * List activity updates with optional filters
 */
export const GET = withAdmin('team', async (request, session) => {
  try {
    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filterResult = activityStreamFilterSchema.safeParse({
      user_id: searchParams.get('user_id') || undefined,
      category: searchParams.get('category') || undefined,
      since: searchParams.get('since') || undefined,
      until: searchParams.get('until') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    })

    if (!filterResult.success) {
      return apiBadRequest('Ungültige Filterparameter')
    }

    const filters = filterResult.data

    // Build dynamic filters
    const conditions: SQL[] = []
    if (filters.user_id) conditions.push(eq(activityUpdates.userId, filters.user_id))
    if (filters.category) conditions.push(eq(activityUpdates.category, filters.category))
    if (filters.since) conditions.push(gte(activityUpdates.occurredAt, filters.since))
    if (filters.until) conditions.push(lte(activityUpdates.occurredAt, filters.until))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch items
    const items = await db
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
      .where(where)
      .orderBy(desc(activityUpdates.occurredAt))
      .limit(filters.limit)
      .offset(filters.offset)

    // Get total count for pagination
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityUpdates)
      .where(where)

    return apiSuccess({
      items,
      total: Number(countRow?.count ?? 0),
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (error) {
    return apiError(error, 'Aktivitäten konnten nicht geladen werden')
  }
})

/**
 * POST /api/admin/team/activity/updates
 * Create a new activity update
 */
export const POST = withAdmin('team', async (request, session) => {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateCreateActivityUpdate(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Look up user ID from session email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))

    if (!user) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    // Insert activity update
    const [created] = await db
      .insert(activityUpdates)
      .values({
        userId: user.id,
        updateType: data.update_type,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        visibility: data.visibility,
        occurredAt: data.occurred_at || new Date().toISOString(),
      })
      .returning({ id: activityUpdates.id })

    logger.info('Activity update created', {
      updateId: created.id,
      userId: user.id,
      type: data.update_type,
      title: data.title.substring(0, 50),
    })

    return apiSuccess({ id: created.id }, 201)
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht erstellt werden')
  }
})
