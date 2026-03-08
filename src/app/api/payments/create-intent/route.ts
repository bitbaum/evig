import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { logger } from '@/lib/logger'
import {
  SupportedCurrency,
  calculatePaymentFees,
  decimalToCents,
  getVATRate,
  calculateVAT
} from '@/lib/payments/currency'
import { withSecurePayment } from '@/lib/middleware/pci-compliance'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { validateBody, CreatePaymentIntentSchema } from '@/lib/schemas'

interface ProviderRow {
  id: string
  fee_percentage: number
  fee_fixed_cents: number
  supported_currencies: string[]
  config: Record<string, unknown>
}

interface IdRow {
  id: string
}

export const POST = withSecurePayment(async (request: NextRequest) => {
  // Initialize Stripe lazily inside handler to avoid build-time errors
  const stripe = requireStripeClient()

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    const validation = validateBody(CreatePaymentIntentSchema, body)
    if (!validation.success) return validation.error
    const {
      amount,
      currency,
      orderId,
      serviceAppointmentId,
      workshopRegistrationId,
      description,
      escrowEnabled,
      autoReleaseDays,
      includeVAT,
      businessType
    } = validation.data

    // Get payment provider with currency support
    const providerResult = await query(`
      SELECT id, fee_percentage, fee_fixed_cents, supported_currencies, config
      FROM ${TABLE_NAMES.PAYMENT_PROVIDERS}
      WHERE slug = $1 AND is_active = true AND $2 = ANY(supported_currencies)
    `, ['stripe', currency])

    if (providerResult.rows.length === 0) {
      return apiError(null, `Payment provider unterstützt ${currency} nicht`, 400)
    }

    const provider = providerResult.rows[0] as ProviderRow

    // Calculate VAT and pricing
    const vatRate = getVATRate(currency as SupportedCurrency, businessType)
    const { subtotal, vat, total } = calculateVAT(amount, currency as SupportedCurrency, includeVAT)

    // Calculate payment provider fees on the final amount
    const { fee: providerFee, total: finalTotal } = calculatePaymentFees(total, provider)

    // Convert to cents for Stripe
    const subtotalCents = decimalToCents(subtotal)
    const vatCents = decimalToCents(vat)
    const totalCents = decimalToCents(finalTotal)
    const providerFeeCents = decimalToCents(providerFee)

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: currency.toLowerCase(),
      metadata: {
        userId: session.user.id,
        orderId: orderId || null,
        serviceAppointmentId: serviceAppointmentId || null,
        workshopRegistrationId: workshopRegistrationId || null,
        escrowEnabled: escrowEnabled.toString(),
        autoReleaseDays: autoReleaseDays.toString(),
        includeVAT: includeVAT.toString(),
        businessType,
        subtotalCents: subtotalCents.toString(),
        vatCents: vatCents.toString(),
        vatRate: vatRate.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // For escrow payments, don't capture automatically
      capture_method: escrowEnabled ? 'manual' : 'automatic',
      description: description || `RevampIT Payment - ${currency} ${finalTotal.toFixed(2)}`,
    })

    // Wrap DB writes in transaction (payment record + optional escrow)
    const transactionId = await transaction(async (client) => {
      const transactionResult = await client.query(`
        INSERT INTO ${TABLE_NAMES.PAYMENT_TRANSACTIONS} (
          user_id,
          provider_id,
          provider_transaction_id,
          type,
          status,
          amount_cents,
          currency,
          fee_cents,
          net_amount_cents,
          order_id,
          service_appointment_id,
          workshop_registration_id,
          description,
          escrow_release_date,
          metadata,
          provider_response
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          CASE WHEN $14 THEN CURRENT_TIMESTAMP + INTERVAL '1 day' * $15 ELSE NULL END,
          $16, $17
        )
        RETURNING id
      `, [
        session.user.id,
        provider.id,
        paymentIntent.id,
        'payment',
        PAYMENT_STATUS.PENDING,
        totalCents,
        currency,
        providerFeeCents,
        subtotalCents,
        orderId || null,
        serviceAppointmentId || null,
        workshopRegistrationId || null,
        description || `Payment for ${orderId || serviceAppointmentId || workshopRegistrationId || 'service'}`,
        escrowEnabled,
        autoReleaseDays,
        JSON.stringify({
          includeVAT,
          businessType,
          subtotalCents,
          vatCents,
          vatRate,
          providerFeeCents,
          breakdown: {
            subtotal: subtotal.toFixed(2),
            vat: vat.toFixed(2),
            providerFee: providerFee.toFixed(2),
            total: finalTotal.toFixed(2)
          }
        }),
        JSON.stringify(paymentIntent)
      ])

      const txId = (transactionResult.rows[0] as IdRow).id

      // Create escrow account if enabled
      if (escrowEnabled) {
        await client.query(`
          INSERT INTO ${TABLE_NAMES.ESCROW_ACCOUNTS} (
            transaction_id,
            total_amount_cents,
            currency,
            auto_release_days,
            release_deadline,
            buyer_id,
            seller_id
          ) VALUES (
            $1, $2, $3, $4,
            CURRENT_TIMESTAMP + INTERVAL '1 day' * $4,
            $5,
            CASE
              WHEN $6 IS NOT NULL THEN (SELECT technician_id FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} WHERE id = $6)
              WHEN $7 IS NOT NULL THEN (SELECT instructor_id FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id WHERE wr.id = $7)
              ELSE NULL
            END
          )
        `, [
          txId,
          totalCents,
          currency,
          autoReleaseDays,
          session.user.id,
          serviceAppointmentId,
          workshopRegistrationId
        ])
      }

      return txId
    })

    return apiSuccess({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId,
      escrowEnabled,
      pricing: {
        currency,
        subtotal: subtotal.toFixed(2),
        vat: vat.toFixed(2),
        vatRate: (vatRate * 100).toFixed(1) + '%',
        providerFee: providerFee.toFixed(2),
        total: finalTotal.toFixed(2)
      }
    })

    } catch (error) {
    logger.error('Payment intent creation error', { error })
    const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen der Zahlung'
    return apiError(error, errorMessage)
  }
})