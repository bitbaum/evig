import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { paymentProviders, paymentTransactions, escrowAccounts } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
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
    const providerRows = await db
      .select({
        id: paymentProviders.id,
        feePercentage: paymentProviders.feePercentage,
        feeFixedCents: paymentProviders.feeFixedCents,
        supportedCurrencies: paymentProviders.supportedCurrencies,
        config: paymentProviders.config,
      })
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.slug, 'stripe'),
          eq(paymentProviders.isActive, true),
          sql`${currency} = ANY(${paymentProviders.supportedCurrencies})`
        )
      )

    if (providerRows.length === 0) {
      return apiError(null, `Payment provider unterstützt ${currency} nicht`, 400)
    }

    const provider = providerRows[0]

    // Calculate VAT and pricing
    const vatRate = getVATRate(currency as SupportedCurrency, businessType)
    const { subtotal, vat, total } = calculateVAT(amount, currency as SupportedCurrency, includeVAT)

    // Calculate payment provider fees on the final amount
    const { fee: providerFee, total: finalTotal } = calculatePaymentFees(total, {
      fee_percentage: Number(provider.feePercentage) || 0,
      fee_fixed_cents: provider.feeFixedCents || 0,
    })

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
    const transactionId = await db.transaction(async (tx) => {
      const [txRow] = await tx
        .insert(paymentTransactions)
        .values({
          userId: session.user.id,
          providerId: provider.id,
          providerTransactionId: paymentIntent.id,
          type: 'payment',
          status: PAYMENT_STATUS.PENDING,
          amountCents: totalCents,
          currency,
          feeCents: providerFeeCents,
          netAmountCents: subtotalCents,
          orderId: orderId || null,
          serviceAppointmentId: serviceAppointmentId || null,
          workshopRegistrationId: workshopRegistrationId || null,
          description: description || `Payment for ${orderId || serviceAppointmentId || workshopRegistrationId || 'service'}`,
          escrowReleaseDate: escrowEnabled
            ? sql`CURRENT_TIMESTAMP + INTERVAL '1 day' * ${autoReleaseDays}`
            : null,
          metadata: {
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
          },
          providerResponse: paymentIntent as unknown as Record<string, unknown>,
        })
        .returning({ id: paymentTransactions.id })

      const txId = txRow.id

      // Create escrow account if enabled
      if (escrowEnabled) {
        await tx
          .insert(escrowAccounts)
          .values({
            transactionId: txId,
            totalAmountCents: totalCents,
            currency,
            autoReleaseDays,
            releaseDeadline: sql`CURRENT_TIMESTAMP + INTERVAL '1 day' * ${autoReleaseDays}`,
            buyerId: session.user.id,
            sellerId: sql`
              CASE
                WHEN ${serviceAppointmentId ?? null}::uuid IS NOT NULL THEN (SELECT repairer_id FROM service_appointments WHERE id = ${serviceAppointmentId ?? null}::uuid)
                WHEN ${workshopRegistrationId ?? null}::uuid IS NOT NULL THEN (SELECT wi.instructor_id FROM workshop_registrations wr JOIN workshop_instances wi ON wr.workshop_instance_id = wi.id WHERE wr.id = ${workshopRegistrationId ?? null}::uuid)
                ELSE NULL
              END
            `,
          })
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
