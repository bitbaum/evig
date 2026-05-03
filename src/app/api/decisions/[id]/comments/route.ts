/**
 * Decision Comments API
 *
 * GET  /api/decisions/[id]/comments - Get comments for a decision
 * POST /api/decisions/[id]/comments - Create a comment
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { createCommentSchema } from '@/lib/schemas/decisions'
import { getComments, createComment } from '@/lib/services/decisions'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest(ERROR_MESSAGES.DECISION_ID_REQUIRED)

    const comments = await getComments(decisionId)
    return apiSuccess(comments)
  } catch (error) {
    logger.error('Error fetching comments', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest(ERROR_MESSAGES.DECISION_ID_REQUIRED)

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const body = await request.json()
    const parsed = createCommentSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest(
        parsed.error.issues[0]?.message || ERROR_MESSAGES.ALL_FIELDS_REQUIRED
      )
    }

    const result = await createComment(decisionId, dbUserId, parsed.data)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Entscheidung')
      if (result.error === 'not_commentable') return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_EDITABLE)
    }

    logger.info('Comment created', { decisionId, userId: dbUserId })
    return apiSuccess(result.comment, 201)
  } catch (error) {
    logger.error('Error creating comment', { error })
    return apiError(error, ERROR_MESSAGES.COMMENT_CREATE_FAILED)
  }
})
