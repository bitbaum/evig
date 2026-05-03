import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { helperProfiles, users, userSkills } from '@/db/schema'
import { eq, and, isNull, isNotNull, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination , hasMoreItems} from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { HELPER_STATUS } from '@/config/helper-status'

// GET /api/admin/it-hilfe/helpers - List all helper profiles
export const GET = withAdmin('it-hilfe-admin', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const canton = searchParams.get('canton')
    const skill = searchParams.get('skill')
    const { limit, offset } = parsePagination(request)

    const conditions = []

    if (status === HELPER_STATUS.ACTIVE) {
      conditions.push(eq(helperProfiles.isActive, true))
      conditions.push(isNull(helperProfiles.suspendedAt))
    } else if (status === HELPER_STATUS.VERIFIED) {
      conditions.push(eq(helperProfiles.isVerified, true))
    } else if (status === HELPER_STATUS.SUSPENDED) {
      conditions.push(isNotNull(helperProfiles.suspendedAt))
    }

    if (canton) {
      conditions.push(eq(helperProfiles.locationCanton, canton))
    }

    if (skill) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${sql.raw(TABLE_NAMES.USER_SKILLS)} us WHERE us.user_id = ${helperProfiles.userId} AND us.skill_id = ${skill})`
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: helperProfiles.id,
        user_id: helperProfiles.userId,
        bio: helperProfiles.bio,
        hourly_rate_cents: helperProfiles.hourlyRateCents,
        accepts_gratis: helperProfiles.acceptsGratis,
        accepts_kulturlegi: helperProfiles.acceptsKulturlegi,
        service_types: helperProfiles.serviceTypes,
        location_city: helperProfiles.locationCity,
        location_canton: helperProfiles.locationCanton,
        is_active: helperProfiles.isActive,
        is_verified: helperProfiles.isVerified,
        verified_at: helperProfiles.verifiedAt,
        suspended_at: helperProfiles.suspendedAt,
        admin_notes: helperProfiles.adminNotes,
        total_helps_completed: helperProfiles.totalHelpsCompleted,
        average_rating: helperProfiles.averageRating,
        created_at: helperProfiles.createdAt,
        helper_name: users.name,
        helper_email: users.email,
        skills: sql<string[] | null>`(SELECT array_agg(us.skill_id) FROM ${sql.raw(TABLE_NAMES.USER_SKILLS)} us WHERE us.user_id = ${helperProfiles.userId})`,
      })
      .from(helperProfiles)
      .innerJoin(users, eq(helperProfiles.userId, users.id))
      .where(where)
      .orderBy(desc(helperProfiles.createdAt))
      .limit(limit)
      .offset(offset)

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(helperProfiles)
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
