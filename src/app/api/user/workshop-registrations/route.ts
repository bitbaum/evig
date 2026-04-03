import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopRegistrations, workshopInstances, workshops } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const rows = await db
      .select({
        id: workshopRegistrations.id,
        workshop_title: workshops.title,
        workshop_slug: workshops.slug,
        start_date: workshopInstances.startDate,
        location: workshopInstances.location,
        status: workshopRegistrations.status,
        created_at: workshopRegistrations.createdAt,
        updated_at: workshopRegistrations.updatedAt,
      })
      .from(workshopRegistrations)
      .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
      .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
      .where(eq(workshopRegistrations.userId, session.user.id))
      .orderBy(desc(workshopRegistrations.createdAt))

    return apiSuccess({ registrations: rows })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
