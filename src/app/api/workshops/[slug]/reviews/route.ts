import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshops, workshopRegistrations, workshopInstances, users } from '@/db/schema'
import { eq, and, isNotNull, ne, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

// GET /api/workshops/[slug]/reviews - Get reviews for a workshop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get the workshop ID
    const [workshop] = await db
      .select({ id: workshops.id })
      .from(workshops)
      .where(eq(workshops.slug, slug))

    if (!workshop) {
      return apiNotFound('Workshop')
    }

    // Get reviews with user names + stats in parallel
    const [reviews, [statsRow]] = await Promise.all([
      db
        .select({
          id: workshopRegistrations.id,
          user_name: sql<string>`COALESCE(${users.name}, 'Anonym')`,
          rating: workshopRegistrations.rating,
          feedback: workshopRegistrations.feedback,
          created_at: workshopRegistrations.createdAt,
          instance_date: workshopInstances.startDate,
        })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .innerJoin(users, eq(workshopRegistrations.userId, users.id))
        .where(and(
          eq(workshopInstances.workshopId, workshop.id),
          isNotNull(workshopRegistrations.rating),
          isNotNull(workshopRegistrations.feedback),
          ne(workshopRegistrations.feedback, ''),
        ))
        .orderBy(desc(workshopRegistrations.createdAt))
        .limit(20),

      db
        .select({
          average_rating: sql<string>`ROUND(AVG(${workshopRegistrations.rating})::numeric, 1)`,
          review_count: sql<string>`COUNT(${workshopRegistrations.id})`,
        })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .where(and(
          eq(workshopInstances.workshopId, workshop.id),
          isNotNull(workshopRegistrations.rating),
        )),
    ])

    return apiSuccess({
      reviews,
      stats: {
        averageRating: parseFloat(statsRow?.average_rating || '0') || 0,
        reviewCount: parseInt(statsRow?.review_count || '0') || 0,
      },
    })

  } catch (error) {
    logger.error('Error fetching workshop reviews', { error })
    return apiError(error, 'Bewertungen konnten nicht geladen werden')
  }
}
