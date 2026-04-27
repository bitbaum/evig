/**
 * Protocol Finalize API
 *
 * POST /api/protocols/[id]/finalize - Mark protocol as finalized
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { finalizeProtocol } from '@/lib/services/protocols'
import { notifyAllStaff } from '@/lib/services/notifications'
import { RELATED_TYPES } from '@/config/notifications'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

/**
 * POST /api/protocols/[id]/finalize
 */
export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const success = await finalizeProtocol(protocolId)

    if (!success) {
      return apiNotFound('Protokoll (oder nicht im Status "review")')
    }

    logger.info('Protocol finalized', {
      protocolId,
      userId: session.user.id,
    })

    // Notify team that protocol is finalized
    await notifyAllStaff({
      type: 'protocol_finalized',
      title: 'Protokoll abgeschlossen',
      content: `Ein Sitzungsprotokoll wurde fertiggestellt.`,
      related_type: RELATED_TYPES.PROTOCOL,
      related_id: protocolId,
    }, session.user.id)

    return apiSuccess({ finalized: true })
  } catch (error) {
    logger.error('Error finalizing protocol', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Abschliessen des Protokolls')
  }
})
