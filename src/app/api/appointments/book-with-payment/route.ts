import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { serviceTypes, serviceAppointments } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import {
  processPayment,
  buildInvoiceLineItem,
  centsToDisplay,
  DEFAULT_CURRENCY,
  DEFAULT_AUTO_RELEASE_DAYS
} from '@/lib/payments/payment-flow'
import { validateBody, BookWithPaymentSchema } from '@/lib/schemas'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'

// POST /api/appointments/book-with-payment - Book service with immediate payment
export async function POST(request: NextRequest) {
  const stripe = requireStripeClient()

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiError(null, 'Authentifizierung erforderlich', 401)
    }

    const body = await request.json()
    const validation = validateBody(BookWithPaymentSchema, body)
    if (!validation.success) return validation.error
    const {
      serviceSlug,
      description,
      urgency,
      deviceInfo,
      preferredDate,
      preferredTimeSlots,
      useEscrow,
      autoReleaseDays = DEFAULT_AUTO_RELEASE_DAYS,
    } = validation.data

    // Get service type details
    const [service] = await db
      .select({
        id: serviceTypes.id,
        name: serviceTypes.name,
        slug: serviceTypes.slug,
        priceCents: sql<number>`COALESCE(${serviceTypes.priceCents}, 0)`,
        durationMinutes: sql<number>`COALESCE(${serviceTypes.durationMinutes}, 60)`,
        requiresApproval: serviceTypes.requiresApproval,
      })
      .from(serviceTypes)
      .where(and(eq(serviceTypes.slug, serviceSlug), eq(serviceTypes.isActive, true)))

    if (!service) {
      return apiNotFound('Service-Typ nicht gefunden')
    }

    if (!service.priceCents || service.priceCents <= 0) {
      return apiBadRequest('Für diesen Service muss ein Preis für die Online-Buchung festgelegt sein')
    }

    const baseAmount = service.priceCents

    // Create service appointment
    const [createdAppointment] = await db
      .insert(serviceAppointments)
      .values({
        userId: session.user.id,
        serviceTypeId: service.id,
        description: description || undefined,
        deviceInfo: deviceInfo || undefined,
        urgency,
        preferredDate: preferredDate || undefined,
        status: service.requiresApproval ? APPOINTMENT_STATUS.REQUESTED : APPOINTMENT_STATUS.CONFIRMED,
        priceChargedCents: baseAmount,
      })
      .returning({ id: serviceAppointments.id, createdAt: serviceAppointments.createdAt })

    const appointmentId = createdAppointment.id

    // Process payment using shared utility
    const paymentResult = await processPayment({
      stripe,
      userId: session.user.id,
      baseAmountCents: baseAmount,
      useEscrow,
      autoReleaseDays,
      paymentDescription: `Service Booking: ${service.name} - ${urgency} priority`,
      paymentMetadata: {
        userId: session.user.id,
        serviceAppointmentId: appointmentId.toString(),
        useEscrow: useEscrow.toString(),
        autoReleaseDays: autoReleaseDays.toString(),
        appointmentType: 'service_booking'
      },
      serviceAppointmentId: appointmentId,
      invoiceLineItems: [
        buildInvoiceLineItem(
          `${service.name} - ${urgency} priority service`,
          baseAmount
        )
      ],
      invoiceNotes: `Service appointment booking - ${service.name}`,
      invoicePaymentTerms: 'Payment due upon service completion'
    })

    return apiSuccess({
      appointmentId,
      paymentIntentId: paymentResult.paymentIntentId,
      clientSecret: paymentResult.clientSecret,
      transactionId: paymentResult.transactionId,
      invoiceId: paymentResult.invoiceId,
      invoiceNumber: paymentResult.invoiceNumber,
      amount: centsToDisplay(paymentResult.totalAmountCents),
      currency: paymentResult.currency,
      escrowEnabled: useEscrow,
      status: service.requiresApproval ? APPOINTMENT_STATUS.PENDING_APPROVAL : APPOINTMENT_STATUS.CONFIRMED,
      message: service.requiresApproval
        ? 'Termin gebucht und Zahlung autorisiert. Wartet auf Genehmigung durch unsere Techniker.'
        : 'Termin gebucht und Zahlung erfolgreich verarbeitet!'
    })

  } catch (error) {
    logger.error('Book with payment error', { error })
    return apiError(error, 'Service-Buchung mit Zahlung fehlgeschlagen')
  }
}
