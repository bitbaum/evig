import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, ReviewVoteSchema } from '@/lib/schemas'

interface ReviewRow {
  id: string
  status: string
}

interface VoteRow {
  vote_type: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id: reviewId } = await params
    const body = await request.json()
    const validation = validateBody(ReviewVoteSchema, body)
    if (!validation.success) return validation.error
    const { voteType } = validation.data

    // Check if review exists and is published
    const reviewResult = await query(
      `SELECT id, status FROM ${TABLE_NAMES.REVIEWS} WHERE id = $1`,
      [reviewId]
    )

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewResult.rows[0] as ReviewRow
    if (review.status !== 'published') {
      return apiBadRequest('Diese Bewertung ist nicht verfügbar')
    }

    // Check if user already voted
    const existingVote = await query(
      `SELECT vote_type FROM ${TABLE_NAMES.REVIEW_VOTES} WHERE review_id = $1 AND voter_id = $2`,
      [reviewId, session.user.id]
    )

    if (existingVote.rows.length > 0) {
      const voteData = existingVote.rows[0] as VoteRow
      const currentVote = voteData.vote_type

      if (currentVote === voteType) {
        // User is trying to vote the same way again - remove the vote
        await query(
          `DELETE FROM ${TABLE_NAMES.REVIEW_VOTES} WHERE review_id = $1 AND voter_id = $2`,
          [reviewId, session.user.id]
        )

        // Update review vote counts
        await query(`
          UPDATE ${TABLE_NAMES.REVIEWS} SET
            helpful_votes = CASE WHEN $1 = 'helpful' THEN helpful_votes - 1 ELSE helpful_votes END,
            total_votes = total_votes - 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [currentVote, reviewId])

        return apiSuccess({
          message: 'Bewertung entfernt',
          action: 'removed'
        })
      } else {
        // User is changing their vote
        await query(
          `UPDATE ${TABLE_NAMES.REVIEW_VOTES} SET vote_type = $1 WHERE review_id = $2 AND voter_id = $3`,
          [voteType, reviewId, session.user.id]
        )

        // Update review vote counts
        await query(`
          UPDATE ${TABLE_NAMES.REVIEWS} SET
            helpful_votes = CASE
              WHEN $1 = 'helpful' AND $2 = 'unhelpful' THEN helpful_votes + 1
              WHEN $1 = 'unhelpful' AND $2 = 'helpful' THEN helpful_votes - 1
              ELSE helpful_votes
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [voteType, currentVote, reviewId])

        return apiSuccess({
          message: 'Bewertung aktualisiert',
          action: 'updated'
        })
      }
    } else {
      // New vote
      await query(
        `INSERT INTO ${TABLE_NAMES.REVIEW_VOTES} (review_id, voter_id, vote_type) VALUES ($1, $2, $3)`,
        [reviewId, session.user.id, voteType]
      )

      // Update review vote counts
      await query(`
        UPDATE ${TABLE_NAMES.REVIEWS} SET
          helpful_votes = CASE WHEN $1 = 'helpful' THEN helpful_votes + 1 ELSE helpful_votes END,
          total_votes = total_votes + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [voteType, reviewId])

      logger.info('Review vote added', {
        reviewId,
        voterId: session.user.id,
        voteType
      })

      return apiSuccess({
        message: 'Bewertung hinzugefügt',
        action: 'added'
      }, 201)
    }

  } catch (error) {
    const { id } = await params
    logger.error('Error voting on review', { error, reviewId: id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
