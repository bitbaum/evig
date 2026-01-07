import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { isAdminRole } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { getStripeClient } from '@/lib/payments/stripe-client'

// POST /api/appointments/[id]/pay - Pay for existing appointment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    const appointmentId = request.nextUrl.pathname.split('/')[3] // Extract ID from URL
    const {
      useEscrow = true,
      autoReleaseDays = 7,
      paymentType = 'full', // 'full', 'deposit', 'remaining'
      customAmount // For custom payment amounts
    } = await request.json()

    // Get appointment details
    const appointmentResult = await query(`
      SELECT
        sa.*,
        st.name as service_name,
        st.slug as service_slug,
        st.price_cents as service_price_cents,
        st.requires_approval,
        u.name as customer_name,
        u.email as customer_email
      FROM service_appointments sa
      JOIN service_types st ON sa.service_type_id = st.id
      JOIN users u ON sa.user_id = u.id
      WHERE sa.id = $1
    `, [appointmentId])

    if (appointmentResult.rows.length === 0) {
      return apiNotFound('Appointment not found')
    }

    const appointment = appointmentResult.rows[0]

    // Check ownership
    if (appointment.user_id !== session.user.id) {
      const userRoleResult = await query('SELECT role FROM users WHERE id = $1', [session.user.id])
      if (!isAdminRole(userRoleResult.rows[0]?.role)) {
        return apiUnauthorized('You can only pay for your own appointments')
      }
    }

    // Check if appointment is in payable status
    if (!['confirmed', 'approved', 'in_progress'].includes(appointment.status)) {
      return apiBadRequest(`Appointment status '${appointment.status}' is not payable`)
    }

    // Determine payment amount
    let paymentAmountCents = appointment.price_charged_cents || appointment.service_price_cents || 0

    if (paymentType === 'deposit') {
      // 30% deposit
      paymentAmountCents = Math.round(paymentAmountCents * 0.3)
    } else if (paymentType === 'remaining') {
      // Calculate remaining balance
      const paidResult = await query(`
        SELECT COALESCE(SUM(amount_cents), 0) as total_paid
        FROM payment_transactions
        WHERE service_appointment_id = $1 AND status = 'succeeded' AND type = 'payment'
      `, [appointmentId])

      const totalPaid = paidResult.rows[0].total_paid
      const remaining = paymentAmountCents - totalPaid

      if (remaining <= 0) {
        return apiBadRequest('Appointment is already fully paid')
      }

      paymentAmountCents = remaining
    } else if (customAmount) {
      paymentAmountCents = Math.round(parseFloat(customAmount) * 100)
    }

    if (paymentAmountCents <= 0) {
      return apiBadRequest('Invalid payment amount')
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

    // Calculate fees
    const feeCents = Math.round(paymentAmountCents * (provider.fee_percentage / 100)) + provider.fee_fixed_cents
    const totalAmount = paymentAmountCents + feeCents

    // Create payment intent
    const stripe = getStripeClient()
    if (!stripe) {
      return apiError('Stripe is not configured', 500)
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'chf',
      metadata: {
        userId: session.user.id,
        serviceAppointmentId: appointmentId,
        useEscrow: useEscrow.toString(),
        autoReleaseDays: autoReleaseDays.toString(),
        paymentType,
        appointmentType: 'service_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: useEscrow ? 'manual' : 'automatic',
      description: `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment for ${appointment.service_name}`,
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
        escrow_release_date,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        CASE WHEN $12 THEN CURRENT_TIMESTAMP + INTERVAL '1 day' * $13 ELSE NULL END,
        $14
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
      paymentAmountCents,
      appointmentId,
      `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment: ${appointment.service_name}`,
      useEscrow,
      autoReleaseDays,
      JSON.stringify({ paymentType, originalAppointmentStatus: appointment.status })
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

    // Update appointment status if this completes the payment
    if (paymentType === 'full' || paymentType === 'remaining') {
      await query(`
        UPDATE service_appointments
        SET
          status = CASE
            WHEN status = 'confirmed' THEN 'paid'
            WHEN status = 'approved' THEN 'paid'
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [appointmentId])
    }

    return apiSuccess({
      appointmentId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      transactionId,
      amount: totalAmount / 100,
      currency: 'CHF',
      paymentType,
      escrowEnabled: useEscrow,
      message: useEscrow
        ? `Payment authorized. Funds will be held in escrow until service completion.`
        : `Payment processed successfully!`
    })

  } catch (error) {
    logger.error('Pay for appointment error', { error })
    return apiError(error, 'Failed to process payment for appointment')
  }
}