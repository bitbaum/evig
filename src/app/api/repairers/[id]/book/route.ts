import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, serviceAppointments, serviceTypes, repairerAvailability, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { sendCustomEmail, appointmentNewBooking } from '@/lib/email'
import { rateLimiters } from '@/lib/security/rate-limit'
import { BOOKING_STATUS } from '@/config/booking-status'
import { APP_URL } from '@/config/urls'

// POST /api/repairers/[id]/book - Book an appointment with a specific repairer
export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    if (!rateLimiters.bookingCreate(session.user.id + ':booking')) {
      return apiError(new Error('Rate limit'), 'Zu viele Buchungsanfragen. Bitte versuche es später erneut.', 429)
    }

    const repairerId = context?.params?.id
    if (!repairerId) {
      return apiBadRequest('Repairer ID erforderlich')
    }
    const body = await request.json()

    const {
      service_category,
      description,
      device_info,
      preferred_date,
      preferred_time,
      urgency = 'normal',
      is_home_visit = false,
      visit_address,
      visit_postal_code,
      visit_city
    } = body

    // Validate required fields
    if (!service_category) {
      return apiBadRequest('Service-Kategorie erforderlich')
    }

    if (!description) {
      return apiBadRequest('Beschreibung des Problems erforderlich')
    }

    // Verify repairer exists and is active
    const repairerRows = await db
      .select({
        id: repairerProfiles.id,
        userId: repairerProfiles.userId,
        businessName: repairerProfiles.businessName,
        status: repairerProfiles.status,
        isActive: repairerProfiles.isActive,
      })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.id, repairerId))

    if (repairerRows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    const repairer = repairerRows[0]

    if (!repairer.isActive || repairer.status !== 'active') {
      return apiBadRequest('Dieser Reparateur nimmt derzeit keine Aufträge an')
    }

    // Prevent booking with yourself
    if (repairer.userId === session.user.id) {
      return apiBadRequest('Du kannst keinen Termin bei dir selbst buchen')
    }

    // Find or create service type based on category
    let serviceTypeRows = await db
      .select({
        id: serviceTypes.id,
        name: serviceTypes.name,
        slug: serviceTypes.slug,
        requiresApproval: serviceTypes.requiresApproval,
      })
      .from(serviceTypes)
      .where(and(
        eq(serviceTypes.slug, service_category),
        eq(serviceTypes.isActive, true)
      ))

    let serviceType: { id: string; name: string; slug: string; requiresApproval: boolean | null }

    if (serviceTypeRows.length === 0) {
      // Use a generic "repair" service type if specific category not found
      serviceTypeRows = await db
        .select({
          id: serviceTypes.id,
          name: serviceTypes.name,
          slug: serviceTypes.slug,
          requiresApproval: serviceTypes.requiresApproval,
        })
        .from(serviceTypes)
        .where(and(
          eq(serviceTypes.slug, 'general_repair'),
          eq(serviceTypes.isActive, true)
        ))
        .limit(1)

      if (serviceTypeRows.length === 0) {
        // Create a generic service type if none exists
        const [created] = await db
          .insert(serviceTypes)
          .values({
            name: 'Allgemeine Reparatur',
            slug: 'general_repair',
            description: 'Allgemeine Reparaturdienstleistungen',
            requiresApproval: true,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: serviceTypes.slug,
            set: { isActive: true },
          })
          .returning({
            id: serviceTypes.id,
            name: serviceTypes.name,
            slug: serviceTypes.slug,
            requiresApproval: serviceTypes.requiresApproval,
          })
        serviceType = created
      } else {
        serviceType = serviceTypeRows[0]
      }
    } else {
      serviceType = serviceTypeRows[0]
    }

    // Execute in transaction
    const result = await db.transaction(async (tx) => {
      // Create the appointment
      const [appointment] = await tx
        .insert(serviceAppointments)
        .values({
          userId: session.user.id,
          serviceTypeId: serviceType.id,
          repairerId: repairer.userId,
          repairerProfileId: repairer.id,
          description,
          deviceInfo: device_info || null,
          preferredDate: preferred_date ? new Date(preferred_date + (preferred_time ? 'T' + preferred_time : 'T09:00:00')).toISOString() : null,
          urgency,
          status: BOOKING_STATUS.REQUESTED,
          isHomeVisit: is_home_visit,
          visitAddress: is_home_visit ? visit_address : null,
          visitPostalCode: is_home_visit ? visit_postal_code : null,
          visitCity: is_home_visit ? visit_city : null,
        })
        .returning({
          id: serviceAppointments.id,
          createdAt: serviceAppointments.createdAt,
        })

      // If a specific time slot was selected, mark it as booked
      if (preferred_date && preferred_time) {
        await tx
          .update(repairerAvailability)
          .set({
            availabilityType: 'booked',
            bookingId: appointment.id,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(and(
            eq(repairerAvailability.repairerId, repairerId),
            eq(repairerAvailability.date, preferred_date),
            sql`${repairerAvailability.startTime} = ${preferred_time + ':00'}::time`,
            eq(repairerAvailability.availabilityType, 'available')
          ))
      }

      return appointment
    })

    // Fire-and-forget: notify repairer by email
    const repairerUserRows = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, repairer.userId))

    if (repairerUserRows.length > 0) {
      const repairerUser = repairerUserRows[0]
      const appointmentUrl = `${APP_URL}/dashboard/appointments`
      const emailContent = appointmentNewBooking(
        repairerUser.name || repairer.businessName || 'Reparateur',
        session.user.name || 'Kunde',
        serviceType.name,
        description,
        appointmentUrl
      )
      sendCustomEmail(repairerUser.email, emailContent).catch(err => {
        logger.warn('Failed to send new booking email to repairer', { error: err, appointmentId: result.id })
      })
    }

    logger.info('Appointment booked with repairer', {
      appointmentId: result.id,
      repairerId,
      customerId: session.user.id,
      serviceCategory: service_category
    })

    return apiSuccess({
      message: 'Deine Anfrage wurde erfolgreich gesendet. Der Reparateur wird sich in Kürze bei dir melden.',
      appointment: {
        id: result.id,
        created_at: result.createdAt,
        repairer_name: repairer.businessName,
        service_name: serviceType.name,
        status: BOOKING_STATUS.REQUESTED,
        preferred_date: preferred_date || null
      }
    })

  } catch (error) {
    logger.error('Error booking appointment with repairer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
