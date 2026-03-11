import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { locations, locationBookings } from '@/db/schema'
import { eq, and, sql, or, gte, lte } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { LOCATION_STATUS } from '@/config/location-status'
import { BOOKING_STATUS } from '@/config/booking-status'
import { validateBody, CreateLocationBookingSchema } from '@/lib/schemas'


// GET /api/locations/[id]/bookings - Get location bookings
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Verify location exists and is approved
    const [locationRow] = await db
      .select({
        id: locations.id,
        approvalStatus: locations.approvalStatus,
      })
      .from(locations)
      .where(eq(locations.id, locationId))

    if (!locationRow) {
      return apiNotFound('Ort nicht gefunden')
    }

    if (locationRow.approvalStatus !== LOCATION_STATUS.APPROVED) {
      return apiForbidden('Ort ist nicht zur Buchung freigegeben')
    }

    // Build conditions
    const conditions = [eq(locationBookings.locationId, locationId)]

    if (status) {
      conditions.push(eq(locationBookings.status, status))
    }
    if (startDate) {
      conditions.push(gte(locationBookings.startTime, startDate))
    }
    if (endDate) {
      conditions.push(lte(locationBookings.endTime, endDate))
    }

    const bookedByUser = alias(users, 'booked_by_user')

    const bookings = await db
      .select({
        booking: locationBookings,
        bookedByName: bookedByUser.name,
        bookedByEmail: bookedByUser.email,
        locationName: locations.name,
      })
      .from(locationBookings)
      .leftJoin(bookedByUser, eq(locationBookings.bookedBy, bookedByUser.id))
      .leftJoin(locations, eq(locationBookings.locationId, locations.id))
      .where(and(...conditions))
      .orderBy(locationBookings.startTime)

    return apiSuccess({
      bookings: bookings.map(r => ({
        ...r.booking,
        booked_by_name: r.bookedByName,
        booked_by_email: r.bookedByEmail,
        location_name: r.locationName,
      })),
      location: locationRow
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// POST /api/locations/[id]/bookings - Create location booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: locationId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }
    const body = await request.json()
    const validation = validateBody(CreateLocationBookingSchema, body)
    if (!validation.success) return validation.error
    const {
      event_type,
      event_id,
      title,
      description,
      start_time,
      end_time,
      expected_attendees,
      special_requirements
    } = validation.data

    // Parse and validate dates
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return apiBadRequest('Ungültiges Datum/Uhrzeit Format')
    }

    if (startDate >= endDate) {
      return apiBadRequest('Endzeit muss nach Startzeit liegen')
    }

    if (startDate < new Date()) {
      return apiBadRequest('Buchungen können nicht in der Vergangenheit liegen')
    }

    // Check location exists and is approved
    const [locationRow] = await db
      .select({
        id: locations.id,
        approvalStatus: locations.approvalStatus,
        maxCapacity: locations.maxCapacity,
      })
      .from(locations)
      .where(eq(locations.id, locationId))

    if (!locationRow) {
      return apiNotFound('Ort nicht gefunden')
    }

    if (locationRow.approvalStatus !== LOCATION_STATUS.APPROVED) {
      return apiForbidden('Ort ist nicht zur Buchung freigegeben')
    }

    // Check capacity if specified
    if (expected_attendees && locationRow.maxCapacity && expected_attendees > locationRow.maxCapacity) {
      return apiBadRequest(`Maximale Kapazität (${locationRow.maxCapacity}) würde überschritten`)
    }

    // Check for booking conflicts
    const startIso = startDate.toISOString()
    const endIso = endDate.toISOString()

    const conflicts = await db
      .select({
        id: locationBookings.id,
        title: locationBookings.title,
        startTime: locationBookings.startTime,
        endTime: locationBookings.endTime,
      })
      .from(locationBookings)
      .where(and(
        eq(locationBookings.locationId, locationId),
        sql`${locationBookings.status} IN (${BOOKING_STATUS.PENDING}, ${BOOKING_STATUS.CONFIRMED})`,
        or(
          and(lte(locationBookings.startTime, startIso), sql`${locationBookings.endTime} > ${startIso}`),
          and(sql`${locationBookings.startTime} < ${endIso}`, gte(locationBookings.endTime, endIso)),
          and(gte(locationBookings.startTime, startIso), lte(locationBookings.endTime, endIso))
        )
      ))

    if (conflicts.length > 0) {
      const conflict = conflicts[0]
      return apiBadRequest(
        `Zeitkonflikt mit bestehender Buchung: "${conflict.title}" (${conflict.startTime} - ${conflict.endTime})`
      )
    }

    // Create booking
    const [booking] = await db
      .insert(locationBookings)
      .values({
        locationId,
        bookedBy: session.user.id,
        eventType: event_type,
        eventId: event_id || null,
        title,
        description,
        startTime: startIso,
        endTime: endIso,
        expectedAttendees: expected_attendees || null,
        specialRequirements: special_requirements,
      })
      .returning()

    // Update location usage statistics
    await db
      .update(locations)
      .set({
        usageCount: sql`${locations.usageCount} + 1`,
        lastUsedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(locations.id, locationId))

    return apiSuccess({
      booking,
      message: 'Buchung erfolgreich erstellt'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
