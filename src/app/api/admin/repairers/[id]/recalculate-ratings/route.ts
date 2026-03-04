import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface RepairerRow {
  id: string
  business_name: string
}

interface RatingRow {
  average_rating: number
  total_reviews: number
  rating_distribution: Record<string, number>
  review_summary: Record<string, unknown>
}

export const POST = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: repairerId } = context!.params!
  try {
    // Check if repairer exists
    const repairerResult = await query(
      `SELECT id, business_name FROM ${TABLE_NAMES.REPAIRER_PROFILES} WHERE id = $1`,
      [repairerId]
    )

    if (repairerResult.rows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    // Manually call the rating update function
    await query('SELECT update_repairer_rating_summary($1)', [repairerId])

    // Get updated ratings to return
    const updatedResult = await query(`
      SELECT average_rating, total_reviews, rating_distribution, review_summary
      FROM ${TABLE_NAMES.REPAIRER_PROFILES}
      WHERE id = $1
    `, [repairerId])

    const updated = updatedResult.rows[0] as RatingRow

    logger.info('Recalculated repairer ratings', {
      repairerId,
      adminId: session.user.id,
      newAverageRating: updated.average_rating,
      newTotalReviews: updated.total_reviews
    })

    return apiSuccess({
      message: 'Bewertungen erfolgreich neu berechnet',
      repairerId,
      ratings: {
        averageRating: Number(updated.average_rating) || 0,
        totalReviews: Number(updated.total_reviews) || 0,
        ratingDistribution: updated.rating_distribution,
        reviewSummary: updated.review_summary
      }
    })

  } catch (error) {
    logger.error('Error recalculating repairer ratings', { error, repairerId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})