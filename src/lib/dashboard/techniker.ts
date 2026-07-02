import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS, OFFER_STATUS } from '@/config/it-hilfe'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Narrow projection used only by the dashboard summary header.
 * NOT the canonical Technician type — see @/types/technician for that.
 * Renamed from `TechnicianProfile` in QQQ.1 because the name collided
 * with the canonical type and confused readers about what this is.
 */
export interface TechnicianDashboardSummary {
  id: string
  totalJobsCompleted: number
  /** Comes back as a string from PG's decimal type — keep raw for display. */
  averageRating: string
  isActive: boolean
  city: string
}


export interface MatchingRequest {
  id: string
  title: string
  categoryId: string
  urgency: string
  budgetTier: string | null
  budgetAmountCents: number | null
  city: string
  canton: string
  offerCount: number
  createdAt: string
}

export interface MyOffer {
  offerId: string
  offerStatus: string
  offerCreatedAt: string
  requestId: string
  requestTitle: string
  categoryId: string
  urgency: string
  city: string
  canton: string
  requestStatus: string
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function getTechnicianProfile(userId: string): Promise<TechnicianDashboardSummary | null> {
  try {
    const result = await query<{
      id: string
      total_jobs_completed: number
      average_rating: string
      is_active: boolean
      city: string
    }>(
      `SELECT id, total_jobs_completed, average_rating, is_active, city
       FROM ${TABLE_NAMES.REPAIRER_PROFILES}
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      id: row.id,
      totalJobsCompleted: row.total_jobs_completed ?? 0,
      averageRating: row.average_rating ?? '0.0',
      isActive: row.is_active ?? false,
      city: row.city ?? '',
    }
  } catch (error) {
    logger.error('Error fetching technician profile', { error, userId })
    return null
  }
}

export async function getActiveOfferCount(userId: string): Promise<number> {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM ${TABLE_NAMES.IT_HILFE_OFFERS}
       WHERE helper_id = $1 AND status = '${OFFER_STATUS.PENDING}'`,
      [userId]
    )
    return parseInt(result.rows[0]?.count ?? '0', 10)
  } catch (error) {
    logger.error('Error fetching active offer count', { error, userId })
    return 0
  }
}

export async function getMatchingRequests(userId: string): Promise<MatchingRequest[]> {
  try {
    // Get helper's skill IDs from user_skills
    const skillResult = await query<{ skill_id: string }>(
      `SELECT skill_id FROM ${TABLE_NAMES.USER_SKILLS} WHERE user_id = $1`,
      [userId]
    )
    const skillIds = skillResult.rows.map(r => r.skill_id)

    if (skillIds.length === 0) {
      // No skills registered: return open requests (fallback)
      const result = await query<{
        id: string
        title: string
        category_id: string
        urgency: string
        budget_tier: string | null
        budget_amount_cents: number | null
        city: string
        canton: string
        offer_count: number
        created_at: string
      }>(
        `SELECT r.id, r.title, r.category_id, r.urgency, r.budget_tier,
                r.budget_amount_cents, r.city, r.canton, r.offer_count, r.created_at
         FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
         LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} o
           ON o.request_id = r.id AND o.helper_id = $1
         WHERE r.status = '${REQUEST_STATUS.OPEN}'
           AND (r.expires_at IS NULL OR r.expires_at > NOW())
           AND o.id IS NULL
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [userId]
      )
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        categoryId: row.category_id,
        urgency: row.urgency,
        budgetTier: row.budget_tier,
        budgetAmountCents: row.budget_amount_cents,
        city: row.city,
        canton: row.canton,
        offerCount: row.offer_count ?? 0,
        createdAt: row.created_at,
      }))
    }

    // Build parameterized skill array for overlap check
    const skillParams = skillIds.map((_, i) => `$${i + 2}`).join(', ')
    const result = await query<{
      id: string
      title: string
      category_id: string
      urgency: string
      budget_tier: string | null
      budget_amount_cents: number | null
      city: string
      canton: string
      offer_count: number
      created_at: string
    }>(
      `SELECT r.id, r.title, r.category_id, r.urgency, r.budget_tier,
              r.budget_amount_cents, r.city, r.canton, r.offer_count, r.created_at
       FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
       LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} o
         ON o.request_id = r.id AND o.helper_id = $1
       WHERE r.status = '${REQUEST_STATUS.OPEN}'
         AND (r.expires_at IS NULL OR r.expires_at > NOW())
         AND r.skills_needed && ARRAY[${skillParams}]::text[]
         AND o.id IS NULL
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [userId, ...skillIds]
    )

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      categoryId: row.category_id,
      urgency: row.urgency,
      budgetTier: row.budget_tier,
      budgetAmountCents: row.budget_amount_cents,
      city: row.city,
      canton: row.canton,
      offerCount: row.offer_count ?? 0,
      createdAt: row.created_at,
    }))
  } catch (error) {
    logger.error('Error fetching matching requests', { error, userId })
    return []
  }
}

export async function getMyOffers(userId: string): Promise<MyOffer[]> {
  try {
    const result = await query<{
      offer_id: string
      offer_status: string
      offer_created_at: string
      request_id: string
      request_title: string
      category_id: string
      urgency: string
      city: string
      canton: string
      request_status: string
    }>(
      `SELECT
         o.id AS offer_id,
         o.status AS offer_status,
         o.created_at AS offer_created_at,
         r.id AS request_id,
         r.title AS request_title,
         r.category_id,
         r.urgency,
         r.city,
         r.canton,
         r.status AS request_status
       FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
       JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} r ON o.request_id = r.id
       WHERE o.helper_id = $1
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    )

    return result.rows.map(row => ({
      offerId: row.offer_id,
      offerStatus: row.offer_status,
      offerCreatedAt: row.offer_created_at,
      requestId: row.request_id,
      requestTitle: row.request_title,
      categoryId: row.category_id,
      urgency: row.urgency,
      city: row.city,
      canton: row.canton,
      requestStatus: row.request_status,
    }))
  } catch (error) {
    logger.error('Error fetching my offers', { error, userId })
    return []
  }
}
