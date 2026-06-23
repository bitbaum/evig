/**
 * Unified Technicians API
 * GET /api/technicians - Search and list all technician profiles
 *
 * Replaces the split between /api/repairers (professional tier) and
 * /api/it-hilfe/helpers (community tier). Both are now rows in repairer_profiles.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, userSkills, users } from '@/db/schema'
import { eq, and, sql, asc, SQL, desc } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiRateLimited, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { getSkillIds } from '@/config/it-hilfe'
import { REPAIRER_STATUS } from '@/config/repairer-status'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { technicianHasSkillMatch } from '@/lib/it-hilfe/sql'

/**
 * GET /api/technicians
 * Unified search across all technician profiles.
 *
 * Query params:
 *   tier          — "community" | "professional" (omit for all)
 *   skills        — comma-separated skill IDs (validated against known skills)
 *   canton        — Swiss canton abbreviation (e.g. "BE")
 *   q             — free-text search (name / description)
 *   acceptsGratis — "true" to filter to gratis-accepting technicians
 *   acceptsKulturlegi — "true" to filter to Kulturlegi-accepting technicians
 *   limit         — max results (default 20, max 50)
 *   offset        — pagination offset
 */
export async function GET(request: NextRequest) {
  const clientIp = getClientIdentifier(request)
  if (!rateLimiters.listingBrowse(clientIp)) return apiRateLimited()

  try {
    const { searchParams } = new URL(request.url)

    // --- Parse filters ---
    const tier = searchParams.get('tier') || ''
    const q = searchParams.get('q') || ''
    const canton = searchParams.get('canton') || ''

    const skillsParam = searchParams.get('skills')
    const validSkillIds = getSkillIds()
    const skills: string[] = (skillsParam ? skillsParam.split(',').filter(Boolean) : []).filter(
      (s) => validSkillIds.includes(s)
    )

    const acceptsGratis = searchParams.get('acceptsGratis') === 'true'
    const acceptsKulturlegi = searchParams.get('acceptsKulturlegi') === 'true'

    const { limit, offset } = parsePagination(request, { defaultLimit: 20, maxLimit: 50 })

    // --- Build WHERE conditions ---
    //
    // The public endpoint surfaces ONLY verified helpers. Anyone can
    // register a profile via /profil/techniker, but an admin must
    // approve them before they appear in /techniker, the IT-Hilfe
    // helper map, /repairers, or skill-match notifications. Admin
    // surfaces use /api/admin/it-hilfe/helpers (separate query) and
    // can see unverified profiles by passing status filters there.
    const conditions: SQL[] = [
      eq(repairerProfiles.isActive, true),
      eq(repairerProfiles.isVerified, true),
    ]

    // Tier filter — 'professional' maps to status='active'; 'community' maps to profile_tier='community'
    if (tier === REPAIRER_PROFILE_TIER.COMMUNITY) {
      conditions.push(eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.COMMUNITY))
    } else if (tier === REPAIRER_PROFILE_TIER.PROFESSIONAL) {
      conditions.push(eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.PROFESSIONAL))
      conditions.push(sql`${repairerProfiles.status} = ${REPAIRER_STATUS.ACTIVE}`)
    }

    if (q) {
      const pattern = `%${q}%`
      conditions.push(
        sql`(${users.name} ILIKE ${pattern} OR ${repairerProfiles.description} ILIKE ${pattern} OR ${repairerProfiles.city} ILIKE ${pattern})`
      )
    }

    // Skills filter via subquery (avoids blowing up GROUP BY)
    if (skills.length > 0) {
      conditions.push(technicianHasSkillMatch(skills))
    }

    if (canton) conditions.push(eq(repairerProfiles.canton, canton))
    if (acceptsGratis) conditions.push(eq(repairerProfiles.acceptsGratis, true))
    if (acceptsKulturlegi) conditions.push(eq(repairerProfiles.acceptsKulturlegi, true))

    const whereCondition = and(...conditions)

    // --- Main query: join users + aggregate skills ---
    // Field shape must match @/types/technician::Technician — that's the
    // canonical SSOT for the entity. If you add/remove a column here,
    // update the type too.
    const rows = await db
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
        canton: repairerProfiles.canton,
        maxTravelKm: repairerProfiles.maxTravelKm,
        acceptsGratis: repairerProfiles.acceptsGratis,
        acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
        isActive: repairerProfiles.isActive,
        isVerified: repairerProfiles.isVerified,
        serviceDeliveryTypes: repairerProfiles.serviceDeliveryTypes,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .leftJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
      .where(whereCondition)
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
        repairerProfiles.canton,
        repairerProfiles.maxTravelKm,
        repairerProfiles.acceptsGratis,
        repairerProfiles.acceptsKulturlegi,
        repairerProfiles.isActive,
        repairerProfiles.isVerified,
        repairerProfiles.serviceDeliveryTypes,
      )
      .orderBy(
        desc(repairerProfiles.isVerified),
        desc(repairerProfiles.averageRating),
        asc(users.name)
      )
      .limit(limit)
      .offset(offset)

    // --- Count query ---
    const [countRow] = await db
      .select({ total: sql<string>`COUNT(DISTINCT ${repairerProfiles.id})` })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .leftJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
      .where(whereCondition)

    const total = parseInt(countRow?.total || '0', 10)

    const technicians = rows.map((row) => ({
      ...row,
      skills: row.skills || [],
      // PG numeric → string at the driver layer; cast back to number so the
      // canonical Technician type (averageRating: number | null) holds at the
      // network boundary instead of crashing TechnicianCard.toFixed().
      averageRating: row.averageRating != null ? Number(row.averageRating) : null,
    }))

    logger.info('Technicians search completed', {
      tier,
      q,
      skills,
      canton,
      resultsCount: technicians.length,
      total,
    })

    // Technician listings are semi-static public data — cache 60s, stale 30s
    return apiSuccessCached({
      technicians,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + technicians.length < total,
      },
    }, 60, 30)
  } catch (error) {
    logger.error('Error fetching technicians', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
