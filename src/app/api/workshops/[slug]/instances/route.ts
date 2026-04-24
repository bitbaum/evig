import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, sql, asc } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: workshopSlug } = await params

    // Get workshop ID first
    const [workshop] = await db
      .select({ id: workshops.id })
      .from(workshops)
      .where(sql`${workshops.slug} = ${workshopSlug} AND ${workshops.isActive} = true`)

    if (!workshop) {
      return apiNotFound('Workshop')
    }

    // Get workshop instances with participant count
    const rows = await db
      .select({
        id: workshopInstances.id,
        workshop_id: workshopInstances.workshopId,
        start_date: workshopInstances.startDate,
        end_date: workshopInstances.endDate,
        location: workshopInstances.location,
        max_participants: workshopInstances.maxParticipants,
        current_participants: sql<string>`COUNT(${workshopRegistrations.id})`,
        status: workshopInstances.status,
        notes: workshopInstances.notes,
        created_at: workshopInstances.createdAt,
        updated_at: workshopInstances.updatedAt,
      })
      .from(workshopInstances)
      .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
      .where(eq(workshopInstances.workshopId, workshop.id))
      .groupBy(workshopInstances.id)
      .orderBy(asc(workshopInstances.startDate))

    // Workshop instances are public; participant count changes on registration — cache 30s, stale 15s
    return apiSuccessCached(
      rows.map(instance => ({
        ...instance,
        current_participants: parseInt(instance.current_participants) || 0,
      })),
      30, 15
    )

  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Workshop-Termine')
  }
}