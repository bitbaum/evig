import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, repairerServices, repairerReviews, repairerAvailability, users } from '@/db/schema'
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { API_DEFAULTS } from '@/config/api-defaults'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REPAIRER_AVAILABILITY_TYPE } from '@/config/repairer-status'

// GET /api/repairers/[id] - Get detailed repairer profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get repairer profile
    const [profile] = await db
      .select({
        id: repairerProfiles.id,
        user_id: repairerProfiles.userId,
        business_name: repairerProfiles.businessName,
        business_type: repairerProfiles.businessType,
        description: repairerProfiles.description,
        years_experience: repairerProfiles.yearsExperience,
        phone: repairerProfiles.phone,
        website: repairerProfiles.website,
        address: repairerProfiles.address,
        city: repairerProfiles.city,
        postal_code: repairerProfiles.postalCode,
        latitude: repairerProfiles.latitude,
        longitude: repairerProfiles.longitude,
        service_radius_km: repairerProfiles.serviceRadiusKm,
        remote_services: repairerProfiles.remoteServices,
        hourly_rate_cents: repairerProfiles.hourlyRateCents,
        emergency_fee_cents: repairerProfiles.emergencyFeeCents,
        home_visit_fee_cents: repairerProfiles.homeVisitFeeCents,
        average_rating: repairerProfiles.averageRating,
        total_reviews: repairerProfiles.totalReviews,
        total_jobs_completed: repairerProfiles.totalJobsCompleted,
        completion_rate: repairerProfiles.completionRate,
        services_offered: repairerProfiles.servicesOffered,
        specializations: repairerProfiles.specializations,
        certifications: repairerProfiles.certifications,
        is_verified: repairerProfiles.isVerified,
        verification_date: repairerProfiles.verificationDate,
        response_time_hours: repairerProfiles.responseTimeHours,
        typical_turnaround_days: repairerProfiles.typicalTurnaroundDays,
        warranty_offered: repairerProfiles.warrantyOffered,
        warranty_duration_months: repairerProfiles.warrantyDurationMonths,
        insurance_info: repairerProfiles.insuranceInfo,
        portfolio_images: repairerProfiles.portfolioImages,
        availability_schedule: repairerProfiles.availabilitySchedule,
        status: repairerProfiles.status,
        created_at: repairerProfiles.createdAt,
        user_name: users.name,
        user_email: users.email,
      })
      .from(repairerProfiles)
      .leftJoin(users, eq(repairerProfiles.userId, users.id))
      .where(and(
        eq(repairerProfiles.id, id),
        eq(repairerProfiles.isActive, true)
      ))

    if (!profile) {
      return apiNotFound(ERROR_MESSAGES.REPAIRER_NOT_FOUND)
    }

    // Get services offered by this repairer
    const services = await db
      .select({
        id: repairerServices.id,
        service_category: repairerServices.serviceCategory,
        service_name: repairerServices.serviceName,
        description: repairerServices.description,
        base_price_cents: repairerServices.basePriceCents,
        hourly_rate_cents: repairerServices.hourlyRateCents,
        parts_included: repairerServices.partsIncluded,
        estimated_hours: repairerServices.estimatedHours,
        estimated_days: repairerServices.estimatedDays,
        is_active: repairerServices.isActive,
      })
      .from(repairerServices)
      .where(and(
        eq(repairerServices.repairerId, id),
        eq(repairerServices.isActive, true)
      ))
      .orderBy(repairerServices.serviceCategory, repairerServices.serviceName)

    // Get recent reviews
    const reviews = await db
      .select({
        id: repairerReviews.id,
        customer_name: users.name,
        rating: repairerReviews.rating,
        title: repairerReviews.title,
        comment: repairerReviews.comment,
        timeliness_rating: repairerReviews.timelinessRating,
        quality_rating: repairerReviews.qualityRating,
        communication_rating: repairerReviews.communicationRating,
        is_verified: repairerReviews.isVerified,
        repairer_response: repairerReviews.repairerResponse,
        repairer_response_date: repairerReviews.repairerResponseDate,
        created_at: repairerReviews.createdAt,
      })
      .from(repairerReviews)
      .leftJoin(users, eq(repairerReviews.customerId, users.id))
      .where(and(
        eq(repairerReviews.repairerId, id),
        eq(repairerReviews.isPublic, true)
      ))
      .orderBy(desc(repairerReviews.createdAt))
      .limit(API_DEFAULTS.RECENT_RATINGS_LIMIT)

    // Fetch rating distribution and review summary in parallel
    const [ratingDistRows, [reviewSummary]] = await Promise.all([
      db
        .select({
          rating: repairerReviews.rating,
          count: sql<string>`COUNT(*)::text`,
        })
        .from(repairerReviews)
        .where(and(
          eq(repairerReviews.repairerId, id),
          eq(repairerReviews.isPublic, true)
        ))
        .groupBy(repairerReviews.rating)
        .orderBy(desc(repairerReviews.rating)),
      db
        .select({
          avg_timeliness: sql<string>`AVG(${repairerReviews.timelinessRating})::decimal(3,2)`,
          avg_quality: sql<string>`AVG(${repairerReviews.qualityRating})::decimal(3,2)`,
          avg_communication: sql<string>`AVG(${repairerReviews.communicationRating})::decimal(3,2)`,
        })
        .from(repairerReviews)
        .where(and(
          eq(repairerReviews.repairerId, id),
          eq(repairerReviews.isPublic, true)
        )),
    ])

    const ratingDistribution: Record<string, number> = {}
    for (const row of ratingDistRows) {
      ratingDistribution[row.rating.toString()] = parseInt(row.count)
    }

    // Get upcoming availability (next 14 days)
    const availability = await db
      .select({
        date: sql<string>`${repairerAvailability.date}::text`,
        start_time: sql<string>`${repairerAvailability.startTime}::text`,
        end_time: sql<string>`${repairerAvailability.endTime}::text`,
        availability_type: repairerAvailability.availabilityType,
      })
      .from(repairerAvailability)
      .where(and(
        eq(repairerAvailability.repairerId, id),
        gte(repairerAvailability.date, sql`CURRENT_DATE`),
        lte(repairerAvailability.date, sql`CURRENT_DATE + INTERVAL '14 days'`),
        eq(repairerAvailability.availabilityType, REPAIRER_AVAILABILITY_TYPE.AVAILABLE)
      ))
      .orderBy(repairerAvailability.date, repairerAvailability.startTime)

    logger.info('Repairer profile fetched', { repairerId: id })

    // Cache individual repairer profile for 5 minutes
    return apiSuccessCached({
      repairer: {
        ...profile,
        rating_distribution: ratingDistribution,
        review_summary: {
          timeliness: reviewSummary?.avg_timeliness || 0,
          quality: reviewSummary?.avg_quality || 0,
          communication: reviewSummary?.avg_communication || 0,
          professionalism: reviewSummary?.avg_quality || 0,
          value: reviewSummary?.avg_timeliness || 0
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
