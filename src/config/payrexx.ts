/**
 * Payrexx payment integration — SSOT for env keys, routes, and readiness checks.
 *
 * Implementation: `src/lib/payments/payrexx-client.ts`
 * Webhook handler: `src/app/api/payments/payrexx-webhook/route.ts`
 * Dev mock page: `src/app/api/payments/payrexx-mock-redirect/route.ts`
 *
 * Setup guide: `docs/operations/PAYREXX_SETUP.md`
 */

/** Environment variable names (Settings → prod `.env` / GitHub `SELFHOST_ENV`). */
export const PAYREXX_ENV = {
  INSTANCE: 'PAYREXX_INSTANCE',
  API_SECRET: 'PAYREXX_API_SECRET',
  WEBHOOK_SECRET: 'PAYREXX_WEBHOOK_SECRET',
} as const

export const PAYREXX_API_BASE = 'https://api.payrexx.com/v1.0'

/** Hosted payment domains (prod sandbox + live). */
export const PAYREXX_HOSTED_URL_PATTERNS = ['payrexx.com', 'payrexx.ch'] as const

export const PAYREXX_WEBHOOK_PATH = '/api/payments/payrexx-webhook'
export const PAYREXX_MOCK_REDIRECT_PATH = '/api/payments/payrexx-mock-redirect'

/** Shown when prod checkout runs without Payrexx credentials. */
export const PAYREXX_SETUP_MESSAGE =
  'Online-Zahlung wird gerade eingerichtet. Payrexx ist noch nicht aktiv. Bitte kontaktiere Revamp-IT, wenn du sofort bezahlen möchtest.'

export function isPayrexxConfigured(): boolean {
  return !!(
    process.env[PAYREXX_ENV.INSTANCE] &&
    process.env[PAYREXX_ENV.API_SECRET]
  )
}

/** The webhook signing secret is required to reconcile payments. */
export function isPayrexxWebhookSecretSet(): boolean {
  return !!process.env[PAYREXX_ENV.WEBHOOK_SECRET]
}

/**
 * A PARTIAL config (INSTANCE + API_SECRET set, but WEBHOOK_SECRET missing) is the
 * single worst failure mode: gateways open and customers are charged, but every
 * webhook is rejected (fail-closed) so orders never advance past pending. Use this
 * to warn loudly the moment a live gateway is created. True only in that exact state.
 */
export function isPayrexxPartiallyConfigured(): boolean {
  return isPayrexxConfigured() && !isPayrexxWebhookSecretSet()
}

/** Prod blocks checkout until Payrexx is configured; dev uses mock redirect. */
export function isPayrexxCheckoutUnavailable(): boolean {
  return process.env.NODE_ENV === 'production' && !isPayrexxConfigured()
}

export function isPayrexxHostedUrl(url: string): boolean {
  return PAYREXX_HOSTED_URL_PATTERNS.some(host => url.includes(host))
}

export function isPayrexxMockRedirectUrl(url: string): boolean {
  return url.includes(PAYREXX_MOCK_REDIRECT_PATH)
}
