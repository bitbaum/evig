/**
 * IT-Hilfe Helpers API
 * GET /api/it-hilfe/helpers - Browse available helpers
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { helperProfiles, userSkills, users } from '@/db/schema'
import { eq, and, sql, asc, SQL } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { getSkillIds } from '@/config/it-hilfe'

/**
 * GET /api/it-hilfe/helpers
 * Browse available IT helpers with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const skillsParam = searchParams.get('skills')
    const skillParam = searchParams.get('skill')
    const validSkillIds = getSkillIds()
    const skills: string[] = (skillsParam
      ? skillsParam.split(',').filter(Boolean)
      : skillParam ? [skillParam] : []
    ).filter(s => validSkillIds.includes(s))
    const canton = searchParams.get('canton')
    const postalCode = searchParams.get('postalCode')
    const acceptsGratis = searchParams.get('acceptsGratis') === 'true'
    const acceptsKulturlegi = searchParams.get('acceptsKulturlegi') === 'true'
    const serviceType = searchParams.get('serviceType')
    const { limit, offset } = parsePagination(request, { defaultLimit: 20, maxLimit: 50 })

    // Build WHERE conditions
    const conditions: SQL[] = [eq(helperProfiles.isActive, true)]

    if (skills.length > 0) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${userSkills}
        WHERE ${userSkills.userId} = ${helperProfiles.userId}
        AND ${userSkills.skillId} = ANY(${skills}::text[])
      )`)
    }
    if (canton) conditions.push(eq(helperProfiles.locationCanton, canton))
    if (postalCode) conditions.push(eq(helperProfiles.locationPostalCode, postalCode))
    if (acceptsGratis) conditions.push(eq(helperProfiles.acceptsGratis, true))
    if (acceptsKulturlegi) conditions.push(eq(helperProfiles.acceptsKulturlegi, true))
    if (serviceType) conditions.push(sql`${serviceType} = ANY(${helperProfiles.serviceTypes})`)

    const whereCondition = and(...conditions)

    // Query helpers with their skills
    const helpersResult = await db
      .select({
        userId: helperProfiles.userId,
        userName: users.name,
        userEmail: users.email,
        bio: helperProfiles.bio,
        hourlyRateCents: helperProfiles.hourlyRateCents,
        acceptsGratis: helperProfiles.acceptsGratis,
        acceptsKulturlegi: helperProfiles.acceptsKulturlegi,
        serviceTypes: helperProfiles.serviceTypes,
        locationPostalCode: helperProfiles.locationPostalCode,
        locationCity: helperProfiles.locationCity,
        locationCanton: helperProfiles.locationCanton,
        maxTravelKm: helperProfiles.maxTravelKm,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
        skillCount: sql<number>`COUNT(${userSkills.skillId})`,
      })
      .from(helperProfiles)
      .innerJoin(users, eq(helperProfiles.userId, users.id))
      .leftJoin(userSkills, eq(helperProfiles.userId, userSkills.userId))
      .where(whereCondition)
      .groupBy(
        helperProfiles.userId,
        users.name,
        users.email,
        helperProfiles.bio,
        helperProfiles.hourlyRateCents,
        helperProfiles.acceptsGratis,
        helperProfiles.acceptsKulturlegi,
        helperProfiles.serviceTypes,
        helperProfiles.locationPostalCode,
        helperProfiles.locationCity,
        helperProfiles.locationCanton,
        helperProfiles.maxTravelKm,
      )
      .orderBy(sql`COUNT(${userSkills.skillId}) DESC`, asc(users.name))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countRow] = await db
      .select({ total: sql<string>`COUNT(DISTINCT ${helperProfiles.userId})` })
      .from(helperProfiles)
      .leftJoin(userSkills, eq(helperProfiles.userId, userSkills.userId))
      .where(whereCondition)

    const helpers = helpersResult.map((row) => ({
      userId: row.userId,
      name: row.userName,
      bio: row.bio,
      hourlyRateCents: row.hourlyRateCents,
      acceptsGratis: row.acceptsGratis,
      acceptsKulturlegi: row.acceptsKulturlegi,
      serviceTypes: row.serviceTypes || [],
      postalCode: row.locationPostalCode,
      city: row.locationCity,
      canton: row.locationCanton,
      maxTravelKm: row.maxTravelKm,
      skills: row.skills || [],
    }))

    const total = parseInt(countRow?.total || '0')

    logger.info('Fetched IT helpers', {
      count: helpers.length,
      total,
      filters: { skills, canton, postalCode, serviceType },
    })

    return apiSuccess({
      helpers,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    logger.error('Error fetching IT helpers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
