import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { locations, locationApprovals, locationBookings } from '@/db/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { LOCATION_STATUS } from '@/config/location-status'
import { BOOKING_STATUS } from '@/config/booking-status'
import { validateBody, UpdateLocationSchema } from '@/lib/schemas'

// GET /api/locations/[id] - Get location details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: locationId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const creatorUser = alias(users, 'creator_user')

    // Get location with creator and approval info
    const locationRows = await db
      .select({
        location: locations,
        creatorName: creatorUser.name,
        creatorEmail: creatorUser.email,
        lastApprovalAction: locationApprovals.action,
        lastReviewedAt: locationApprovals.reviewedAt,
        lastReviewNotes: locationApprovals.reviewNotes,
        totalBookings: sql<string>`COUNT(DISTINCT ${locationBookings.id})`,
        upcomingBookings: sql<string>`COUNT(DISTINCT CASE WHEN ${locationBookings.startTime} > CURRENT_TIMESTAMP AND ${locationBookings.status} IN (${BOOKING_STATUS.PENDING}, ${BOOKING_STATUS.CONFIRMED}) THEN ${locationBookings.id} END)`,
      })
      .from(locations)
      .leftJoin(creatorUser, eq(locations.createdBy, creatorUser.id))
      .leftJoin(locationApprovals, and(
        eq(locations.id, locationApprovals.locationId),
        eq(locationApprovals.reviewedAt, sql`(SELECT MAX(reviewed_at) FROM ${sql.raw(TABLE_NAMES.LOCATION_APPROVALS)} WHERE location_id = ${locations.id})`)
      ))
      .leftJoin(locationBookings, eq(locations.id, locationBookings.locationId))
      .where(eq(locations.id, locationId))
      .groupBy(
        locations.id,
        creatorUser.name,
        creatorUser.email,
        locationApprovals.action,
        locationApprovals.reviewedAt,
        locationApprovals.reviewNotes
      )

    if (locationRows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const row = locationRows[0]
    const location = {
      ...row.location,
      creator_name: row.creatorName,
      creator_email: row.creatorEmail,
      last_approval_action: row.lastApprovalAction,
      last_reviewed_at: row.lastReviewedAt,
      last_review_notes: row.lastReviewNotes,
      total_bookings: row.totalBookings,
      upcoming_bookings: row.upcomingBookings,
    }

    // Get recent bookings
    const bookedByUser = alias(users, 'booked_by_user')
    const recentBookings = await db
      .select({
        booking: locationBookings,
        bookedByName: bookedByUser.name,
        bookedByEmail: bookedByUser.email,
      })
      .from(locationBookings)
      .leftJoin(bookedByUser, eq(locationBookings.bookedBy, bookedByUser.id))
      .where(and(
        eq(locationBookings.locationId, locationId),
        sql`${locationBookings.startTime} > CURRENT_TIMESTAMP`
      ))
      .orderBy(locationBookings.startTime)
      .limit(10)

    return apiSuccess({
      location,
      recentBookings: recentBookings.map(r => ({
        ...r.booking,
        booked_by_name: r.bookedByName,
        booked_by_email: r.bookedByEmail,
      }))
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id: locationId } = await params
    const body = await request.json()
    const validation = validateBody(UpdateLocationSchema, body)
    if (!validation.success) return validation.error
    const validatedBody = validation.data

    // Check if user owns this location or is admin
    const [locationRow] = await db
      .select({
        createdBy: locations.createdBy,
        approvalStatus: locations.approvalStatus,
      })
      .from(locations)
      .where(eq(locations.id, locationId))

    if (!locationRow) {
      return apiNotFound('Ort nicht gefunden')
    }

    const isOwner = locationRow.createdBy === session.user.id
    const isAdmin = session.user.isStaff

    if (!isOwner && !isAdmin) {
      return apiForbidden('Keine Berechtigung diesen Ort zu bearbeiten')
    }

    // Prevent editing approved locations unless admin
    if (locationRow.approvalStatus === LOCATION_STATUS.APPROVED && !isAdmin) {
      return apiForbidden('Genehmigte Orte können nur von Administratoren bearbeitet werden')
    }

    // Build update set from allowed fields
    const allowedFields: Record<string, keyof typeof locations.$inferInsert> = {
      name: 'name',
      description: 'description',
      address_line1: 'addressLine1',
      address_line2: 'addressLine2',
      postal_code: 'postalCode',
      city: 'city',
      canton: 'canton',
      country: 'country',
      latitude: 'latitude',
      longitude: 'longitude',
      max_capacity: 'maxCapacity',
      facilities: 'facilities',
      accessibility_info: 'accessibilityInfo',
      contact_name: 'contactName',
      contact_phone: 'contactPhone',
      contact_email: 'contactEmail',
    }

    const updateSet: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(validatedBody)) {
      if (key in allowedFields) {
        const drizzleKey = allowedFields[key]
        updateSet[drizzleKey] = key === 'accessibility_info' ? JSON.stringify(value) : value
      }
    }

    if (Object.keys(updateSet).length === 0) {
      return apiBadRequest('Keine gültigen Felder zum Aktualisieren')
    }

    updateSet.updatedAt = sql`CURRENT_TIMESTAMP`

    const [updated] = await db
      .update(locations)
      .set(updateSet)
      .where(eq(locations.id, locationId))
      .returning()

    return apiSuccess({
      location: updated,
      message: 'Ort erfolgreich aktualisiert'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id: locationId } = await params

    // Check ownership and permissions
    const [locationRow] = await db
      .select({
        createdBy: locations.createdBy,
        approvalStatus: locations.approvalStatus,
      })
      .from(locations)
      .where(eq(locations.id, locationId))

    if (!locationRow) {
      return apiNotFound('Ort nicht gefunden')
    }

    const isOwner = locationRow.createdBy === session.user.id
    const isAdmin = session.user.isStaff

    if (!isOwner && !isAdmin) {
      return apiForbidden('Keine Berechtigung diesen Ort zu löschen')
    }

    // Check for active bookings
    const [activeBookingCount] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(locationBookings)
      .where(and(
        eq(locationBookings.locationId, locationId),
        inArray(locationBookings.status, [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED]),
        sql`${locationBookings.startTime} > CURRENT_TIMESTAMP`
      ))

    if (parseInt(activeBookingCount.count) > 0) {
      return apiBadRequest('Ort kann nicht gelöscht werden, da aktive Buchungen existieren')
    }

    // Delete location
    await db.delete(locations).where(eq(locations.id, locationId))

    return apiSuccess({
      message: 'Ort erfolgreich gelöscht'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
