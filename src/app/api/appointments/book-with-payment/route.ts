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

// POST /api/appointments/book-with-payment - Book service with immediate payment
export async function POST(request: NextRequest) {
  const stripe = requireStripeClient()

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiError(null, 'Authentication required', 401)
    }

    const {
      serviceSlug,
      description,
      urgency = 'normal',
      deviceInfo,
      preferredDate,
      preferredTimeSlots,
      useEscrow = true,
      autoReleaseDays = DEFAULT_AUTO_RELEASE_DAYS,
    } = await request.json()

    if (!serviceSlug) {
      return apiBadRequest('Service slug is required')
    }

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
      return apiNotFound('Service type not found')
    }

    const service = serviceResult.rows[0]

    if (!service.price_cents || service.price_cents <= 0) {
      return apiBadRequest('This service requires a price to be set for online booking')
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
      service.requires_approval ? 'requested' : 'confirmed',
      baseAmount,
      DEFAULT_CURRENCY,
      service.duration_minutes
    ])

    const appointmentId = appointmentResult.rows[0].id

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
      status: service.requires_approval ? 'pending_approval' : 'confirmed',
      message: service.requires_approval
        ? 'Appointment booked and payment authorized. Awaiting approval from our technicians.'
        : 'Appointment booked and payment processed successfully!'
    })

  } catch (error) {
    logger.error('Book with payment error', { error })
    return apiError(error, 'Failed to book service with payment')
  }
}
