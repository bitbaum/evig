import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewVotes } from '@/db/schema/reviews'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'
import { validateBody, ReviewVoteSchema } from '@/lib/schemas'

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  const { id: reviewId } = context!.params!

  try {
    const body = await request.json()
    const validation = validateBody(ReviewVoteSchema, body)
    if (!validation.success) return validation.error
    const { voteType } = validation.data

    // Review existence + existing vote check are independent — run in parallel
    const [reviewRows, existingVote] = await Promise.all([
      db
        .select({ id: reviews.id, status: reviews.status })
        .from(reviews)
        .where(eq(reviews.id, reviewId)),
      db
        .select({ voteType: reviewVotes.voteType })
        .from(reviewVotes)
        .where(and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.voterId, session.user.id),
        )),
    ])

    if (reviewRows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REVIEW_NOT_FOUND)
    }

    const review = reviewRows[0]
    if (review.status !== REVIEW_STATUS.PUBLISHED) {
      return apiBadRequest('Diese Bewertung ist nicht verfügbar')
    }

    if (existingVote.length > 0) {
      const currentVote = existingVote[0].voteType

      if (currentVote === voteType) {
        // User is trying to vote the same way again - remove the vote
        await db.transaction(async (tx) => {
          await tx
            .delete(reviewVotes)
            .where(
              and(
                eq(reviewVotes.reviewId, reviewId),
                eq(reviewVotes.voterId, session.user.id)
              )
            )

          await tx
            .update(reviews)
            .set({
              helpfulVotes: currentVote === 'helpful'
                ? sql`${reviews.helpfulVotes} - 1`
                : reviews.helpfulVotes,
              totalVotes: sql`${reviews.totalVotes} - 1`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(reviews.id, reviewId))
        })

        return apiSuccess({
          message: 'Bewertung entfernt',
          action: 'removed',
        })
      } else {
        // User is changing their vote
        await db.transaction(async (tx) => {
          await tx
            .update(reviewVotes)
            .set({ voteType })
            .where(
              and(
                eq(reviewVotes.reviewId, reviewId),
                eq(reviewVotes.voterId, session.user.id)
              )
            )

          await tx
            .update(reviews)
            .set({
              helpfulVotes: voteType === 'helpful' && currentVote === 'unhelpful'
                ? sql`${reviews.helpfulVotes} + 1`
                : voteType === 'unhelpful' && currentVote === 'helpful'
                  ? sql`${reviews.helpfulVotes} - 1`
                  : reviews.helpfulVotes,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(reviews.id, reviewId))
        })

        return apiSuccess({
          message: 'Bewertung aktualisiert',
          action: 'updated',
        })
      }
    } else {
      // New vote
      await db.transaction(async (tx) => {
        await tx
          .insert(reviewVotes)
          .values({
            reviewId,
            voterId: session.user.id,
            voteType,
          })

        await tx
          .update(reviews)
          .set({
            helpfulVotes: voteType === 'helpful'
              ? sql`${reviews.helpfulVotes} + 1`
              : reviews.helpfulVotes,
            totalVotes: sql`${reviews.totalVotes} + 1`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(reviews.id, reviewId))
      })

      logger.info('Review vote added', {
        reviewId,
        voterId: session.user.id,
        voteType,
      })

      return apiSuccess({
        message: 'Bewertung hinzugefügt',
        action: 'added',
      }, 201)
    }

  } catch (error) {
    logger.error('Error voting on review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
