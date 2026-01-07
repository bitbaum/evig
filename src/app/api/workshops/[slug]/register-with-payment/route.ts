import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { requireStripeClient } from '@/lib/payments/stripe-client'

// POST /api/workshops/[slug]/register-with-payment - Register for workshop with payment
export async function POST(request: NextRequest) {
  // Initialize Stripe lazily inside handler to avoid build-time errors
  const stripe = requireStripeClient()

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    const workshopSlug = request.nextUrl.pathname.split('/')[3] // Extract slug from URL
    const {
      instanceId, // Specific workshop instance
      useEscrow = false, // Workshops typically don't need escrow
      paymentType = 'full'
    } = await request.json()

    // Get workshop details
    const workshopResult = await query(`
      SELECT
        w.*,
        COALESCE(w.price_cents, 0) as price_cents
      FROM workshops w
      WHERE w.slug = $1 AND w.is_active = true
    `, [workshopSlug])

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop not found')
    }

    const workshop = workshopResult.rows[0]

    if (!workshop.price_cents || workshop.price_cents <= 0) {
      return apiBadRequest('This workshop is not available for online registration with payment')
    }

    // Get workshop instance if specified, otherwise use general workshop
    let instanceDetails = null
    let registrationTarget = workshop.id
    let registrationType = 'workshop'

    if (instanceId) {
      const instanceResult = await query(`
        SELECT
          wi.*,
          w.title,
          w.price_cents as workshop_price
        FROM workshop_instances wi
        JOIN workshops w ON wi.workshop_id = w.id
        WHERE wi.id = $1 AND wi.status = 'scheduled'
      `, [instanceId])

      if (instanceResult.rows.length === 0) {
        return apiNotFound('Workshop instance not found or not available')
      }

      instanceDetails = instanceResult.rows[0]
      registrationTarget = instanceId
      registrationType = 'instance'

      // Check capacity
      if (instanceDetails.current_participants >= instanceDetails.max_participants) {
        return apiBadRequest('Workshop instance is fully booked')
      }
    }

    // Check if user is already registered
    const existingRegistration = await query(`
      SELECT id, status FROM workshop_registrations
      WHERE user_id = $1 AND workshop_instance_id = $2
    `, [session.user.id, registrationTarget])

    if (existingRegistration.rows.length > 0) {
      const reg = existingRegistration.rows[0]
      if (reg.status === 'confirmed' || reg.status === 'attended') {
        return apiBadRequest('You are already registered for this workshop')
      }
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

    // Calculate payment amount
    const baseAmount = workshop.price_cents
    const feeCents = Math.round(baseAmount * (provider.fee_percentage / 100)) + provider.fee_fixed_cents
    const totalAmount = baseAmount + feeCents

    // Create workshop registration
    const registrationResult = await query(`
      INSERT INTO workshop_registrations (
        user_id,
        workshop_instance_id,
        status,
        payment_status,
        payment_amount_cents
      ) VALUES (
        $1, $2, 'pending', 'pending', $3
      )
      RETURNING id, created_at
    `, [
      session.user.id,
      registrationTarget,
      baseAmount
    ])

    const registrationId = registrationResult.rows[0].id

    // Update instance participant count if registering for specific instance
    if (instanceId) {
      await query(`
        UPDATE workshop_instances
        SET current_participants = current_participants + 1
        WHERE id = $1
      `, [instanceId])
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'chf',
      metadata: {
        userId: session.user.id,
        workshopRegistrationId: registrationId.toString(),
        workshopSlug,
        instanceId: instanceId || null,
        useEscrow: useEscrow.toString(),
        registrationType
      },
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: useEscrow ? 'manual' : 'automatic',
      description: `Workshop Registration: ${workshop.title}`
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
        workshop_registration_id,
        description,
        escrow_release_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        CASE WHEN $12 THEN CURRENT_TIMESTAMP + INTERVAL '1 day' * 1 ELSE NULL END
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
      registrationId,
      `Workshop registration: ${workshop.title}`,
      useEscrow
    ])

    const transactionId = transactionResult.rows[0].id

    // Create escrow account if enabled (rare for workshops)
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
          $1, $2, $3, 1,
          CURRENT_TIMESTAMP + INTERVAL '1 day',
          $4, 'active'
        )
      `, [
        transactionId,
        totalAmount,
        'CHF',
        session.user.id
      ])
    }

    // Create invoice for the workshop registration
    const invoiceResult = await query(`
      INSERT INTO invoices (
        invoice_number,
        type,
        status,
        user_id,
        workshop_registration_id,
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
      registrationId,
      baseAmount,
      Math.round(baseAmount * 0.077), // 7.7% Swiss VAT
      totalAmount,
      'CHF',
      0.077,
      JSON.stringify([{
        description: `Workshop: ${workshop.title}`,
        quantity: 1,
        unitPrice: (baseAmount / 100).toFixed(2),
        total: (baseAmount / 100).toFixed(2)
      }]),
      `Workshop registration - ${workshop.title}`,
      'Payment due before workshop date'
    ])

    return apiSuccess({
      registrationId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      transactionId,
      invoiceId: invoiceResult.rows[0].id,
      invoiceNumber: invoiceResult.rows[0].invoice_number,
      amount: totalAmount / 100,
      currency: 'CHF',
      workshopTitle: workshop.title,
      registrationType,
      escrowEnabled: useEscrow,
      message: 'Workshop registration created. Complete payment to confirm your spot.'
    })
  } catch (error) {
    logger.error('Workshop registration with payment error', { error })
    return apiError(error, 'Failed to register for workshop with payment')
  }
}