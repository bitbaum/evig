/**
 * Decision Comment Detail API
 *
 * PATCH  /api/decisions/[id]/comments/[commentId] - Update comment
 * DELETE /api/decisions/[id]/comments/[commentId] - Delete comment
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { updateCommentSchema } from '@/lib/schemas/decisions'
import { updateComment, deleteComment } from '@/lib/services/decisions'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string; commentId: string }

export const PATCH = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const commentId = context?.params?.commentId
    if (!commentId) return apiBadRequest('Kommentar-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const body = await request.json()
    const parsed = updateCommentSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest(
        parsed.error.issues[0]?.message || ERROR_MESSAGES.ALL_FIELDS_REQUIRED
      )
    }

    const result = await updateComment(commentId, dbUserId, parsed.data.content)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Kommentar')
      if (result.error === 'not_author') return apiBadRequest(ERROR_MESSAGES.COMMENT_NOT_AUTHOR)
    }

    logger.info('Comment updated', { commentId, userId: dbUserId })
    return apiSuccess(result.comment)
  } catch (error) {
    logger.error('Error updating comment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const DELETE = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const commentId = context?.params?.commentId
    if (!commentId) return apiBadRequest('Kommentar-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const result = await deleteComment(commentId, dbUserId)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Kommentar')
      if (result.error === 'not_author') return apiBadRequest(ERROR_MESSAGES.COMMENT_NOT_AUTHOR)
    }

    logger.info('Comment deleted', { commentId, userId: dbUserId })
    return apiSuccess(null)
  } catch (error) {
    logger.error('Error deleting comment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
