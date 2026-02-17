/**
 * Protocol Detail API
 *
 * GET /api/protocols/[id] - Get single protocol
 * PATCH /api/protocols/[id] - Update protocol (draft/review only)
 * DELETE /api/protocols/[id] - Delete protocol (creator or super admin)
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { isSuperAdmin } from '@/lib/permissions'
import { updateProtocolSchema } from '@/lib/schemas/protocols'
import { getProtocolById, updateProtocol, deleteProtocol } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

/**
 * GET /api/protocols/[id]
 */
export const GET = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const isAdmin = isSuperAdmin(session.user.email)

    const protocol = await getProtocolById(protocolId, dbUserId, isAdmin)

    if (!protocol) {
      return apiNotFound('Protokoll')
    }

    return apiSuccess(protocol)
  } catch (error) {
    logger.error('Error fetching protocol', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden des Protokolls')
  }
})

/**
 * PATCH /api/protocols/[id]
 */
export const PATCH = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const body = await request.json()
    const result = updateProtocolSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const updated = await updateProtocol(protocolId, result.data, dbUserId)

    if (!updated) {
      return apiNotFound('Protokoll')
    }

    logger.info('Protocol updated', {
      protocolId,
      userId: dbUserId,
      fields: Object.keys(result.data),
    })

    return apiSuccess(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'PROTOCOL_NOT_EDITABLE') {
      return apiBadRequest(ERROR_MESSAGES.PROTOCOL_NOT_EDITABLE)
    }
    logger.error('Error updating protocol', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Aktualisieren des Protokolls')
  }
})

/**
 * DELETE /api/protocols/[id]
 */
export const DELETE = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const isAdmin = isSuperAdmin(session.user.email)

    const result = await deleteProtocol(protocolId, dbUserId, isAdmin)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Protokoll')
      return apiBadRequest('Keine Berechtigung zum Löschen dieses Protokolls')
    }

    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Error deleting protocol', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Löschen des Protokolls')
  }
})
