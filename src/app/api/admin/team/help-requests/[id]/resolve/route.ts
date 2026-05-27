/**
 * API: Resolve Help Request
 *
 * POST /api/admin/team/help-requests/[id]/resolve - Mark request as resolved
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { helpRequests, users } from '@/db/schema'
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
import { HELP_REQUEST_STATUS } from '@/config/activity'
import { validateResolveHelpRequest } from '@/lib/schemas/activity'
import { getDbUserId } from '@/lib/api/task-helpers'

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
        ERROR_MESSAGES.VALIDATION_ERROR,
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const { resolution_notes } = validation.data

    // Check if request exists and is not already resolved
    const [existing] = await db
      .select({
        id: helpRequests.id,
        status: helpRequests.status,
        requesterEmail: users.email,
      })
      .from(helpRequests)
      .innerJoin(users, eq(helpRequests.requesterId, users.id))
      .where(eq(helpRequests.id, id))

    if (!existing) {
      return apiNotFound('Hilfsanfrage')
    }

    if (existing.status === HELP_REQUEST_STATUS.RESOLVED) {
      return apiBadRequest('Hilfsanfrage ist bereits gelöst')
    }

    if (existing.status === HELP_REQUEST_STATUS.CANCELLED) {
      return apiBadRequest('Hilfsanfrage wurde abgebrochen')
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    // Update request as resolved
    await db
      .update(helpRequests)
      .set({
        status: HELP_REQUEST_STATUS.RESOLVED,
        resolvedBy: userLookup.dbUserId,
        resolvedAt: sql`NOW()`,
        resolutionNotes: resolution_notes || null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(helpRequests.id, id))

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
