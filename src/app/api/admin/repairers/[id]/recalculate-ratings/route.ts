import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { repairerProfiles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

export const POST = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: repairerId } = context!.params!
  try {
    // Check if repairer exists
    const [repairer] = await db
      .select({ id: repairerProfiles.id, businessName: repairerProfiles.businessName })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.id, repairerId))

    if (!repairer) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    // Manually call the rating update function
    await db.execute(sql`SELECT update_repairer_rating_summary(${repairerId})`)

    // Get updated ratings to return
    const [updated] = await db
      .select({
        averageRating: repairerProfiles.averageRating,
        totalReviews: repairerProfiles.totalReviews,
      })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.id, repairerId))

    logger.info('Recalculated repairer ratings', {
      repairerId,
      adminId: session.user.id,
      newAverageRating: updated?.averageRating,
      newTotalReviews: updated?.totalReviews
    })

    return apiSuccess({
      message: 'Bewertungen erfolgreich neu berechnet',
      repairerId,
      ratings: {
        averageRating: Number(updated?.averageRating) || 0,
        totalReviews: Number(updated?.totalReviews) || 0,
      }
    })

  } catch (error) {
    logger.error('Error recalculating repairer ratings', { error, repairerId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
