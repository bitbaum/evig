/**
 * Decisions List API
 *
 * GET  /api/decisions - List decisions with filters
 * POST /api/decisions - Create new decision
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { createDecisionSchema } from '@/lib/schemas/decisions'
import { getDecisions, createDecision } from '@/lib/services/decisions'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import type { DecisionStatus } from '@/config/decisions'

export const GET = withAdmin(async (
  request: NextRequest,
  session: ValidSession,
) => {
  try {
    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const { searchParams } = request.nextUrl
    const filters = {
      status: (searchParams.get('status') as DecisionStatus) || undefined,
      decisionType: searchParams.get('decisionType') || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
    }

    const result = await getDecisions(filters, dbUserId)
    return apiSuccess({ decisions: result.decisions, total: result.total, page: result.page, limit: result.limit })
  } catch (error) {
    logger.error('Error fetching decisions', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const POST = withAdmin(async (
  request: NextRequest,
  session: ValidSession,
) => {
  try {
    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const body = await request.json()
    const parsed = createDecisionSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest(
        parsed.error.issues[0]?.message || ERROR_MESSAGES.ALL_FIELDS_REQUIRED
      )
    }

    const decision = await createDecision(parsed.data, dbUserId)

    logger.info('Decision created', { decisionId: decision.id, userId: dbUserId })
    return apiSuccess(decision, 201)
  } catch (error) {
    logger.error('Error creating decision', { error })
    return apiError(error, ERROR_MESSAGES.DECISION_CREATE_FAILED)
  }
})
