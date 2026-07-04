import { db } from '@/db'
import { listingQuestions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { validateBody } from '@/lib/schemas'
import { ModerateListingQuestionSchema } from '@/lib/schemas/marketplace'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { LISTING_QUESTION_STATUS } from '@/config/marketplace'
import { logger } from '@/lib/logger'
import { logAdminAction } from '@/lib/auth/audit'
import { getClientIdentifier } from '@/lib/security/rate-limit'

// PATCH /api/admin/marketplace/questions/[id] - Hide or restore a listing question
export const PATCH = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.ID_REQUIRED)

    const body = await request.json()
    const validation = validateBody(ModerateListingQuestionSchema, body)
    if (!validation.success) return validation.error

    const [question] = await db
      .select({
        id: listingQuestions.id,
        listingId: listingQuestions.listingId,
        answer: listingQuestions.answer,
      })
      .from(listingQuestions)
      .where(eq(listingQuestions.id, id))
      .limit(1)

    if (!question) return apiNotFound('Frage')

    const nextStatus = validation.data.action === 'hide'
      ? LISTING_QUESTION_STATUS.HIDDEN
      : question.answer
        ? LISTING_QUESTION_STATUS.ANSWERED
        : LISTING_QUESTION_STATUS.OPEN

    const [updated] = await db
      .update(listingQuestions)
      .set({
        status: nextStatus,
        updatedAt: sql`NOW()`,
      })
      .where(eq(listingQuestions.id, id))
      .returning({
        id: listingQuestions.id,
        status: listingQuestions.status,
      })

    logger.info('Admin moderated listing question', {
      questionId: id,
      listingId: question.listingId,
      action: validation.data.action,
      status: updated.status,
      adminEmail: session.user.email,
    })

    logAdminAction({
      userId: session.user.id,
      ipAddress: getClientIdentifier(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
    }, 'marketplace_question_moderated', {
      questionId: id,
      listingId: question.listingId,
      action: validation.data.action,
      status: updated.status,
    })

    return apiSuccess({ id: updated.id, status: updated.status })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
