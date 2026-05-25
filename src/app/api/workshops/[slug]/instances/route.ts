import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, sql, asc, and } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: workshopSlug } = await params

    // Single query: join workshops → instances → registrations (eliminates a round-trip)
    const rows = await db
      .select({
        id: workshopInstances.id,
        workshop_id: workshopInstances.workshopId,
        start_date: workshopInstances.startDate,
        end_date: workshopInstances.endDate,
        location: workshopInstances.location,
        max_participants: workshopInstances.maxParticipants,
        // Exclude CANCELLED — see eac01d4a/d38a2787 for the matching
        // invariant on the stored-count side.
        current_participants: sql<string>`COUNT(CASE WHEN ${workshopRegistrations.status} != ${WORKSHOP_REGISTRATION_STATUS.CANCELLED} THEN ${workshopRegistrations.id} END)`,
        status: workshopInstances.status,
        notes: workshopInstances.notes,
        created_at: workshopInstances.createdAt,
        updated_at: workshopInstances.updatedAt,
      })
      .from(workshopInstances)
      .innerJoin(workshops, and(
        eq(workshopInstances.workshopId, workshops.id),
        eq(workshops.slug, workshopSlug),
        eq(workshops.isActive, true),
      ))
      .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
      .groupBy(workshopInstances.id)
      .orderBy(asc(workshopInstances.startDate))

    if (rows.length === 0) {
      // Could be workshop not found or genuinely no instances — check for the workshop
      const [workshop] = await db
        .select({ id: workshops.id })
        .from(workshops)
        .where(and(eq(workshops.slug, workshopSlug), eq(workshops.isActive, true)))
      if (!workshop) return apiNotFound('Workshop')
    }

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