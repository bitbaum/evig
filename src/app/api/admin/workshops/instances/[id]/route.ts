import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshopInstances, workshops, workshopRegistrations, users } from '@/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

// GET /api/admin/workshops/instances/[id] - Get instance details
export const GET = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Get instance details with workshop info and participant count
    const [instance] = await db
      .select({
        id: workshopInstances.id,
        workshop_id: workshopInstances.workshopId,
        workshop_title: workshops.title,
        workshop_slug: workshops.slug,
        start_date: workshopInstances.startDate,
        end_date: workshopInstances.endDate,
        location: workshopInstances.location,
        instructor: workshopInstances.instructor,
        max_participants: workshopInstances.maxParticipants,
        notes: workshopInstances.notes,
        status: workshopInstances.status,
        current_participants: sql<number>`count(${workshopRegistrations.id})`,
        created_at: workshopInstances.createdAt,
      })
      .from(workshopInstances)
      .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
      .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
      .where(eq(workshopInstances.id, id))
      .groupBy(workshopInstances.id, workshops.title, workshops.slug)

    if (!instance) {
      return apiNotFound('Workshop instance not found')
    }

    // Get registrations for this instance
    const registrations = await db
      .select({
        id: workshopRegistrations.id,
        user_id: workshopRegistrations.userId,
        user_name: users.name,
        user_email: users.email,
        status: workshopRegistrations.status,
        payment_status: workshopRegistrations.paymentStatus,
        payment_amount_cents: workshopRegistrations.paymentAmountCents,
        registered_at: workshopRegistrations.createdAt,
        attended: workshopRegistrations.attended,
        rating: workshopRegistrations.rating,
        feedback: workshopRegistrations.feedback,
      })
      .from(workshopRegistrations)
      .innerJoin(users, eq(workshopRegistrations.userId, users.id))
      .where(eq(workshopRegistrations.workshopInstanceId, id))
      .orderBy(desc(workshopRegistrations.createdAt))

    return apiSuccess({
      instance: {
        ...instance,
        current_participants: Number(instance.current_participants) || 0,
      },
      registrations,
    })
  } catch (error) {
    logger.error('Error fetching workshop instance', { error })
    return apiError(error, 'Failed to fetch workshop instance')
  }
})

// PUT /api/admin/workshops/instances/[id] - Update instance
export const PUT = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()

    const {
      startDate,
      endDate,
      location,
      instructor,
      maxParticipants,
      notes,
      status,
    } = body

    // Check instance exists
    const [existing] = await db
      .select({ id: workshopInstances.id })
      .from(workshopInstances)
      .where(eq(workshopInstances.id, id))

    if (!existing) {
      return apiNotFound('Workshop instance not found')
    }

    // Build update object
    const update: Record<string, unknown> = {}
    if (startDate !== undefined) update.startDate = new Date(startDate).toISOString()
    if (endDate !== undefined) update.endDate = endDate ? new Date(endDate).toISOString() : null
    if (location !== undefined) update.location = location
    if (instructor !== undefined) update.instructor = instructor
    if (maxParticipants !== undefined) update.maxParticipants = maxParticipants
    if (notes !== undefined) update.notes = notes
    if (status !== undefined) update.status = status

    if (Object.keys(update).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    update.updatedAt = sql`NOW()`

    const [updated] = await db
      .update(workshopInstances)
      .set(update)
      .where(eq(workshopInstances.id, id))
      .returning()

    logger.info('Workshop instance updated', {
      instanceId: id,
      updatedBy: session.user.id,
      updates: Object.keys(body),
    })

    return apiSuccess({
      instance: updated,
      message: 'Workshop instance updated successfully',
    })
  } catch (error) {
    logger.error('Error updating workshop instance', { error })
    return apiError(error, 'Failed to update workshop instance')
  }
})

// DELETE /api/admin/workshops/instances/[id] - Delete instance
export const DELETE = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check for existing registrations
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workshopRegistrations)
      .where(eq(workshopRegistrations.workshopInstanceId, id))

    const registrationCount = Number(countResult?.count ?? 0)

    if (registrationCount > 0) {
      return apiBadRequest(
        `Cannot delete instance with ${registrationCount} registration(s). Cancel or move registrations first.`
      )
    }

    await db.delete(workshopInstances).where(eq(workshopInstances.id, id))

    logger.info('Workshop instance deleted', {
      instanceId: id,
      deletedBy: session.user.id,
    })

    return apiSuccess({
      message: 'Workshop instance deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting workshop instance', { error })
    return apiError(error, 'Failed to delete workshop instance')
  }
})
