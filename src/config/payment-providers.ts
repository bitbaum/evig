/**
 * Payment provider capability registry — SSOT.
 *
 * Describes WHICH rails exist and what each can do (escrow? capture-on-pay?
 * configured?). The gateway adapters (`src/lib/payments/gateways/*`) implement the
 * behaviour; this file declares the capabilities the orchestrator and the UI
 * reason about. Adding a rail = one descriptor here + one adapter.
 *
 * Escrow rule (a law of physics of these rails, not a preference): only a
 * provider that AUTHORIZES-then-CAPTURES (holds funds) can back an escrow flow.
 * Capture-on-pay rails (Taler, Bitcoin) move value at checkout — they cannot hold
 * funds, so they are excluded from escrow-required payments (P2P marketplace).
 */

import { isPayrexxConfigured, PAYREXX_SETUP_MESSAGE } from './payrexx'
import { isTalerConfigured, TALER_PROVIDER_SLUG } from './taler'
import { isBtcpayConfigured, BTCPAY_PROVIDER_SLUG } from './btcpay'

export type PaymentProviderType = 'gateway' | 'crypto'

export interface PaymentProviderMeta {
  slug: string
  type: PaymentProviderType
  /** Short human label (Swiss German). */
  label: string
  /** i18n message key for the picker description. */
  descriptionKey: string
  /** Can hold funds (authorize → capture) → eligible for escrow flows. */
  supportsEscrow: boolean
  /** Captures value at checkout (no hold) → escrow-incompatible. */
  capturesOnPay: boolean
  /** Live credentials present in this environment. */
  isConfigured: () => boolean
}

export const DEFAULT_PROVIDER_SLUG = 'payrexx'

export const PAYMENT_PROVIDERS: readonly PaymentProviderMeta[] = [
  {
    slug: 'payrexx',
    type: 'gateway',
    label: 'Karte / TWINT',
    descriptionKey: 'payment.method.payrexx',
    supportsEscrow: true,
    capturesOnPay: false,
    isConfigured: isPayrexxConfigured,
  },
  {
    slug: TALER_PROVIDER_SLUG,
    type: 'gateway',
    label: 'Taler',
    descriptionKey: 'payment.method.taler',
    supportsEscrow: false,
    capturesOnPay: true,
    isConfigured: isTalerConfigured,
  },
  {
    slug: BTCPAY_PROVIDER_SLUG,
    type: 'crypto',
    label: 'Bitcoin',
    descriptionKey: 'payment.method.btcpay',
    supportsEscrow: false,
    capturesOnPay: true,
    isConfigured: isBtcpayConfigured,
  },
] as const

/** Zod enum tuple of every known provider slug. */
export const PAYMENT_PROVIDER_SLUGS = PAYMENT_PROVIDERS.map((p) => p.slug) as [string, ...string[]]

export function getProviderMeta(slug: string): PaymentProviderMeta | undefined {
  return PAYMENT_PROVIDERS.find((p) => p.slug === slug)
}

/**
 * Providers offerable to a customer right now.
 *
 * - `requireEscrow` filters out capture-on-pay rails (P2P marketplace needs holds).
 * - In production a rail must have live credentials (`isConfigured`); in dev every
 *   rail is offered so the mock flow is testable end-to-end.
 */
export function getAvailableProviders(opts: { requireEscrow?: boolean } = {}): PaymentProviderMeta[] {
  const isProd = process.env.NODE_ENV === 'production'
  return PAYMENT_PROVIDERS.filter((p) => {
    if (opts.requireEscrow && !p.supportsEscrow) return false
    if (isProd && !p.isConfigured()) return false
    return true
  })
}

export function isProviderAvailable(slug: string, opts: { requireEscrow?: boolean } = {}): boolean {
  return getAvailableProviders(opts).some((p) => p.slug === slug)
}

/** Shown when a non-default rail can't be used (unconfigured, or escrow required but capture-on-pay). */
export const PROVIDER_UNAVAILABLE_MESSAGE = 'Gewählte Zahlungsart ist nicht verfügbar.'

/**
 * The user-facing reason the chosen rail can't be used for this flow, or null if
 * it's available. SSOT for the checkout gate shared by every pay route: Payrexx
 * keeps its dedicated setup message; any other unavailable rail gets the generic
 * notice. `useEscrow` forwards the escrow requirement (capture-on-pay rails fail it).
 */
export function providerUnavailableMessage(
  providerSlug: string | undefined,
  useEscrow: boolean,
): string | null {
  const effective = providerSlug || DEFAULT_PROVIDER_SLUG
  if (isProviderAvailable(effective, { requireEscrow: useEscrow })) return null
  return effective === DEFAULT_PROVIDER_SLUG ? PAYREXX_SETUP_MESSAGE : PROVIDER_UNAVAILABLE_MESSAGE
}
