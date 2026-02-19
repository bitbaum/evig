import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { TABLE_NAMES } from '@/config/database'
import {
  processPayment,
  buildInvoiceLineItem,
  centsToDisplay,
  DEFAULT_CURRENCY,
  DEFAULT_AUTO_RELEASE_DAYS
} from '@/lib/payments/payment-flow'
import { validateBody, BookWithPaymentSchema } from '@/lib/schemas'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'

interface ServiceRow {
  id: string
  name: string
  slug: string
  price_cents: number
  duration_minutes: number
  requires_approval: boolean
}

interface AppointmentIdRow {
  id: string
  created_at: string
}

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
    const serviceResult = await query(`
      SELECT
        st.*,
        COALESCE(st.price_cents, 0) as price_cents,
        COALESCE(st.duration_minutes, 60) as duration_minutes
      FROM ${TABLE_NAMES.SERVICE_TYPES} st
      WHERE st.slug = $1 AND st.is_active = true
    `, [serviceSlug])

    if (serviceResult.rows.length === 0) {
      return apiNotFound('Service-Typ nicht gefunden')
    }

    const service = serviceResult.rows[0] as ServiceRow

    if (!service.price_cents || service.price_cents <= 0) {
      return apiBadRequest('Für diesen Service muss ein Preis für die Online-Buchung festgelegt sein')
    }

    const baseAmount = service.price_cents

    // Create service appointment
    const appointmentResult = await query(`
      INSERT INTO ${TABLE_NAMES.SERVICE_APPOINTMENTS} (
        user_id,
        service_type_id,
        description,
        device_info,
        urgency,
        preferred_date,
        preferred_time_slots,
        status,
        price_charged_cents,
        currency,
        estimated_duration_minutes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING id, created_at
    `, [
      session.user.id,
      service.id,
      description || null,
      deviceInfo || null,
      urgency,
      preferredDate || null,
      preferredTimeSlots ? JSON.stringify(preferredTimeSlots) : null,
      service.requires_approval ? APPOINTMENT_STATUS.REQUESTED : APPOINTMENT_STATUS.CONFIRMED,
      baseAmount,
      DEFAULT_CURRENCY,
      service.duration_minutes
    ])

    const appointmentRow = appointmentResult.rows[0] as AppointmentIdRow
    const appointmentId = appointmentRow.id

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
      status: service.requires_approval ? APPOINTMENT_STATUS.PENDING_APPROVAL : APPOINTMENT_STATUS.CONFIRMED,
      message: service.requires_approval
        ? 'Termin gebucht und Zahlung autorisiert. Wartet auf Genehmigung durch unsere Techniker.'
        : 'Termin gebucht und Zahlung erfolgreich verarbeitet!'
    })

  } catch (error) {
    logger.error('Book with payment error', { error })
    return apiError(error, 'Service-Buchung mit Zahlung fehlgeschlagen')
  }
}
