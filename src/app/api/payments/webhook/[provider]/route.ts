/**
 * POST /api/payments/webhook/[provider] — unified multi-rail webhook.
 *
 * One entry point for every NEW rail (Taler, BTCPay, …). Each provider's adapter
 * authenticates the delivery (`verifyWebhook`) and normalizes it (`parseWebhook`)
 * into { referenceId, providerTxId, status, amountClaim }; from there the SAME
 * hardened reconciliation engine that serves Payrexx handles the state machine
 * (amount verification, atomic listing restore, Kivvi sync).
 *
 * NOTE: the incumbent Payrexx webhook keeps its dedicated route
 * (`/api/payments/payrexx-webhook`) because that URL is configured in the Payrexx
 * dashboard. This route additionally accepts `payrexx` for uniformity.
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized, apiNotFound } from '@/lib/api/helpers'
import {
  lookupPaymentByReferenceId,
  handleMarketplacePayment,
  handleGenericPayment,
} from '@/lib/services/payment-webhook'
import { getGateway, hasGateway } from '@/lib/payments/gateways'

export async function POST(request: NextRequest) {
  try {
    const providerSlug = request.nextUrl.pathname.split('/')[4] || ''
    if (!hasGateway(providerSlug)) {
      logger.warn('Unified webhook: unknown provider', { providerSlug })
      return apiNotFound('Payment provider')
    }
    const gateway = getGateway(providerSlug)

    const rawBody = await request.text()

    if (!(await gateway.verifyWebhook(rawBody, request.headers))) {
      logger.warn('Webhook: invalid signature', { providerSlug })
      return apiUnauthorized('Invalid signature')
    }

    const parsed = await gateway.parseWebhook(rawBody)
    if (!parsed.referenceId || !parsed.status) {
      logger.warn('Webhook: missing referenceId or status', {
        providerSlug,
        status: parsed.status,
        hasReferenceId: !!parsed.referenceId,
      })
      return apiBadRequest('Missing referenceId or status')
    }

    logger.info('Webhook received', {
      providerSlug,
      referenceId: parsed.referenceId,
      providerTxId: parsed.providerTxId,
      status: parsed.status,
    })

    const lookup = await lookupPaymentByReferenceId(parsed.referenceId)

    if (lookup.type === 'marketplace' && lookup.order) {
      await handleMarketplacePayment(lookup.order, parsed.status, parsed.providerTxId, parsed.amountClaim, providerSlug)
      return apiSuccess({ received: true })
    }

    if (lookup.type === 'payment_transaction' && lookup.paymentTx) {
      await handleGenericPayment(lookup.paymentTx, parsed.status, parsed.providerTxId, parsed.amountClaim, providerSlug)
      return apiSuccess({ received: true })
    }

    logger.warn('Webhook: no matching payment record', { providerSlug, referenceId: parsed.referenceId })
    return apiNotFound('No matching payment record')
  } catch (error) {
    return apiError(error, 'Internal error')
  }
}
