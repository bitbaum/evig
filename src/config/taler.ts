/**
 * GNU Taler payment integration — SSOT for env keys, routes, and readiness checks.
 *
 * Taler is regulated digital cash (privacy-preserving, no chargebacks), settled
 * through a merchant backend that talks to a CHF-denominated exchange. Payment is
 * CAPTURE-ON-PAY: the customer's wallet transfers value at checkout, so there is
 * no authorize-then-capture hold — Taler is offered for non-escrow flows only.
 *
 * Adapter: `src/lib/payments/gateways/taler.ts`
 * Setup guide: `docs/operations/TALER_SETUP.md`
 */

export const TALER_PROVIDER_SLUG = 'taler'

/** Environment variable names (Settings → prod `.env` / GitHub `SELFHOST_ENV`). */
export const TALER_ENV = {
  /** Merchant backend base URL, e.g. https://backend.taler.example/instances/revampit */
  BACKEND_URL: 'TALER_BACKEND_URL',
  /** Merchant backend API token (Bearer). */
  API_TOKEN: 'TALER_API_TOKEN',
  /** Optional shared secret Taler signs webhook deliveries with. */
  WEBHOOK_SECRET: 'TALER_WEBHOOK_SECRET',
} as const

/** Taler amounts are `CURRENCY:decimal` strings; we settle in CHF. */
export const TALER_SETTLEMENT_CURRENCY = 'CHF'

export const TALER_WEBHOOK_PATH = '/api/payments/webhook/taler'

/** Shown when Taler is offered but not yet provisioned. */
export const TALER_SETUP_MESSAGE =
  'Bezahlung mit Taler wird gerade eingerichtet und ist noch nicht aktiv.'

/** Requires a reachable backend + an API token to create and settle orders. */
export function isTalerConfigured(): boolean {
  return !!(process.env[TALER_ENV.BACKEND_URL] && process.env[TALER_ENV.API_TOKEN])
}

export function isTalerWebhookSecretSet(): boolean {
  return !!process.env[TALER_ENV.WEBHOOK_SECRET]
}
