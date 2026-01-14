import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { TABLE_NAMES } from '@/config/database'
import {
  processPayment,
  buildInvoiceLineItem,
  centsToDisplay
} from '@/lib/payments/payment-flow'

interface WorkshopRow {
  id: string
  title: string
  price_cents: number
  slug: string
  is_active: boolean
}

interface InstanceRow {
  id: string
  title: string
  workshop_price: number
  current_participants: number
  max_participants: number
  status: string
}

interface RegistrationRow {
  id: string
  status: string
}

// POST /api/workshops/[slug]/register-with-payment - Register for workshop with payment
export async function POST(request: NextRequest) {
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
    } = await request.json()

    // Get workshop details
    const workshopResult = await query(`
      SELECT
        w.*,
        COALESCE(w.price_cents, 0) as price_cents
      FROM ${TABLE_NAMES.WORKSHOPS} w
      WHERE w.slug = $1 AND w.is_active = true
    `, [workshopSlug])

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop not found')
    }

    const workshop = workshopResult.rows[0] as WorkshopRow

    if (!workshop.price_cents || workshop.price_cents <= 0) {
      return apiBadRequest('This workshop is not available for online registration with payment')
    }

    // Get workshop instance if specified, otherwise use general workshop
    let instanceDetails: InstanceRow | null = null
    let registrationTarget: string = workshop.id
    let registrationType = 'workshop'

    if (instanceId) {
      const instanceResult = await query(`
        SELECT
          wi.*,
          w.title,
          w.price_cents as workshop_price
        FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
        JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
        WHERE wi.id = $1 AND wi.status = 'scheduled'
      `, [instanceId])

      if (instanceResult.rows.length === 0) {
        return apiNotFound('Workshop instance not found or not available')
      }

      instanceDetails = instanceResult.rows[0] as InstanceRow
      registrationTarget = instanceId
      registrationType = 'instance'

      // Check capacity
      if (instanceDetails.current_participants >= instanceDetails.max_participants) {
        return apiBadRequest('Workshop instance is fully booked')
      }
    }

    // Check if user is already registered
    const existingRegistration = await query(`
      SELECT id, status FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
      WHERE user_id = $1 AND workshop_instance_id = $2
    `, [session.user.id, registrationTarget])

    if (existingRegistration.rows.length > 0) {
      const reg = existingRegistration.rows[0] as RegistrationRow
      if (reg.status === 'confirmed' || reg.status === 'attended') {
        return apiBadRequest('You are already registered for this workshop')
      }
    }

    const baseAmount = workshop.price_cents

    // Create workshop registration
    const registrationResult = await query(`
      INSERT INTO ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} (
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

    const createdReg = registrationResult.rows[0] as { id: string; created_at: string }
    const registrationId = createdReg.id

    // Update instance participant count if registering for specific instance
    if (instanceId) {
      await query(`
        UPDATE ${TABLE_NAMES.WORKSHOP_INSTANCES}
        SET current_participants = current_participants + 1
        WHERE id = $1
      `, [instanceId])
    }

    // Process payment using shared utility
    // Note: Workshops use 1-day escrow if enabled (rare case)
    const autoReleaseDays = 1
    const paymentResult = await processPayment({
      stripe,
      userId: session.user.id,
      baseAmountCents: baseAmount,
      useEscrow,
      autoReleaseDays,
      paymentDescription: `Workshop Registration: ${workshop.title}`,
      paymentMetadata: {
        userId: session.user.id,
        workshopRegistrationId: registrationId.toString(),
        workshopSlug,
        instanceId: instanceId || '',
        useEscrow: useEscrow.toString(),
        registrationType
      },
      workshopRegistrationId: registrationId,
      invoiceLineItems: [
        buildInvoiceLineItem(
          `Workshop: ${workshop.title}`,
          baseAmount
        )
      ],
      invoiceNotes: `Workshop registration - ${workshop.title}`,
      invoicePaymentTerms: 'Payment due before workshop date'
    })

    return apiSuccess({
      registrationId,
      paymentIntentId: paymentResult.paymentIntentId,
      clientSecret: paymentResult.clientSecret,
      transactionId: paymentResult.transactionId,
      invoiceId: paymentResult.invoiceId,
      invoiceNumber: paymentResult.invoiceNumber,
      amount: centsToDisplay(paymentResult.totalAmountCents),
      currency: paymentResult.currency,
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
