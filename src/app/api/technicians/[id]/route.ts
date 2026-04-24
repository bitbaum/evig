/**
 * Unified Technician Detail API
 * GET /api/technicians/[id] - Get a single technician profile with skills and services
 *
 * Works for both community (formerly helper_profiles) and professional
 * (formerly repairer_profiles) technicians — both now live in repairer_profiles.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, repairerServices, userSkills, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/technicians/[id]
 * Returns the full profile for a single technician.
 * Auth: public.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!UUID_RE.test(id)) {
      return apiBadRequest('Ungültige Techniker-ID')
    }

    // --- Fetch profile with user info and aggregated skills ---
    const [profile] = await db
      .select({
        id: repairerProfiles.id,
        userId: repairerProfiles.userId,
        name: users.name,
        bio: repairerProfiles.description,
        hourlyRateCents: repairerProfiles.hourlyRateCents,
        averageRating: repairerProfiles.averageRating,
        totalJobsCompleted: repairerProfiles.totalJobsCompleted,
        totalReviews: repairerProfiles.totalReviews,
        profileTier: repairerProfiles.profileTier,
        city: repairerProfiles.city,
        postalCode: repairerProfiles.postalCode,
        acceptsGratis: repairerProfiles.acceptsGratis,
        acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
        isVerified: repairerProfiles.isVerified,
        serviceDeliveryTypes: repairerProfiles.serviceDeliveryTypes,
        maxTravelKm: repairerProfiles.maxTravelKm,
        responseTimeHours: repairerProfiles.responseTimeHours,
        createdAt: repairerProfiles.createdAt,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .leftJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
      .where(
        and(
          eq(repairerProfiles.id, id),
          eq(repairerProfiles.isActive, true)
        )
      )
      .groupBy(
        repairerProfiles.id,
        repairerProfiles.userId,
        users.name,
        repairerProfiles.description,
        repairerProfiles.hourlyRateCents,
        repairerProfiles.averageRating,
        repairerProfiles.totalJobsCompleted,
        repairerProfiles.totalReviews,
        repairerProfiles.profileTier,
        repairerProfiles.city,
        repairerProfiles.postalCode,
        repairerProfiles.acceptsGratis,
        repairerProfiles.acceptsKulturlegi,
        repairerProfiles.isVerified,
        repairerProfiles.serviceDeliveryTypes,
        repairerProfiles.maxTravelKm,
        repairerProfiles.responseTimeHours,
        repairerProfiles.createdAt,
      )

    if (!profile) {
      return apiNotFound('Techniker-Profil')
    }

    // --- For professional-tier technicians, also fetch detailed service offerings ---
    let services: Array<{
      id: string
      serviceCategory: string
      serviceName: string
      description: string | null
      basePriceCents: number | null
      hourlyRateCents: number | null
      estimatedHours: string | null
    }> = []

    if (profile.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL) {
      services = await db
        .select({
          id: repairerServices.id,
          serviceCategory: repairerServices.serviceCategory,
          serviceName: repairerServices.serviceName,
          description: repairerServices.description,
          basePriceCents: repairerServices.basePriceCents,
          hourlyRateCents: repairerServices.hourlyRateCents,
          estimatedHours: repairerServices.estimatedHours,
        })
        .from(repairerServices)
        .where(
          and(
            eq(repairerServices.repairerId, id),
            eq(repairerServices.isActive, true)
          )
        )
    }

    logger.info('Fetched technician profile', { technicianId: id, tier: profile.profileTier })

    // Individual technician profiles are semi-static public data — cache 60s, stale 30s
    return apiSuccessCached({
      technician: {
        ...profile,
        skills: profile.skills || [],
        services,
      },
    }, 60, 30)
  } catch (error) {
    logger.error('Error fetching technician profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
