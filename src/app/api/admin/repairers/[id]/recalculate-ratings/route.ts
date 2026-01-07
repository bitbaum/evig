import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound } from '@/lib/api/helpers'
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

    // Check if user is admin
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    )

    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return apiUnauthorized('Nur Administratoren können Bewertungen neu berechnen')
    }

    const repairerId = params.id

    // Check if repairer exists
    const repairerResult = await query(
      'SELECT id, business_name FROM repairer_profiles WHERE id = $1',
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
      FROM repairer_profiles
      WHERE id = $1
    `, [repairerId])

    const updated = updatedResult.rows[0]

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
        averageRating: parseFloat(updated.average_rating) || 0,
        totalReviews: parseInt(updated.total_reviews) || 0,
        ratingDistribution: updated.rating_distribution,
        reviewSummary: updated.review_summary
      }
    })

  } catch (error) {
    logger.error('Error recalculating repairer ratings', { error, repairerId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}