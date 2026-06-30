/**
 * Payrexx API Client — Thin wrapper for reservation-based escrow payments.
 *
 * Config SSOT: `src/config/payrexx.ts` · Setup: `docs/operations/PAYREXX_SETUP.md`
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { PAYMENT_STATUS } from '@/config/payment-status';
import {
  PAYREXX_API_BASE,
  PAYREXX_ENV,
  PAYREXX_MOCK_REDIRECT_PATH,
  isPayrexxConfigured,
  isPayrexxPartiallyConfigured,
} from '@/config/payrexx';
import { APP_URL } from '@/config/urls';

export {
  PAYREXX_SETUP_MESSAGE,
  isPayrexxCheckoutUnavailable,
  isPayrexxConfigured,
} from '@/config/payrexx';

/**
 * Payrexx transaction status values (external API contract).
 * These are the status strings Payrexx sends in webhook payloads.
 */
export const PAYREXX_TRANSACTION_STATUS = {
  RESERVED: 'reserved',                    // authorized / funds held
  CONFIRMED: 'confirmed',                  // captured / payment complete
  REFUNDED: 'refunded',                    // fully refunded
  PARTIALLY_REFUNDED: 'partially-refunded',// partially refunded
  WAITING: 'waiting',                      // awaiting bank confirmation
  CANCELLED: 'cancelled',                  // transaction cancelled
  DECLINED: 'declined',                    // card declined
  ERROR: 'error',                          // processing error
} as const;

export type PayrexxTransactionStatus = typeof PAYREXX_TRANSACTION_STATUS[keyof typeof PAYREXX_TRANSACTION_STATUS];

// ============================================================================
// Types
// ============================================================================

export interface PayrexxGatewayParams {
  /** Amount in cents (Rappen) */
  amount: number;
  currency: string;
  referenceId: string;
  successRedirectUrl: string;
  failedRedirectUrl: string;
  cancelRedirectUrl: string;
  /** Purpose / description shown on payment page */
  purpose?: string;
}

export interface PayrexxGateway {
  id: number;
  link: string;
}

export interface PayrexxTransactionResult {
  id: number;
  status: string;
}

// ============================================================================
// HMAC-SHA256 signature
// ============================================================================

function sign(queryString: string): string {
  const secret = process.env[PAYREXX_ENV.API_SECRET]!;
  return crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('base64');
}

function buildSignedParams(params: Record<string, string>): string {
  const encoded = new URLSearchParams(params).toString();
  const signature = sign(encoded);
  return `${encoded}&ApiSignature=${encodeURIComponent(signature)}`;
}

// ============================================================================
// API methods
// ============================================================================

async function apiRequest<T>(
  method: string,
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const instance = process.env[PAYREXX_ENV.INSTANCE]!;
  const url = `${PAYREXX_API_BASE}/${path}?instance=${instance}`;
  const body = buildSignedParams(params);

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method !== 'GET' ? body : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error('Payrexx API error', { status: response.status, body: text, path });
    throw new Error(`Payrexx API ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json.data?.[0] ?? json.data ?? json;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a Payrexx Gateway with reservation=true.
 * Returns the gateway ID and hosted payment page link.
 */
export async function createGateway(params: PayrexxGatewayParams): Promise<PayrexxGateway> {
  if (!isPayrexxConfigured()) {
    return createMockGateway(params);
  }

  // Live, but missing the webhook secret → the customer will be charged but the
  // reconciling webhook is rejected and the order never advances. Warn loudly
  // at the moment of charge so this is caught before customers are affected.
  if (isPayrexxPartiallyConfigured()) {
    logger.error(
      'PAYREXX_WEBHOOK_SECRET is not set while Payrexx is live — payments will be charged but every webhook is rejected (orders stay pending). Set PAYREXX_WEBHOOK_SECRET immediately.',
      { referenceId: params.referenceId },
    );
  }

  const gatewayParams: Record<string, string> = {
    amount: String(params.amount),
    currency: params.currency,
    referenceId: params.referenceId,
    // Payrexx expects the integer flag `1` (not the string "true", which its
    // PHP backend coerces to 0 → reservation silently disabled). Funds are
    // authorized/held, then captured (marketplace: on receipt-confirm/escrow
    // release; workshops/appointments: immediately in the webhook handler).
    reservation: '1',
    successRedirectUrl: params.successRedirectUrl,
    failedRedirectUrl: params.failedRedirectUrl,
    cancelRedirectUrl: params.cancelRedirectUrl,
  };

  if (params.purpose) {
    gatewayParams['fields[purpose][value]'] = params.purpose;
  }

  const result = await apiRequest<{ id: number; link: string }>('POST', 'Gateway/', gatewayParams);

  logger.info('Payrexx gateway created', {
    gatewayId: result.id,
    referenceId: params.referenceId,
  });

  return { id: result.id, link: result.link };
}

/**
 * Capture a reserved transaction (releases held funds to merchant).
 */
export async function captureTransaction(transactionId: string, amount: number): Promise<PayrexxTransactionResult> {
  if (!isPayrexxConfigured()) {
    logger.info('Mock: Payrexx capture', { transactionId, amount });
    return { id: Number(transactionId), status: PAYREXX_TRANSACTION_STATUS.CONFIRMED };
  }

  const result = await apiRequest<PayrexxTransactionResult>(
    'POST',
    `Transaction/${transactionId}/`,
    { amount: String(amount) }
  );

  logger.info('Payrexx transaction captured', { transactionId, amount, status: result.status });
  return result;
}

/**
 * Cancel a reserved transaction (releases the hold back to buyer).
 */
export async function cancelTransaction(transactionId: string): Promise<PayrexxTransactionResult> {
  if (!isPayrexxConfigured()) {
    logger.info('Mock: Payrexx cancel', { transactionId });
    return { id: Number(transactionId), status: PAYMENT_STATUS.CANCELLED };
  }

  const result = await apiRequest<PayrexxTransactionResult>(
    'DELETE',
    `Transaction/${transactionId}/`
  );

  logger.info('Payrexx transaction cancelled', { transactionId, status: result.status });
  return result;
}

/**
 * Refund a captured transaction.
 */
export async function refundTransaction(transactionId: string, amount: number): Promise<PayrexxTransactionResult> {
  if (!isPayrexxConfigured()) {
    logger.info('Mock: Payrexx refund', { transactionId, amount });
    return { id: Number(transactionId), status: PAYMENT_STATUS.REFUNDED };
  }

  const result = await apiRequest<PayrexxTransactionResult>(
    'POST',
    `Transaction/${transactionId}/refund`,
    { amount: String(amount) }
  );

  logger.info('Payrexx transaction refunded', { transactionId, amount, status: result.status });
  return result;
}

// ============================================================================
// Mock mode — dev gateway pointing to our mock redirect route
// ============================================================================

function createMockGateway(params: PayrexxGatewayParams): PayrexxGateway {
  const mockId = Math.floor(Math.random() * 900000) + 100000;

  const mockParams = new URLSearchParams({
    referenceId: params.referenceId,
    amount: String(params.amount),
    currency: params.currency,
    successUrl: params.successRedirectUrl,
    failedUrl: params.failedRedirectUrl,
    cancelUrl: params.cancelRedirectUrl,
  });

  const link = `${APP_URL}${PAYREXX_MOCK_REDIRECT_PATH}?${mockParams.toString()}`;

  logger.info('Mock Payrexx gateway created', {
    gatewayId: mockId,
    referenceId: params.referenceId,
  });

  return { id: mockId, link };
}
