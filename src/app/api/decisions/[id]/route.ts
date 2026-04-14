/**
 * Decision Detail API
 *
 * GET    /api/decisions/[id] - Get single decision
 * PATCH  /api/decisions/[id] - Update decision (draft/discussion only)
 * DELETE /api/decisions/[id] - Delete decision (creator or super admin)
 */

import { NextRequest } from 'next/server'
import { withAuth, withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { updateDecisionSchema } from '@/lib/schemas/decisions'
import { getDecisionById, updateDecision, deleteDecision } from '@/lib/services/decisions'
import { isSuperAdmin } from '@/lib/permissions'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAuth<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest('Entscheidungs-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const decision = await getDecisionById(decisionId, dbUserId)
    if (!decision) return apiNotFound('Entscheidung')

    return apiSuccess(decision)
  } catch (error) {
    logger.error('Error fetching decision', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const PATCH = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest('Entscheidungs-ID erforderlich')

    const body = await request.json()
    const parsed = updateDecisionSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest(
        parsed.error.issues[0]?.message || ERROR_MESSAGES.ALL_FIELDS_REQUIRED
      )
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const result = await updateDecision(decisionId, parsed.data, dbUserId)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Entscheidung')
      if (result.error === 'not_editable') return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_EDITABLE)
      if (result.error === 'not_creator') return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_EDITABLE)
      return apiBadRequest(ERROR_MESSAGES.DECISION_UPDATE_FAILED)
    }

    logger.info('Decision updated', { decisionId, userId: dbUserId })
    return apiSuccess(result.decision)
  } catch (error) {
    logger.error('Error updating decision', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.DECISION_UPDATE_FAILED)
  }
})

export const DELETE = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest('Entscheidungs-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const isAdmin = isSuperAdmin(session.user.email)

    const result = await deleteDecision(decisionId, dbUserId, isAdmin)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Entscheidung')
      return apiBadRequest('Keine Berechtigung zum Löschen dieser Entscheidung')
    }

    logger.info('Decision deleted', { decisionId, userId: dbUserId })
    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Error deleting decision', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Löschen der Entscheidung')
  }
})
