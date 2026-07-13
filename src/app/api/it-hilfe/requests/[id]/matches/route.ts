/**
 * IT-Hilfe Matching API
 * GET /api/it-hilfe/requests/[id]/matches - Find matching helpers for a request
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { itHilfeRequests, repairerProfiles, userProfiles, userSkills, users } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { getCategoryById, MATCH_SCORES, BUDGET_TIER } from '@/config/it-hilfe'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { technicianHasSkillMatch } from '@/lib/it-hilfe/sql'
import { publicTechnicianListCondition } from '@/lib/domain/technician-visibility'

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
  preferredTechnicianId: string | null
}

interface HelperData {
  id: string
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
        preferredTechnicianId: itHilfeRequests.preferredTechnicianId,
      })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))

    if (!requestData) {
      return apiNotFound('Anfrage')
    }

    const skillsNeeded = requestData.skillsNeeded ?? []
    const skillMatch = technicianHasSkillMatch(skillsNeeded)
    const skillOrPreferred = requestData.preferredTechnicianId
      ? sql`(${repairerProfiles.id} = ${requestData.preferredTechnicianId} OR ${skillMatch})`
      : skillMatch

    const tierFilter = requestData.preferredTechnicianId
      ? sql`(${repairerProfiles.profileTier} = ${REPAIRER_PROFILE_TIER.COMMUNITY} OR ${repairerProfiles.id} = ${requestData.preferredTechnicianId})`
      : eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.COMMUNITY)

    // Find verified active community technicians. Preferred profile is included
    // even when professional-tier (direct request from public profile).
    const helpersResult = await db
      .select({
        id: repairerProfiles.id,
        userId: repairerProfiles.userId,
        userName: users.name,
        bio: repairerProfiles.description,
        hourlyRateCents: repairerProfiles.hourlyRateCents,
        acceptsGratis: repairerProfiles.acceptsGratis,
        acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
        serviceTypes: repairerProfiles.serviceDeliveryTypes,
        locationCanton: repairerProfiles.canton,
        locationCity: repairerProfiles.city,
        averageRating: repairerProfiles.averageRating,
        totalHelpsCompleted: repairerProfiles.totalJobsCompleted,
        skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
        skillCount: sql<number>`COUNT(${userSkills.skillId})`,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, repairerProfiles.userId))
      .leftJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
      .where(and(
        ne(repairerProfiles.userId, requestData.requesterId),
        tierFilter,
        skillOrPreferred,
        publicTechnicianListCondition(),
      ))
      .groupBy(
        repairerProfiles.id,
        repairerProfiles.userId,
        users.name,
        repairerProfiles.description,
        repairerProfiles.hourlyRateCents,
        repairerProfiles.acceptsGratis,
        repairerProfiles.acceptsKulturlegi,
        repairerProfiles.serviceDeliveryTypes,
        repairerProfiles.canton,
        repairerProfiles.city,
        repairerProfiles.averageRating,
        repairerProfiles.totalJobsCompleted,
      )

    // Calculate match scores and sort
    const matchedHelpers = (helpersResult as HelperData[])
      .map(helper => {
        const { score, reasons } = calculateMatchScore(requestData, helper)
        return {
          id: helper.id,
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
          isPreferred: helper.id === requestData.preferredTechnicianId,
          matchScore: score,
          matchReasons: reasons,
        }
      })
      .filter(helper => helper.isPreferred || helper.matchScore > 0)
      .sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred) || b.matchScore - a.matchScore)
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
