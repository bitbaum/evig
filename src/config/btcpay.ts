/**
 * BTCPay Server integration — SSOT for env keys, routes, and readiness checks.
 *
 * BTCPay is a self-hosted, non-custodial Bitcoin (on-chain + Lightning) payment
 * processor. Invoices are PRICED in CHF and the buyer pays the BTC equivalent at
 * the rate BTCPay quotes; the authoritative CHF amount for reconciliation is read
 * back from the invoice (never trusted from the webhook body). Payment is
 * CAPTURE-ON-PAY (settlement is a chain/Lightning transfer), so BTCPay is offered
 * for non-escrow flows only.
 *
 * Adapter: `src/lib/payments/gateways/btcpay.ts`
 * Setup guide: `docs/operations/BTCPAY_SETUP.md`
 */

export const BTCPAY_PROVIDER_SLUG = 'btcpay'

/** Environment variable names (Settings → prod `.env` / GitHub `SELFHOST_ENV`). */
export const BTCPAY_ENV = {
  /** BTCPay Server base URL, e.g. https://btcpay.example.org */
  SERVER_URL: 'BTCPAY_SERVER_URL',
  /** Greenfield API key (Authorization: token <key>). */
  API_KEY: 'BTCPAY_API_KEY',
  /** Store id the invoices are created under. */
  STORE_ID: 'BTCPAY_STORE_ID',
  /** Webhook signing secret (BTCPay-Sig: sha256=<hex>). */
  WEBHOOK_SECRET: 'BTCPAY_WEBHOOK_SECRET',
} as const

/** Invoices are denominated in CHF; BTCPay converts to BTC at pay time. */
export const BTCPAY_INVOICE_CURRENCY = 'CHF'

export const BTCPAY_WEBHOOK_PATH = '/api/payments/webhook/btcpay'

/** Shown when Bitcoin payment is offered but not yet provisioned. */
export const BTCPAY_SETUP_MESSAGE =
  'Bezahlung mit Bitcoin wird gerade eingerichtet und ist noch nicht aktiv.'

/** Requires a server URL, an API key, and a store id to create invoices. */
export function isBtcpayConfigured(): boolean {
  return !!(
    process.env[BTCPAY_ENV.SERVER_URL] &&
    process.env[BTCPAY_ENV.API_KEY] &&
    process.env[BTCPAY_ENV.STORE_ID]
  )
}

export function isBtcpayWebhookSecretSet(): boolean {
  return !!process.env[BTCPAY_ENV.WEBHOOK_SECRET]
}
