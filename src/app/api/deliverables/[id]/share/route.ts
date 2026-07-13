/**
 * Share link — POST /api/deliverables/[id]/share
 *
 * Generates (once) an unguessable share_token so the deliverable can be opened
 * externally at /d/<token> with read + comment, no login. Returns the token.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ensureShareToken } from '@/lib/services/deliverables'
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

    const token = await ensureShareToken(id)
    if (!token) return apiNotFound('Liefergegenstand')
    return apiSuccess({ share_token: token })
  } catch (error) {
    logger.error('Error creating share token', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Erstellen des Freigabe-Links')
  }
})
