import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { workshopRegistrations, workshopInstances, workshops } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiSuccess({
        registered: false,
        requiresAuth: true
      })
    }

    const { instanceId } = await params

    // Check if user is registered for this workshop instance
    const [reg] = await db
      .select({
        id: workshopRegistrations.id,
        status: workshopRegistrations.status,
        createdAt: workshopRegistrations.createdAt,
        startDate: workshopInstances.startDate,
        location: workshopInstances.location,
        workshopTitle: workshops.title,
        workshopSlug: workshops.slug,
      })
      .from(workshopRegistrations)
      .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
      .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
      .where(and(
        eq(workshopRegistrations.userId, session.user.id),
        eq(workshopRegistrations.workshopInstanceId, instanceId)
      ))

    if (reg) {
      return apiSuccess({
        registered: true,
        registration: {
          id: reg.id,
          status: reg.status,
          registered_at: reg.createdAt,
          workshop_instance: {
            start_date: reg.startDate,
            location: reg.location,
            workshop_title: reg.workshopTitle,
            workshop_slug: reg.workshopSlug
          }
        }
      })
    }

    return apiSuccess({
      registered: false,
      canRegister: true
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
