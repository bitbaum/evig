/**
 * Decision Data API
 *
 * GET /api/protocols/[id]/decisions - Get all votes + outcomes for a protocol
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDecisionData } from '@/lib/services/protocols'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAuth<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const data = await getDecisionData(protocolId)

    return apiSuccess(data)
  } catch (error) {
    logger.error('Error fetching decision data', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden der Abstimmungsdaten')
  }
})
