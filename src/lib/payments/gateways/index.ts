/**
 * Payment gateway registry — the single dispatch point for every rail.
 *
 * `getGateway(slug)` resolves an adapter; the orchestrator and the unified
 * webhook route go through here so nothing hardcodes a provider. Adding a rail =
 * one adapter file + one entry in `GATEWAYS`.
 */

import { GATEWAY_STATUS } from '@/config/gateway-status'
import { DEFAULT_PROVIDER_SLUG } from '@/config/payment-providers'
import { payrexxGateway } from './payrexx'
import { talerGateway } from './taler'
import { btcpayGateway } from './btcpay'
import type { PaymentGateway, CaptureResult } from './types'

export type { PaymentGateway, GatewayCreateParams, GatewayResult, CaptureResult, ParsedWebhook, GatewayAmountClaim } from './types'

const GATEWAYS: Record<string, PaymentGateway> = {
  [payrexxGateway.slug]: payrexxGateway,
  [talerGateway.slug]: talerGateway,
  [btcpayGateway.slug]: btcpayGateway,
}

export function hasGateway(slug: string): boolean {
  return slug in GATEWAYS
}

/** Resolve a gateway adapter. Unknown slug → throws (caller validates first). */
export function getGateway(slug: string = DEFAULT_PROVIDER_SLUG): PaymentGateway {
  const gateway = GATEWAYS[slug]
  if (!gateway) {
    throw new Error(`Unknown payment provider: ${slug}`)
  }
  return gateway
}

/**
 * Capture reserved funds via the named provider. Capture-on-pay rails (Taler,
 * BTCPay) already have the money at checkout, so this is a no-op that reports
 * CONFIRMED without a network call.
 */
export async function captureViaGateway(
  providerSlug: string,
  providerTxId: string,
  amountCents: number,
): Promise<CaptureResult> {
  const gateway = getGateway(providerSlug)
  if (gateway.capturesOnPay) {
    return { id: providerTxId, status: GATEWAY_STATUS.CONFIRMED }
  }
  return gateway.capture(providerTxId, amountCents)
}
