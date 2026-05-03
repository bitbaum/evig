/**
 * IT-Hilfe Single Helper API
 * GET /api/it-hilfe/helpers/[id] - Get helper profile details (public)
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles } from '@/db/schema'
import { userSkills, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Helfer-ID')
    }

    // Get helper profile with user info and skills
    const [helper] = await db
      .select({
        userId: repairerProfiles.userId,
        name: users.name,
        bio: repairerProfiles.description,
        hourlyRateCents: repairerProfiles.hourlyRateCents,
        acceptsGratis: repairerProfiles.acceptsGratis,
        acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
        serviceTypes: repairerProfiles.serviceDeliveryTypes,
        locationCity: repairerProfiles.city,
        locationCanton: repairerProfiles.canton,
        maxTravelKm: repairerProfiles.maxTravelKm,
        isVerified: repairerProfiles.isVerified,
        averageRating: repairerProfiles.averageRating,
        totalHelpsCompleted: repairerProfiles.totalJobsCompleted,
        createdAt: repairerProfiles.createdAt,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .leftJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
      .where(and(
        eq(repairerProfiles.userId, id),
        eq(repairerProfiles.isActive, true),
        eq(repairerProfiles.profileTier, 'community'),
      ))
      .groupBy(
        repairerProfiles.userId,
        users.name,
        repairerProfiles.description,
        repairerProfiles.hourlyRateCents,
        repairerProfiles.acceptsGratis,
        repairerProfiles.acceptsKulturlegi,
        repairerProfiles.serviceDeliveryTypes,
        repairerProfiles.city,
        repairerProfiles.canton,
        repairerProfiles.maxTravelKm,
        repairerProfiles.isVerified,
        repairerProfiles.averageRating,
        repairerProfiles.totalJobsCompleted,
        repairerProfiles.createdAt,
      )

    if (!helper) {
      return apiNotFound('Helfer-Profil')
    }

    logger.info('Fetched helper profile', { helperId: id })

    // Helper profiles are public and semi-static — cache 60s, stale 30s
    return apiSuccessCached({
      helper: {
        ...helper,
        skills: helper.skills || [],
      },
    }, 60, 30)
  } catch (error) {
    logger.error('Error fetching helper profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
