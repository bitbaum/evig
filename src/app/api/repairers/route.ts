import { NextRequest } from 'next/server'
import { query, paginatedQuery } from '@/lib/auth/db'
import { apiError, apiSuccessCached } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface RepairerRow {
  id: string
  user_id: string
  business_name: string | null
  business_type: string
  description: string | null
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
  services_offered: string[]
  specializations: string[]
  certifications: string[]
  is_verified: boolean
  response_time_hours: number
  typical_turnaround_days: number
  warranty_offered: boolean
  warranty_duration_months: number | null
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

// GET /api/repairers - Search and list repairers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const q = searchParams.get('q') || ''
    const service = searchParams.get('service') || ''
    const location = searchParams.get('location') || ''
    const minRating = parseFloat(searchParams.get('min_rating') || '0')
    const maxDistance = parseInt(searchParams.get('distance') || '0')
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    const conditions: string[] = [
      'rp.is_active = true',
      "rp.status = 'active'"
    ]
    const params: (string | number)[] = []
    let paramIndex = 1

    // Search by business name or description
    if (q) {
      conditions.push(`(
        rp.business_name ILIKE $${paramIndex} OR
        rp.description ILIKE $${paramIndex} OR
        rp.city ILIKE $${paramIndex}
      )`)
      params.push(`%${q}%`)
      paramIndex++
    }

    // Filter by service type
    if (service) {
      conditions.push(`$${paramIndex} = ANY(rp.services_offered)`)
      params.push(service)
      paramIndex++
    }

    // Filter by location (postal code or city)
    if (location) {
      conditions.push(`(rp.postal_code ILIKE $${paramIndex} OR rp.city ILIKE $${paramIndex})`)
      params.push(`%${location}%`)
      paramIndex++
    }

    // Filter by minimum rating
    if (minRating > 0) {
      conditions.push(`rp.average_rating >= $${paramIndex}`)
      params.push(minRating)
      paramIndex++
    }

    // Build distance calculation if coordinates provided
    let distanceSelect = ''
    let distanceOrder = ''

    if (lat !== 0 && lng !== 0) {
      // Haversine formula for distance calculation
      distanceSelect = `,
        CASE
          WHEN rp.latitude IS NOT NULL AND rp.longitude IS NOT NULL THEN
            111.32 * SQRT(
              POWER(rp.latitude - $${paramIndex}, 2) +
              POWER((rp.longitude - $${paramIndex + 1}) * COS((rp.latitude + $${paramIndex}) / 2 / 57.29577951), 2)
            )
          ELSE NULL
        END as distance_km`
      params.push(lat, lng)
      paramIndex += 2

      // Filter by max distance if provided
      if (maxDistance > 0) {
        conditions.push(`
          (rp.latitude IS NULL OR rp.longitude IS NULL OR
           111.32 * SQRT(
             POWER(rp.latitude - $${paramIndex}, 2) +
             POWER((rp.longitude - $${paramIndex + 1}) * COS((rp.latitude + $${paramIndex}) / 2 / 57.29577951), 2)
           ) <= $${paramIndex + 2})
        `)
        params.push(lat, lng, maxDistance)
        paramIndex += 3
      }

      distanceOrder = 'distance_km ASC NULLS LAST,'
    }

    // Main query
    const repairersQuery = `
      SELECT
        rp.id,
        rp.user_id,
        rp.business_name,
        rp.business_type,
        rp.description,
        rp.phone,
        rp.website,
        rp.address,
        rp.city,
        rp.postal_code,
        rp.latitude,
        rp.longitude,
        rp.service_radius_km,
        rp.remote_services,
        rp.hourly_rate_cents,
        rp.emergency_fee_cents,
        rp.home_visit_fee_cents,
        rp.average_rating,
        rp.total_reviews,
        rp.total_jobs_completed,
        rp.services_offered,
        rp.specializations,
        rp.certifications,
        rp.is_verified,
        rp.response_time_hours,
        rp.typical_turnaround_days,
        rp.warranty_offered,
        rp.warranty_duration_months
        ${distanceSelect}
      FROM ${TABLE_NAMES.REPAIRER_PROFILES} rp
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        ${distanceOrder}
        rp.is_verified DESC,
        rp.average_rating DESC,
        rp.total_reviews DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const { rows: repairers, total } = await paginatedQuery<RepairerRow & { distance_km?: number }>(repairersQuery, params)

    // Batch-fetch rating distributions and review summaries (avoids N+1 queries)
    const repairerIds = repairers.map(r => r.id)

    let ratingDistByRepairer: Record<string, Record<string, number>> = {}
    let reviewSummaryByRepairer: Record<string, ReviewSummaryRow> = {}

    if (repairerIds.length > 0) {
      // Single query for all rating distributions
      const ratingDistResult = await query(`
        SELECT repairer_id, rating, COUNT(*)::text as count
        FROM ${TABLE_NAMES.REPAIRER_REVIEWS}
        WHERE repairer_id = ANY($1) AND is_public = true
        GROUP BY repairer_id, rating
      `, [repairerIds])

      for (const row of ratingDistResult.rows as (RatingRow & { repairer_id: string })[]) {
        if (!ratingDistByRepairer[row.repairer_id]) {
          ratingDistByRepairer[row.repairer_id] = {}
        }
        ratingDistByRepairer[row.repairer_id][row.rating.toString()] = parseInt(row.count)
      }

      // Single query for all review summaries
      const reviewSummaryResult = await query(`
        SELECT
          repairer_id,
          AVG(timeliness_rating)::decimal(3,2) as avg_timeliness,
          AVG(quality_rating)::decimal(3,2) as avg_quality,
          AVG(communication_rating)::decimal(3,2) as avg_communication
        FROM ${TABLE_NAMES.REPAIRER_REVIEWS}
        WHERE repairer_id = ANY($1) AND is_public = true
        GROUP BY repairer_id
      `, [repairerIds])

      for (const row of reviewSummaryResult.rows as (ReviewSummaryRow & { repairer_id: string })[]) {
        reviewSummaryByRepairer[row.repairer_id] = row
      }
    }

    const repairersWithDetails = repairers.map((repairer) => {
      const summaryRow = reviewSummaryByRepairer[repairer.id]
      return {
        ...repairer,
        rating_distribution: ratingDistByRepairer[repairer.id] || {},
        review_summary: {
          timeliness: summaryRow?.avg_timeliness || 0,
          quality: summaryRow?.avg_quality || 0,
          communication: summaryRow?.avg_communication || 0,
          professionalism: summaryRow?.avg_quality || 0,
          value: summaryRow?.avg_timeliness || 0,
        },
      }
    })

    logger.info('Repairers search completed', {
      query: q,
      service,
      location,
      resultsCount: repairersWithDetails.length,
      total
    })

    // Cache public repairer listing for 5 minutes
    return apiSuccessCached({
      repairers: repairersWithDetails,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + repairersWithDetails.length < total
      }
    }, 300, 60)

  } catch (error) {
    logger.error('Error fetching repairers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
