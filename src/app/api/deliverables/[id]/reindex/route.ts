/**
 * Reindex a deliverable into the Hirn RAG store on demand.
 * POST /api/deliverables/[id]/reindex → { indexed: true }
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDeliverable } from '@/lib/services/deliverables'
import { ingestDeliverable } from '@/lib/deliverables/ai'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const POST = withAdmin<RouteParams>('deliverables', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const deliverable = await getDeliverable(id)
    if (!deliverable) return apiNotFound('Liefergegenstand')

    await ingestDeliverable(deliverable)
    return apiSuccess({ indexed: true })
  } catch (error) {
    logger.error('Deliverable reindex error', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Indexieren')
  }
})
