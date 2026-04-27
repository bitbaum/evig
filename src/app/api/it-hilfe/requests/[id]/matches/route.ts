/**
 * IT-Hilfe Matching API
 * GET /api/it-hilfe/requests/[id]/matches - Find matching helpers for a request
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { itHilfeRequests, helperProfiles, userSkills, users } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { getCategoryById, MATCH_SCORES, BUDGET_TIER } from '@/config/it-hilfe'

interface RequestData {
  id: string
  requesterId: string
  categoryId: string
  skillsNeeded: string[] | null
  canton: string
  budgetAmountCents: number | null
  budgetType: string
  budgetTier: string | null
  serviceType: string | null
}

interface HelperData {
  userId: string
  userName: string | null
  bio: string | null
  hourlyRateCents: number | null
  acceptsGratis: boolean | null
  acceptsKulturlegi: boolean | null
  serviceTypes: string[] | null
  locationCanton: string | null
  locationCity: string | null
  averageRating: string | null
  totalHelpsCompleted: number | null
  skills: string[] | null
  skillCount: number
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Calculate match score for a helper
 */
function calculateMatchScore(
  request: RequestData,
  helper: HelperData
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Skills overlap (most important)
  const helperSkills = new Set(helper.skills || [])
  const requestedSkills = request.skillsNeeded || []
  const matchingSkills = requestedSkills.filter(skill => helperSkills.has(skill))

  if (matchingSkills.length > 0) {
    score += matchingSkills.length * MATCH_SCORES.PER_SKILL
    reasons.push(`${matchingSkills.length} passende Fähigkeiten`)
  }

  // Device category bonus: helper has skills from the request category's suggestedSkills
  const category = getCategoryById(request.categoryId)
  if (category) {
    const categorySuggested = new Set(category.suggestedSkills)
    const hasCategorySkill = (helper.skills || []).some(s => categorySuggested.has(s))
    if (hasCategorySkill) {
      score += MATCH_SCORES.DEVICE_CATEGORY_BONUS
      reasons.push(`Erfahrung mit ${category.name}`)
    }
  }

  // Same canton bonus
  if (helper.locationCanton === request.canton) {
    score += MATCH_SCORES.SAME_CANTON
    reasons.push('Gleicher Kanton')
  }

  // Budget compatibility — use budgetTier when available for more accurate matching
  const effectiveTier = request.budgetTier || request.budgetType
  const isBudgetCompatible =
    (effectiveTier === BUDGET_TIER.GRATIS && helper.acceptsGratis) ||
    (effectiveTier === BUDGET_TIER.KULTURLEGI && helper.acceptsKulturlegi) ||
    (effectiveTier === 'free' && helper.acceptsGratis) ||
    (request.budgetAmountCents && helper.hourlyRateCents &&
     helper.hourlyRateCents <= request.budgetAmountCents) ||
    helper.acceptsGratis

  if (isBudgetCompatible) {
    score += MATCH_SCORES.BUDGET_COMPATIBLE
    if (helper.acceptsGratis && (effectiveTier === BUDGET_TIER.GRATIS || effectiveTier === 'free' || !request.budgetAmountCents)) {
      reasons.push('Bietet kostenlose Hilfe an')
    } else if (helper.acceptsKulturlegi && effectiveTier === BUDGET_TIER.KULTURLEGI) {
      reasons.push('Akzeptiert KulturLegi')
    } else {
      reasons.push('Budget passt')
    }
  }

  // Service type match
  const helperServiceTypes = helper.serviceTypes || []
  if (request.serviceType && (helperServiceTypes.includes(request.serviceType) ||
      helperServiceTypes.includes('flexible'))) {
    score += MATCH_SCORES.SERVICE_TYPE_MATCH
    reasons.push('Passende Service-Art')
  }

  return { score, reasons }
}

/**
 * GET /api/it-hilfe/requests/[id]/matches
 * Find matching helpers for a request based on skills, location, budget, and service type
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return apiNotFound('Anfrage')
    }

    // Get request details
    const [requestData] = await db
      .select({
        id: itHilfeRequests.id,
        requesterId: itHilfeRequests.requesterId,
        categoryId: itHilfeRequests.categoryId,
        skillsNeeded: itHilfeRequests.skillsNeeded,
        canton: itHilfeRequests.canton,
        budgetAmountCents: itHilfeRequests.budgetAmountCents,
        budgetType: itHilfeRequests.budgetType,
        budgetTier: itHilfeRequests.budgetTier,
        serviceType: itHilfeRequests.serviceType,
      })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))

    if (!requestData) {
      return apiNotFound('Anfrage')
    }

    // Find potential helpers with at least one matching skill
    const helpersResult = await db
      .select({
        userId: helperProfiles.userId,
        userName: users.name,
        bio: helperProfiles.bio,
        hourlyRateCents: helperProfiles.hourlyRateCents,
        acceptsGratis: helperProfiles.acceptsGratis,
        acceptsKulturlegi: helperProfiles.acceptsKulturlegi,
        serviceTypes: helperProfiles.serviceTypes,
        locationCanton: helperProfiles.locationCanton,
        locationCity: helperProfiles.locationCity,
        averageRating: helperProfiles.averageRating,
        totalHelpsCompleted: helperProfiles.totalHelpsCompleted,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
        skillCount: sql<number>`COUNT(${userSkills.skillId})`,
      })
      .from(helperProfiles)
      .innerJoin(users, eq(helperProfiles.userId, users.id))
      .leftJoin(userSkills, eq(helperProfiles.userId, userSkills.userId))
      .where(and(
        eq(helperProfiles.isActive, true),
        ne(helperProfiles.userId, requestData.requesterId),
        sql`EXISTS (
          SELECT 1 FROM ${userSkills} us2
          WHERE us2.user_id = ${helperProfiles.userId}
          AND us2.skill_id = ANY(${requestData.skillsNeeded || []}::text[])
        )`
      ))
      .groupBy(
        helperProfiles.userId,
        users.name,
        helperProfiles.bio,
        helperProfiles.hourlyRateCents,
        helperProfiles.acceptsGratis,
        helperProfiles.acceptsKulturlegi,
        helperProfiles.serviceTypes,
        helperProfiles.locationCanton,
        helperProfiles.locationCity,
        helperProfiles.averageRating,
        helperProfiles.totalHelpsCompleted,
      )

    // Calculate match scores and sort
    const matchedHelpers = (helpersResult as HelperData[])
      .map(helper => {
        const { score, reasons } = calculateMatchScore(requestData, helper)
        return {
          userId: helper.userId,
          name: helper.userName,
          bio: helper.bio,
          hourlyRateCents: helper.hourlyRateCents,
          acceptsGratis: helper.acceptsGratis,
          acceptsKulturlegi: helper.acceptsKulturlegi,
          serviceTypes: helper.serviceTypes || [],
          canton: helper.locationCanton,
          city: helper.locationCity,
          skills: helper.skills || [],
          averageRating: helper.averageRating,
          totalHelpsCompleted: helper.totalHelpsCompleted || 0,
          matchScore: score,
          matchReasons: reasons,
        }
      })
      .filter(helper => helper.matchScore > 0) // Only return helpers with some match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10) // Top 10 matches

    logger.info('Found matching helpers', {
      requestId: id,
      totalMatches: matchedHelpers.length,
      topScore: matchedHelpers[0]?.matchScore || 0,
    })

    // Matching helpers change as helper profiles update — cache 30s, stale 15s
    return apiSuccessCached({
      matches: matchedHelpers,
      total: matchedHelpers.length,
    }, 30, 15)
  } catch (error) {
    logger.error('Error finding matching helpers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
