import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const reviewId = params.id
    const body = await request.json()
    const { voteType } = body

    if (!voteType || !['helpful', 'unhelpful'].includes(voteType)) {
      return apiBadRequest('voteType muss "helpful" oder "unhelpful" sein')
    }

    // Check if review exists and is published
    const reviewResult = await query(
      'SELECT id, status FROM reviews WHERE id = $1',
      [reviewId]
    )

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    if (reviewResult.rows[0].status !== 'published') {
      return apiBadRequest('Diese Bewertung ist nicht verfügbar')
    }

    // Check if user already voted
    const existingVote = await query(
      'SELECT vote_type FROM review_votes WHERE review_id = $1 AND voter_id = $2',
      [reviewId, session.user.id]
    )

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0].vote_type

      if (currentVote === voteType) {
        // User is trying to vote the same way again - remove the vote
        await query(
          'DELETE FROM review_votes WHERE review_id = $1 AND voter_id = $2',
          [reviewId, session.user.id]
        )

        // Update review vote counts
        await query(`
          UPDATE reviews SET
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
          'UPDATE review_votes SET vote_type = $1 WHERE review_id = $2 AND voter_id = $3',
          [voteType, reviewId, session.user.id]
        )

        // Update review vote counts
        await query(`
          UPDATE reviews SET
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
        'INSERT INTO review_votes (review_id, voter_id, vote_type) VALUES ($1, $2, $3)',
        [reviewId, session.user.id, voteType]
      )

      // Update review vote counts
      await query(`
        UPDATE reviews SET
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
    logger.error('Error voting on review', { error, reviewId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}