import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface RepairerProfileRow {
  id: string
  user_id: string
  business_name: string | null
  business_type: string
  description: string | null
  years_experience: number
  phone: string
  website: string | null
  address: string
  city: string
  postal_code: string
  latitude: number | null
  longitude: number | null
  service_radius_km: number
  remote_services: boolean
  hourly_rate_cents: number | null
  emergency_fee_cents: number | null
  home_visit_fee_cents: number | null
  average_rating: number
  total_reviews: number
  total_jobs_completed: number
  completion_rate: number
  services_offered: string[]
  specializations: string[]
  certifications: string[]
  is_verified: boolean
  verification_date: string | null
  response_time_hours: number
  typical_turnaround_days: number
  warranty_offered: boolean
  warranty_duration_months: number | null
  insurance_info: string | null
  portfolio_images: string[]
  availability_schedule: Record<string, unknown>
  status: string
  created_at: string
}

interface ServiceRow {
  id: string
  service_category: string
  service_name: string
  description: string | null
  base_price_cents: number | null
  hourly_rate_cents: number | null
  parts_included: boolean
  estimated_hours: number | null
  estimated_days: number | null
  is_active: boolean
}

interface ReviewRow {
  id: string
  customer_name: string
  rating: number
  title: string | null
  comment: string | null
  timeliness_rating: number | null
  quality_rating: number | null
  communication_rating: number | null
  is_verified: boolean
  repairer_response: string | null
  repairer_response_date: string | null
  created_at: string
}

interface RatingRow {
  rating: number
  count: string
}

interface ReviewSummaryRow {
  avg_timeliness: number | null
  avg_quality: number | null
  avg_communication: number | null
}

interface AvailabilityRow {
  date: string
  start_time: string
  end_time: string
  availability_type: string
}

// GET /api/repairers/[id] - Get detailed repairer profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get repairer profile
    const profileResult = await query(`
      SELECT
        rp.*,
        u.name as user_name,
        u.email as user_email
      FROM ${TABLE_NAMES.REPAIRER_PROFILES} rp
      LEFT JOIN ${TABLE_NAMES.USERS} u ON rp.user_id = u.id
      WHERE rp.id = $1 AND rp.is_active = true
    `, [id])

    if (profileResult.rows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    const profile = profileResult.rows[0] as RepairerProfileRow & { user_name: string; user_email: string }

    // Get services offered by this repairer
    const servicesResult = await query(`
      SELECT
        id,
        service_category,
        service_name,
        description,
        base_price_cents,
        hourly_rate_cents,
        parts_included,
        estimated_hours,
        estimated_days,
        is_active
      FROM ${TABLE_NAMES.REPAIRER_SERVICES}
      WHERE repairer_id = $1 AND is_active = true
      ORDER BY service_category, service_name
    `, [id])

    const services = servicesResult.rows as ServiceRow[]

    // Get recent reviews
    const reviewsResult = await query(`
      SELECT
        rr.id,
        u.name as customer_name,
        rr.rating,
        rr.title,
        rr.comment,
        rr.timeliness_rating,
        rr.quality_rating,
        rr.communication_rating,
        rr.is_verified,
        rr.repairer_response,
        rr.repairer_response_date,
        rr.created_at
      FROM ${TABLE_NAMES.REPAIRER_REVIEWS} rr
      LEFT JOIN ${TABLE_NAMES.USERS} u ON rr.customer_id = u.id
      WHERE rr.repairer_id = $1 AND rr.is_public = true
      ORDER BY rr.created_at DESC
      LIMIT 10
    `, [id])

    const reviews = reviewsResult.rows as ReviewRow[]

    // Fetch rating distribution and review summary in parallel (same table, independent queries)
    const [ratingDistResult, reviewSummaryResult] = await Promise.all([
      query(`
        SELECT rating, COUNT(*)::text as count
        FROM ${TABLE_NAMES.REPAIRER_REVIEWS}
        WHERE repairer_id = $1 AND is_public = true
        GROUP BY rating
        ORDER BY rating DESC
      `, [id]),
      query(`
        SELECT
          AVG(timeliness_rating)::decimal(3,2) as avg_timeliness,
          AVG(quality_rating)::decimal(3,2) as avg_quality,
          AVG(communication_rating)::decimal(3,2) as avg_communication
        FROM ${TABLE_NAMES.REPAIRER_REVIEWS}
        WHERE repairer_id = $1 AND is_public = true
      `, [id]),
    ])

    const ratingDistribution: { [key: string]: number } = {}
    for (const row of ratingDistResult.rows as RatingRow[]) {
      ratingDistribution[row.rating.toString()] = parseInt(row.count)
    }

    const summaryRow = reviewSummaryResult.rows[0] as ReviewSummaryRow | undefined

    // Get upcoming availability (next 14 days)
    const availabilityResult = await query(`
      SELECT
        date,
        start_time,
        end_time,
        availability_type
      FROM ${TABLE_NAMES.REPAIRER_AVAILABILITY}
      WHERE repairer_id = $1
        AND date >= CURRENT_DATE
        AND date <= CURRENT_DATE + INTERVAL '14 days'
        AND availability_type = 'available'
      ORDER BY date, start_time
    `, [id])

    const availability = availabilityResult.rows as AvailabilityRow[]

    logger.info('Repairer profile fetched', { repairerId: id })

    // Cache individual repairer profile for 5 minutes
    return apiSuccessCached({
      repairer: {
        ...profile,
        rating_distribution: ratingDistribution,
        review_summary: {
          timeliness: summaryRow?.avg_timeliness || 0,
          quality: summaryRow?.avg_quality || 0,
          communication: summaryRow?.avg_communication || 0,
          professionalism: summaryRow?.avg_quality || 0,
          value: summaryRow?.avg_timeliness || 0
        }
      },
      services,
      reviews: reviews.map(review => ({
        id: review.id,
        reviewerName: review.customer_name || 'Anonym',
        rating: review.rating,
        title: review.title,
        content: review.comment,
        timeliness_rating: review.timeliness_rating,
        quality_rating: review.quality_rating,
        communication_rating: review.communication_rating,
        isVerifiedPurchase: review.is_verified,
        createdAt: review.created_at,
        response: review.repairer_response ? {
          content: review.repairer_response,
          responderName: profile.business_name || 'Reparateur',
          createdAt: review.repairer_response_date
        } : null
      })),
      availability
    })

  } catch (error) {
    logger.error('Error fetching repairer profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
