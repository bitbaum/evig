import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, repairerReviews } from '@/db/schema'
import { eq, and, ilike, gte, sql, desc, SQL, inArray } from 'drizzle-orm'
import { apiError, apiSuccessCached, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

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
    const { limit, offset } = parsePagination(request, { defaultLimit: 50, maxLimit: 100 })

    // Build WHERE conditions
    const conditions: SQL[] = [
      eq(repairerProfiles.isActive, true),
      sql`${repairerProfiles.status} = 'active'`,
    ]

    // Search by business name or description
    if (q) {
      const pattern = `%${q}%`
      conditions.push(sql`(${repairerProfiles.businessName} ILIKE ${pattern} OR ${repairerProfiles.description} ILIKE ${pattern} OR ${repairerProfiles.city} ILIKE ${pattern})`)
    }

    // Filter by service type
    if (service) {
      conditions.push(sql`${service} = ANY(${repairerProfiles.servicesOffered})`)
    }

    // Filter by location (postal code or city)
    if (location) {
      const locPattern = `%${location}%`
      conditions.push(sql`(${repairerProfiles.postalCode} ILIKE ${locPattern} OR ${repairerProfiles.city} ILIKE ${locPattern})`)
    }

    // Filter by minimum rating
    if (minRating > 0) {
      conditions.push(gte(repairerProfiles.averageRating, minRating.toString()))
    }

    // Distance filter (Haversine)
    if (lat !== 0 && lng !== 0 && maxDistance > 0) {
      conditions.push(sql`(
        ${repairerProfiles.latitude} IS NULL OR ${repairerProfiles.longitude} IS NULL OR
        111.32 * SQRT(
          POWER(${repairerProfiles.latitude}::numeric - ${lat}, 2) +
          POWER((${repairerProfiles.longitude}::numeric - ${lng}) * COS((${repairerProfiles.latitude}::numeric + ${lat}) / 2 / 57.29577951), 2)
        ) <= ${maxDistance}
      )`)
    }

    const where = and(...conditions)

    // Build distance select expression if coordinates provided
    const distanceExpr = (lat !== 0 && lng !== 0)
      ? sql<number>`CASE
          WHEN ${repairerProfiles.latitude} IS NOT NULL AND ${repairerProfiles.longitude} IS NOT NULL THEN
            111.32 * SQRT(
              POWER(${repairerProfiles.latitude}::numeric - ${lat}, 2) +
              POWER((${repairerProfiles.longitude}::numeric - ${lng}) * COS((${repairerProfiles.latitude}::numeric + ${lat}) / 2 / 57.29577951), 2)
            )
          ELSE NULL
        END`
      : sql<number>`NULL`

    // Main query
    const repairers = await db
      .select({
        id: repairerProfiles.id,
        userId: repairerProfiles.userId,
        businessName: repairerProfiles.businessName,
        businessType: repairerProfiles.businessType,
        description: repairerProfiles.description,
        phone: repairerProfiles.phone,
        website: repairerProfiles.website,
        address: repairerProfiles.address,
        city: repairerProfiles.city,
        postalCode: repairerProfiles.postalCode,
        latitude: repairerProfiles.latitude,
        longitude: repairerProfiles.longitude,
        serviceRadiusKm: repairerProfiles.serviceRadiusKm,
        remoteServices: repairerProfiles.remoteServices,
        hourlyRateCents: repairerProfiles.hourlyRateCents,
        emergencyFeeCents: repairerProfiles.emergencyFeeCents,
        homeVisitFeeCents: repairerProfiles.homeVisitFeeCents,
        averageRating: repairerProfiles.averageRating,
        totalReviews: repairerProfiles.totalReviews,
        totalJobsCompleted: repairerProfiles.totalJobsCompleted,
        servicesOffered: repairerProfiles.servicesOffered,
        specializations: repairerProfiles.specializations,
        certifications: repairerProfiles.certifications,
        isVerified: repairerProfiles.isVerified,
        responseTimeHours: repairerProfiles.responseTimeHours,
        typicalTurnaroundDays: repairerProfiles.typicalTurnaroundDays,
        warrantyOffered: repairerProfiles.warrantyOffered,
        warrantyDurationMonths: repairerProfiles.warrantyDurationMonths,
        distanceKm: distanceExpr.as('distance_km'),
      })
      .from(repairerProfiles)
      .where(where)
      .orderBy(
        ...(lat !== 0 && lng !== 0
          ? [sql`distance_km ASC NULLS LAST`]
          : []),
        desc(repairerProfiles.isVerified),
        desc(repairerProfiles.averageRating),
        desc(repairerProfiles.totalReviews),
      )
      .limit(limit)
      .offset(offset)

    // Count query
    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(repairerProfiles)
      .where(where)

    const total = Number(countRow?.total ?? 0)

    // Batch-fetch rating distributions and review summaries (avoids N+1 queries)
    const repairerIds = repairers.map(r => r.id)

    let ratingDistByRepairer: Record<string, Record<string, number>> = {}
    let reviewSummaryByRepairer: Record<string, { avg_timeliness: number | null; avg_quality: number | null; avg_communication: number | null }> = {}

    if (repairerIds.length > 0) {
      // Single query for all rating distributions
      const ratingDistRows = await db
        .select({
          repairerId: repairerReviews.repairerId,
          rating: repairerReviews.rating,
          count: sql<string>`count(*)`,
        })
        .from(repairerReviews)
        .where(and(
          inArray(repairerReviews.repairerId, repairerIds),
          eq(repairerReviews.isPublic, true)
        ))
        .groupBy(repairerReviews.repairerId, repairerReviews.rating)

      for (const row of ratingDistRows) {
        if (!ratingDistByRepairer[row.repairerId]) {
          ratingDistByRepairer[row.repairerId] = {}
        }
        ratingDistByRepairer[row.repairerId][row.rating.toString()] = parseInt(row.count)
      }

      // Single query for all review summaries
      const reviewSummaryRows = await db
        .select({
          repairerId: repairerReviews.repairerId,
          avgTimeliness: sql<number>`AVG(${repairerReviews.timelinessRating})::decimal(3,2)`,
          avgQuality: sql<number>`AVG(${repairerReviews.qualityRating})::decimal(3,2)`,
          avgCommunication: sql<number>`AVG(${repairerReviews.communicationRating})::decimal(3,2)`,
        })
        .from(repairerReviews)
        .where(and(
          inArray(repairerReviews.repairerId, repairerIds),
          eq(repairerReviews.isPublic, true)
        ))
        .groupBy(repairerReviews.repairerId)

      for (const row of reviewSummaryRows) {
        reviewSummaryByRepairer[row.repairerId] = {
          avg_timeliness: row.avgTimeliness,
          avg_quality: row.avgQuality,
          avg_communication: row.avgCommunication,
        }
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
