/**
 * API: Help Requests
 *
 * GET  /api/admin/team/help-requests - List help requests
 * POST /api/admin/team/help-requests - Create help request
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { helpRequests, users } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import {
  validateCreateHelpRequest,
  validateHelpRequestFilter,
} from '@/lib/schemas/activity'

const targetUser = alias(users, 'target_user')
const resolverUser = alias(users, 'resolver_user')

/**
 * GET /api/admin/team/help-requests
 * List help requests with optional filters
 */
export const GET = withAdmin('team', async (request, session) => {
  try {
    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filterResult = validateHelpRequestFilter({
      status: searchParams.get('status') || undefined,
      urgency: searchParams.get('urgency') || undefined,
      category: searchParams.get('category') || undefined,
      requester_id: searchParams.get('requester_id') || undefined,
      requested_user_id: searchParams.get('requested_user_id') || undefined,
      is_broadcast: searchParams.get('is_broadcast') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    })

    if (!filterResult.success) {
      return apiBadRequest('Ungültige Filterparameter')
    }

    const filters = filterResult.data
    const conditions: SQL[] = []

    if (filters.status) conditions.push(eq(helpRequests.status, filters.status))
    if (filters.urgency) conditions.push(eq(helpRequests.urgency, filters.urgency))
    if (filters.category) conditions.push(eq(helpRequests.category, filters.category))
    if (filters.requester_id) conditions.push(eq(helpRequests.requesterId, filters.requester_id))
    if (filters.requested_user_id) conditions.push(eq(helpRequests.requestedUserId, filters.requested_user_id))
    if (filters.is_broadcast !== undefined) conditions.push(eq(helpRequests.isBroadcast, filters.is_broadcast))

    const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined

    const rows = await db
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
      .where(where)
      .orderBy(
        sql`CASE ${helpRequests.urgency}
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END`,
        desc(helpRequests.createdAt),
      )
      .limit(filters.limit)
      .offset(filters.offset)

    // Get total count for pagination
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(helpRequests)
      .where(where)

    return apiSuccess({
      items: rows,
      total: Number(countRow?.count ?? 0),
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (error) {
    return apiError(error, 'Hilfsanfragen konnten nicht geladen werden')
  }
})

/**
 * POST /api/admin/team/help-requests
 * Create a new help request
 */
export const POST = withAdmin('team', async (request, session) => {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateCreateHelpRequest(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Look up requester user ID from session email
    const [requester] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))

    if (!requester) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    // If targeted request, verify target user exists
    if (data.requested_user_id) {
      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.requested_user_id))

      if (!target) {
        return apiBadRequest('Zielbenutzer nicht gefunden')
      }
    }

    // Insert help request
    const [created] = await db
      .insert(helpRequests)
      .values({
        requesterId: requester.id,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        urgency: data.urgency,
        requestedUserId: data.requested_user_id || null,
      })
      .returning({ id: helpRequests.id })

    logger.info('Help request created', {
      requestId: created.id,
      requesterId: requester.id,
      urgency: data.urgency,
      isBroadcast: !data.requested_user_id,
      title: data.title.substring(0, 50),
    })

    return apiSuccess({ id: created.id }, 201)
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht erstellt werden')
  }
})
