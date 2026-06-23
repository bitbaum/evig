import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { repairerProfiles, users, userSkills } from '@/db/schema'
import { eq, and, sql, desc, ne } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination , hasMoreItems} from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { HELPER_STATUS } from '@/config/helper-status'

// GET /api/admin/it-hilfe/helpers - List all helper profiles
export const GET = withAdmin('it-hilfe-admin', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const canton = searchParams.get('canton')
    const skill = searchParams.get('skill')
    const { limit, offset } = parsePagination(request)

    const conditions: ReturnType<typeof eq>[] = [eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.COMMUNITY)]

    if (status === HELPER_STATUS.ACTIVE) {
      conditions.push(eq(repairerProfiles.isActive, true))
      conditions.push(ne(repairerProfiles.status, 'suspended'))
    } else if (status === HELPER_STATUS.VERIFIED) {
      conditions.push(eq(repairerProfiles.isVerified, true))
    } else if (status === HELPER_STATUS.SUSPENDED) {
      conditions.push(eq(repairerProfiles.status, 'suspended'))
    }

    if (canton) {
      conditions.push(eq(repairerProfiles.canton, canton))
    }

    if (skill) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${sql.raw(TABLE_NAMES.USER_SKILLS)} us WHERE us.user_id = ${repairerProfiles.userId} AND us.skill_id = ${skill})`
      )
    }

    const where = and(...conditions)

    const rows = await db
      .select({
        id: repairerProfiles.id,
        user_id: repairerProfiles.userId,
        bio: repairerProfiles.description,
        hourly_rate_cents: repairerProfiles.hourlyRateCents,
        accepts_gratis: repairerProfiles.acceptsGratis,
        accepts_kulturlegi: repairerProfiles.acceptsKulturlegi,
        service_types: repairerProfiles.serviceDeliveryTypes,
        location_city: repairerProfiles.city,
        location_canton: repairerProfiles.canton,
        is_active: repairerProfiles.isActive,
        is_verified: repairerProfiles.isVerified,
        verified_at: repairerProfiles.verificationDate,
        suspended_at: sql<string | null>`CASE WHEN ${repairerProfiles.status} = 'suspended' THEN ${repairerProfiles.updatedAt} ELSE NULL END`,
        total_helps_completed: repairerProfiles.totalJobsCompleted,
        average_rating: repairerProfiles.averageRating,
        created_at: repairerProfiles.createdAt,
        helper_name: users.name,
        helper_email: users.email,
        skills: sql<string[] | null>`(SELECT array_agg(us.skill_id) FROM ${sql.raw(TABLE_NAMES.USER_SKILLS)} us WHERE us.user_id = ${repairerProfiles.userId})`,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .where(where)
      .orderBy(desc(repairerProfiles.createdAt))
      .limit(limit)
      .offset(offset)

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(repairerProfiles)
      .where(where)

    const total = Number(countRow?.total ?? 0)

    return apiSuccess({
      items: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: hasMoreItems(offset, limit, total),
      },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
