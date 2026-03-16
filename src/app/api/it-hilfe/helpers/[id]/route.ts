/**
 * IT-Hilfe Single Helper API
 * GET /api/it-hilfe/helpers/[id] - Get helper profile details (public)
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { helperProfiles, userSkills, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
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
        userId: helperProfiles.userId,
        name: users.name,
        bio: helperProfiles.bio,
        hourlyRateCents: helperProfiles.hourlyRateCents,
        acceptsGratis: helperProfiles.acceptsGratis,
        acceptsKulturlegi: helperProfiles.acceptsKulturlegi,
        serviceTypes: helperProfiles.serviceTypes,
        locationCity: helperProfiles.locationCity,
        locationCanton: helperProfiles.locationCanton,
        maxTravelKm: helperProfiles.maxTravelKm,
        isVerified: helperProfiles.isVerified,
        averageRating: helperProfiles.averageRating,
        totalHelpsCompleted: helperProfiles.totalHelpsCompleted,
        createdAt: helperProfiles.createdAt,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
      })
      .from(helperProfiles)
      .innerJoin(users, eq(helperProfiles.userId, users.id))
      .leftJoin(userSkills, eq(helperProfiles.userId, userSkills.userId))
      .where(and(
        eq(helperProfiles.userId, id),
        eq(helperProfiles.isActive, true),
      ))
      .groupBy(
        helperProfiles.userId,
        users.name,
        helperProfiles.bio,
        helperProfiles.hourlyRateCents,
        helperProfiles.acceptsGratis,
        helperProfiles.acceptsKulturlegi,
        helperProfiles.serviceTypes,
        helperProfiles.locationCity,
        helperProfiles.locationCanton,
        helperProfiles.maxTravelKm,
        helperProfiles.isVerified,
        helperProfiles.averageRating,
        helperProfiles.totalHelpsCompleted,
        helperProfiles.createdAt,
      )

    if (!helper) {
      return apiNotFound('Helfer-Profil')
    }

    logger.info('Fetched helper profile', { helperId: id })

    return apiSuccess({
      helper: {
        ...helper,
        skills: helper.skills || [],
      },
    })
  } catch (error) {
    logger.error('Error fetching helper profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
