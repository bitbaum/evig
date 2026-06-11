/**
 * POST /api/payments/payrexx-webhook — Handles Payrexx webhook callbacks.
 *
 * Payrexx sends transaction status updates here. We use the referenceId
 * to look up the matching record — first in marketplace orders, then in
 * payment transactions (workshops, appointments).
 *
 * Key statuses:
 *   reserved  → payment held (marketplace order paid / generic payment succeeded)
 *   confirmed → payment captured (order completed)
 *   cancelled → reservation released
 *   declined  → payment failed
 *   refunded / partially-refunded → refund processed
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized, apiNotFound } from '@/lib/api/helpers';
import {
  lookupPaymentByReferenceId,
  handleMarketplacePayment,
  handleGenericPayment,
} from '@/lib/services/payment-webhook';

const PAYREXX_WEBHOOK_SECRET = process.env.PAYREXX_WEBHOOK_SECRET;

/**
 * Verify Payrexx webhook signature using HMAC-SHA256.
 * In dev mock mode (no PAYREXX_INSTANCE), allow unsigned webhooks.
 */
async function verifyPayrexxSignature(rawBody: string, signature: string | null): Promise<boolean> {
  // Dev mock mode: only skip in local development when Payrexx is explicitly not configured
  if (process.env.NODE_ENV === 'development' && !process.env.PAYREXX_INSTANCE) {
    logger.warn('Payrexx webhook: dev mode — skipping signature verification (no PAYREXX_INSTANCE set)');
    return true;
  }

  if (!PAYREXX_WEBHOOK_SECRET) {
    logger.error('PAYREXX_WEBHOOK_SECRET not set — rejecting webhook (fail closed)');
    return false;
  }
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PAYREXX_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison
  if (computed.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

interface WebhookTransaction {
  id?: number;
  status?: string;
  referenceId?: string;
  amount?: number;
  currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('payrexx-signature');

    if (!await verifyPayrexxSignature(rawBody, signature)) {
      // Log presence/length only — never the raw signature bytes
      // (defense-in-depth: rejected payloads can include attacker-supplied data).
      logger.warn('Payrexx webhook: invalid signature', { signaturePresent: signature !== null });
      return apiUnauthorized('Invalid signature');
    }

    const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    if (!body) {
      return apiBadRequest('Invalid body');
    }

    // Payrexx webhook sends transaction data in `transaction` field
    const tx: WebhookTransaction = body.transaction || body;
    const referenceId = tx.referenceId || body.referenceId;
    const transactionId = tx.id ? String(tx.id) : null;
    const status = tx.status || body.status;

    if (!referenceId || !status) {
      // Log known fields only — rawBody can include partial transaction data.
      logger.warn('Payrexx webhook: missing referenceId or status', { status, hasReferenceId: !!referenceId });
      return apiBadRequest('Missing referenceId or status');
    }

    // Amount + currency claim from Payrexx — used by handlers to verify the
    // webhook matches the expected order/transaction value. A valid HMAC
    // alone is not enough; a replay from a smaller transaction would still
    // be signature-valid.
    const amountClaim = {
      amount: typeof tx.amount === 'number' ? tx.amount : null,
      currency: typeof tx.currency === 'string' ? tx.currency : null,
    };

    logger.info('Payrexx webhook received', { referenceId, transactionId, status });

    // Look up the payment record and delegate to the appropriate handler
    const lookup = await lookupPaymentByReferenceId(referenceId);

    if (lookup.type === 'marketplace' && lookup.order) {
      await handleMarketplacePayment(lookup.order, status, transactionId, amountClaim);
      return apiSuccess({ received: true });
    }

    if (lookup.type === 'payment_transaction' && lookup.paymentTx) {
      await handleGenericPayment(lookup.paymentTx, status, transactionId, amountClaim);
      return apiSuccess({ received: true });
    }

    logger.warn('Payrexx webhook: no matching record found', { referenceId });
    return apiNotFound('No matching payment record');
  } catch (error) {
    return apiError(error, 'Internal error');
  }
}
