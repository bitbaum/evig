/**
 * Payment gateway adapter contract.
 *
 * Every rail (Payrexx, Taler, BTCPay) implements this one interface, so the
 * payment-flow orchestrator and the unified webhook route are provider-agnostic.
 * Adding a rail = implement `PaymentGateway` + register it in `./index.ts`.
 */

import type { GatewayStatus } from '@/config/gateway-status'

export interface GatewayCreateParams {
  /** Amount in the currency's smallest unit (Rappen for CHF). */
  amount: number
  currency: string
  /** Our payment reference (marketplace order id / payment transaction id). */
  referenceId: string
  successRedirectUrl: string
  failedRedirectUrl: string
  cancelRedirectUrl: string
  /** Purpose / description shown on the payment page. */
  purpose?: string
}

export interface GatewayResult {
  /** Provider-side id (gateway / order / invoice), always stringified. */
  id: string
  /** Hosted payment page URL to redirect the customer to. */
  link: string
}

export interface CaptureResult {
  id: string
  status: GatewayStatus
}

/**
 * Amount + currency a webhook claims. Verified against the expected
 * order/transaction value before any money-moving state transition — a valid
 * signature alone is never sufficient (a replay from a smaller transaction would
 * still be signature-valid). Structurally identical to the `WebhookAmountClaim`
 * the reconciliation handlers consume.
 */
export interface GatewayAmountClaim {
  /** Amount in smallest unit (e.g. Rappen). null if the provider omitted it. */
  amount: number | null
  /** ISO 4217 code (e.g. "CHF"). null if omitted. */
  currency: string | null
}

export interface ParsedWebhook {
  referenceId: string | null
  providerTxId: string | null
  /** Normalized gateway status (a `GATEWAY_STATUS` value). */
  status: string
  amountClaim: GatewayAmountClaim
}

export interface PaymentGateway {
  slug: string
  /** True → value is captured at checkout; no authorize-then-capture hold. */
  capturesOnPay: boolean
  createGateway(params: GatewayCreateParams): Promise<GatewayResult>
  /** Capture reserved funds. No-op for capture-on-pay rails. */
  capture(providerTxId: string, amountCents: number): Promise<CaptureResult>
  /** Authenticate a webhook delivery. Returns false → reject (fail closed). */
  verifyWebhook(rawBody: string, headers: Headers): Promise<boolean>
  /** Extract our reference + normalized status + verified amount from a delivery. */
  parseWebhook(rawBody: string): Promise<ParsedWebhook>
}
