/**
 * IT-Hilfe Matching API
 * GET /api/it-hilfe/requests/[id]/matches - Find matching helpers for a request
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { getCategoryById, MATCH_SCORES } from '@/config/it-hilfe'

interface RequestRow {
  id: string
  requester_id: string
  category_id: string
  skills_needed: string[]
  canton: string
  budget_amount_cents: number | null
  budget_type: string
  service_type: string
}

interface HelperRow {
  user_id: string
  user_name: string
  bio: string | null
  hourly_rate_cents: number | null
  accepts_gratis: boolean
  accepts_kulturlegi: boolean
  service_types: string[]
  location_canton: string | null
  location_city: string | null
  skills: string[]
  skill_count: number
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Calculate match score for a helper
 */
function calculateMatchScore(
  request: RequestRow,
  helper: HelperRow
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Skills overlap (most important)
  const helperSkills = new Set(helper.skills || [])
  const requestedSkills = request.skills_needed || []
  const matchingSkills = requestedSkills.filter(skill => helperSkills.has(skill))

  if (matchingSkills.length > 0) {
    score += matchingSkills.length * MATCH_SCORES.PER_SKILL
    reasons.push(`${matchingSkills.length} passende Fähigkeiten`)
  }

  // Device category bonus: helper has skills from the request category's suggestedSkills
  const category = getCategoryById(request.category_id)
  if (category) {
    const categorySuggested = new Set(category.suggestedSkills)
    const hasCategorySkill = (helper.skills || []).some(s => categorySuggested.has(s))
    if (hasCategorySkill) {
      score += MATCH_SCORES.DEVICE_CATEGORY_BONUS
      reasons.push(`Erfahrung mit ${category.name}`)
    }
  }

  // Same canton bonus
  if (helper.location_canton === request.canton) {
    score += MATCH_SCORES.SAME_CANTON
    reasons.push('Gleicher Kanton')
  }

  // Budget compatibility
  const isBudgetCompatible =
    (request.budget_type === 'gratis' && helper.accepts_gratis) ||
    (request.budget_type === 'kulturlegi' && helper.accepts_kulturlegi) ||
    (request.budget_amount_cents && helper.hourly_rate_cents &&
     helper.hourly_rate_cents <= request.budget_amount_cents) ||
    helper.accepts_gratis

  if (isBudgetCompatible) {
    score += MATCH_SCORES.BUDGET_COMPATIBLE
    if (helper.accepts_gratis && (request.budget_type === 'gratis' || !request.budget_amount_cents)) {
      reasons.push('Bietet kostenlose Hilfe an')
    } else if (helper.accepts_kulturlegi && request.budget_type === 'kulturlegi') {
      reasons.push('Akzeptiert KulturLegi')
    } else {
      reasons.push('Budget passt')
    }
  }

  // Service type match
  const helperServiceTypes = helper.service_types || []
  if (helperServiceTypes.includes(request.service_type) ||
      helperServiceTypes.includes('flexible')) {
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
    const requestResult = await query(`
      SELECT
        id, requester_id, category_id, skills_needed, canton,
        budget_amount_cents, budget_type, service_type
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}
      WHERE id = $1
    `, [id])

    if (requestResult.rows.length === 0) {
      return apiNotFound('Anfrage')
    }

    const requestData = requestResult.rows[0] as RequestRow

    // Find potential helpers with at least one matching skill
    const helpersResult = await query(`
      SELECT
        hp.user_id,
        u.name as user_name,
        hp.bio,
        hp.hourly_rate_cents,
        hp.accepts_gratis,
        hp.accepts_kulturlegi,
        hp.service_types,
        hp.location_canton,
        hp.location_city,
        ARRAY_AGG(us.skill_id) FILTER (WHERE us.skill_id IS NOT NULL) as skills,
        COUNT(us.skill_id) as skill_count
      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.USER_SKILLS} us ON hp.user_id = us.user_id
      WHERE hp.is_active = true
        AND hp.user_id != $1
        AND EXISTS (
          SELECT 1 FROM ${TABLE_NAMES.USER_SKILLS} us2
          WHERE us2.user_id = hp.user_id
          AND us2.skill_id = ANY($2::text[])
        )
      GROUP BY hp.user_id, u.name, hp.bio, hp.hourly_rate_cents,
               hp.accepts_gratis, hp.accepts_kulturlegi, hp.service_types,
               hp.location_canton, hp.location_city
    `, [
      requestData.requester_id,
      requestData.skills_needed || [],
    ])

    // Calculate match scores and sort
    const matchedHelpers = (helpersResult.rows as HelperRow[])
      .map(helper => {
        const { score, reasons } = calculateMatchScore(requestData, helper)
        return {
          userId: helper.user_id,
          name: helper.user_name,
          bio: helper.bio,
          hourlyRateCents: helper.hourly_rate_cents,
          acceptsGratis: helper.accepts_gratis,
          acceptsKulturlegi: helper.accepts_kulturlegi,
          serviceTypes: helper.service_types || [],
          canton: helper.location_canton,
          city: helper.location_city,
          skills: helper.skills || [],
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

    return apiSuccess({
      matches: matchedHelpers,
      total: matchedHelpers.length,
    })
  } catch (error) {
    logger.error('Error finding matching helpers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
