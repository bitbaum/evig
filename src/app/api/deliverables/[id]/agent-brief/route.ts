/**
 * Agent brief (§4.8) — GET /api/deliverables/[id]/agent-brief
 *
 * The whole automation bridge: returns a ready-to-run prompt + the structured
 * pieces (open change requests, source_path, meta). L0 = a human copies this
 * into Claude Code; L1/L2 later fire it at an agent — the brief is identical.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { buildAgentBrief } from '@/lib/services/deliverables'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAdmin<RouteParams>('deliverables', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const brief = await buildAgentBrief(id)
    if (!brief) return apiNotFound('Liefergegenstand')
    return apiSuccess(brief)
  } catch (error) {
    logger.error('Error building agent brief', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Erstellen des Agent-Briefings')
  }
})
