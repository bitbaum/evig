import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

interface ReviewRow {
  id: string
  user_name: string
  rating: number
  feedback: string
  created_at: string
  instance_date: string
}

interface StatsRow {
  average_rating: string
  review_count: string
}

// GET /api/workshops/[slug]/reviews - Get reviews for a workshop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // First get the workshop ID
    const workshopResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1`,
      [slug]
    )

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop not found')
    }

    const workshopId = (workshopResult.rows[0] as { id: string }).id

    // Get reviews with user names
    const reviewsResult = await query(`
      SELECT
        wr.id,
        COALESCE(u.name, 'Anonym') as user_name,
        wr.rating,
        wr.feedback,
        wr.created_at,
        wi.start_date as instance_date
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      JOIN ${TABLE_NAMES.USERS} u ON wr.user_id = u.id
      WHERE wi.workshop_id = $1
        AND wr.rating IS NOT NULL
        AND wr.feedback IS NOT NULL
        AND wr.feedback != ''
      ORDER BY wr.created_at DESC
      LIMIT 20
    `, [workshopId])

    // Get average rating and review count
    const statsResult = await query(`
      SELECT
        ROUND(AVG(wr.rating)::numeric, 1) as average_rating,
        COUNT(wr.id) as review_count
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      WHERE wi.workshop_id = $1
        AND wr.rating IS NOT NULL
    `, [workshopId])

    const stats = statsResult.rows[0] as StatsRow

    return apiSuccess({
      reviews: reviewsResult.rows as ReviewRow[],
      stats: {
        averageRating: parseFloat(stats.average_rating) || 0,
        reviewCount: parseInt(stats.review_count) || 0
      }
    })

  } catch (error) {
    logger.error('Error fetching workshop reviews', { error })
    return apiError(error, 'Bewertungen konnten nicht geladen werden')
  }
}
