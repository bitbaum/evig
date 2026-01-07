import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { requireStripeClient } from '@/lib/payments/stripe-client'

// POST /api/appointments/book-with-payment - Book service with immediate payment
export async function POST(request: NextRequest) {
  // Initialize Stripe lazily inside handler to avoid build-time errors
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
      autoReleaseDays = 7,
      paymentMethod = 'card'
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
      FROM service_types st
      WHERE st.slug = $1 AND st.is_active = true
    `, [serviceSlug])

    if (serviceResult.rows.length === 0) {
      return apiNotFound('Service type not found')
    }

    const service = serviceResult.rows[0]

    if (!service.price_cents || service.price_cents <= 0) {
      return apiBadRequest('This service requires a price to be set for online booking')
    }

    // Get payment provider
    const providerResult = await query(
      'SELECT id, fee_percentage, fee_fixed_cents FROM payment_providers WHERE slug = $1 AND is_active = true',
      ['stripe']
    )

    if (providerResult.rows.length === 0) {
      return apiError(null, 'Payment provider not available', 500)
    }

    const provider = providerResult.rows[0]

    // Calculate fees and final amount
    const baseAmount = service.price_cents
    const feeCents = Math.round(baseAmount * (provider.fee_percentage / 100)) + provider.fee_fixed_cents
    const totalAmount = baseAmount + feeCents

    // Create service appointment
    const appointmentResult = await query(`
      INSERT INTO service_appointments (
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
      'CHF',
      service.duration_minutes
    ])

    const appointmentId = appointmentResult.rows[0].id

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'chf',
      metadata: {
        userId: session.user.id,
        serviceAppointmentId: appointmentId.toString(),
        useEscrow: useEscrow.toString(),
        autoReleaseDays: autoReleaseDays.toString(),
        appointmentType: 'service_booking'
      },
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: useEscrow ? 'manual' : 'automatic',
      description: `Service Booking: ${service.name} - ${urgency} priority`,
    })

    // Create payment transaction record
    const transactionResult = await query(`
      INSERT INTO payment_transactions (
        user_id,
        provider_id,
        provider_transaction_id,
        type,
        status,
        amount_cents,
        currency,
        fee_cents,
        net_amount_cents,
        service_appointment_id,
        description,
        escrow_release_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        CASE WHEN $12 THEN CURRENT_TIMESTAMP + INTERVAL '1 day' * $13 ELSE NULL END
      )
      RETURNING id
    `, [
      session.user.id,
      provider.id,
      paymentIntent.id,
      'payment',
      'pending',
      totalAmount,
      'CHF',
      feeCents,
      baseAmount,
      appointmentId,
      `Service booking: ${service.name}`,
      useEscrow,
      autoReleaseDays
    ])

    const transactionId = transactionResult.rows[0].id

    // Create escrow account if enabled
    if (useEscrow) {
      await query(`
        INSERT INTO escrow_accounts (
          transaction_id,
          total_amount_cents,
          currency,
          auto_release_days,
          release_deadline,
          buyer_id,
          status
        ) VALUES (
          $1, $2, $3, $4,
          CURRENT_TIMESTAMP + INTERVAL '1 day' * $4,
          $5, 'active'
        )
      `, [
        transactionId,
        totalAmount,
        'CHF',
        autoReleaseDays,
        session.user.id
      ])
    }

    // Create invoice for the service
    const invoiceResult = await query(`
      INSERT INTO invoices (
        invoice_number,
        type,
        status,
        user_id,
        service_appointment_id,
        subtotal_cents,
        tax_cents,
        total_cents,
        currency,
        tax_rate,
        line_items,
        issue_date,
        notes,
        payment_terms
      ) VALUES (
        generate_invoice_number(),
        'service',
        'draft',
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, $10
      )
      RETURNING id, invoice_number
    `, [
      session.user.id,
      appointmentId,
      baseAmount,
      Math.round(baseAmount * 0.077), // 7.7% Swiss VAT
      totalAmount,
      'CHF',
      0.077,
      JSON.stringify([{
        description: `${service.name} - ${urgency} priority service`,
        quantity: 1,
        unitPrice: (baseAmount / 100).toFixed(2),
        total: (baseAmount / 100).toFixed(2)
      }]),
      `Service appointment booking - ${service.name}`,
      'Payment due upon service completion'
    ])

    return apiSuccess({
      appointmentId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      transactionId,
      invoiceId: invoiceResult.rows[0].id,
      invoiceNumber: invoiceResult.rows[0].invoice_number,
      amount: totalAmount / 100,
      currency: 'CHF',
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