/**
 * Protocols API
 *
 * GET /api/protocols - List protocols with filters
 * POST /api/protocols - Create a new protocol
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { getDbUserId } from '@/lib/api/task-helpers'
import { isSuperAdmin } from '@/lib/permissions'
import { createProtocolSchema } from '@/lib/schemas/protocols'
import { getProtocols, createProtocol } from '@/lib/services/protocols'
import { logger } from '@/lib/logger'

/**
 * GET /api/protocols
 * List protocols with visibility filtering
 */
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const meetingType = searchParams.get('meeting_type') || undefined
    const status = searchParams.get('status') || undefined

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const isAdmin = isSuperAdmin(session.user.email)

    const protocols = await getProtocols(dbUserId, isAdmin, {
      meeting_type: meetingType,
      status,
    })

    return apiSuccess(protocols)
  } catch (error) {
    logger.error('Error fetching protocols', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden der Protokolle')
  }
})

/**
 * POST /api/protocols
 * Create a new protocol
 */
export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const result = createProtocolSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.VALIDATION_FAILED, result.error.flatten().fieldErrors)
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const protocol = await createProtocol(result.data, dbUserId)

    logger.info('Protocol created', {
      protocolId: protocol.id,
      userId: dbUserId,
      title: result.data.title,
    })

    return apiSuccess(protocol, 201)
  } catch (error) {
    logger.error('Error creating protocol', { error, email: session.user.email })
    // Staff-only endpoint: include the underlying cause so the team can act
    // on failures directly instead of guessing from a blanket message.
    const detail = error instanceof Error && error.message ? ` – ${error.message}` : ''
    return apiError(error, `${ERROR_MESSAGES.PROTOCOL_CREATE_FAILED}${detail}`)
  }
})
