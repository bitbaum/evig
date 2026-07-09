/**
 * Promo / gift-code SSOT — types, scopes, and the pure discount math.
 * The DB-dependent checks (redemption counts, per-user limits) live in
 * src/lib/services/promo-codes.ts; everything here is pure + unit-testable.
 */

export const PROMO_CODE_TYPES = {
  PERCENT: 'percent',
  FIXED: 'fixed',
  GIFT_CARD: 'gift_card',
} as const
export type PromoCodeType = (typeof PROMO_CODE_TYPES)[keyof typeof PROMO_CODE_TYPES]

export const PROMO_CODE_SCOPES = {
  ALL: 'all',
  MARKETPLACE: 'marketplace',
  MEMBERSHIP: 'membership',
  WORKSHOP: 'workshop',
  SERVICE: 'service',
} as const
export type PromoCodeScope = (typeof PROMO_CODE_SCOPES)[keyof typeof PROMO_CODE_SCOPES]

/** The subset of a promo_codes row the pure math needs. */
export interface PromoCodeLike {
  type: string
  percent: number | null
  amountCents: number | null
  balanceCents: number | null
  scope: string
  minOrderCents: number
  maxRedemptions: number | null
  perUserLimit: number | null
  redeemedCount: number
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
}

export type PromoInvalidReason =
  | 'not_found'
  | 'inactive'
  | 'not_yet_valid'
  | 'expired'
  | 'wrong_scope'
  | 'below_min_order'
  | 'usage_limit_reached'
  | 'per_user_limit_reached'
  | 'no_balance'
  | 'zero_discount'

export type DiscountResult =
  | { ok: true; discountCents: number }
  | { ok: false; reason: PromoInvalidReason }

/**
 * Compute the discount (in cents) a code yields for an order — or why it can't
 * apply. Caps at the order total (never a negative total). `userRedemptions` is
 * how many times THIS user already redeemed THIS code (caller supplies from DB).
 */
export function computeDiscount(
  code: PromoCodeLike,
  opts: { totalCents: number; scope: PromoCodeScope; nowMs: number; userRedemptions: number },
): DiscountResult {
  const { totalCents, scope, nowMs, userRedemptions } = opts

  if (!code.isActive) return { ok: false, reason: 'inactive' }
  if (code.validFrom && nowMs < Date.parse(code.validFrom)) return { ok: false, reason: 'not_yet_valid' }
  if (code.validUntil && nowMs > Date.parse(code.validUntil)) return { ok: false, reason: 'expired' }
  if (code.scope !== PROMO_CODE_SCOPES.ALL && code.scope !== scope) return { ok: false, reason: 'wrong_scope' }
  if (totalCents < code.minOrderCents) return { ok: false, reason: 'below_min_order' }
  if (code.maxRedemptions != null && code.redeemedCount >= code.maxRedemptions) {
    return { ok: false, reason: 'usage_limit_reached' }
  }
  if (code.perUserLimit != null && userRedemptions >= code.perUserLimit) {
    return { ok: false, reason: 'per_user_limit_reached' }
  }

  let raw: number
  switch (code.type) {
    case PROMO_CODE_TYPES.PERCENT:
      raw = Math.floor((totalCents * (code.percent ?? 0)) / 100)
      break
    case PROMO_CODE_TYPES.FIXED:
      raw = code.amountCents ?? 0
      break
    case PROMO_CODE_TYPES.GIFT_CARD:
      if ((code.balanceCents ?? 0) <= 0) return { ok: false, reason: 'no_balance' }
      raw = code.balanceCents ?? 0
      break
    default:
      return { ok: false, reason: 'not_found' }
  }

  const discountCents = Math.min(raw, totalCents) // never exceed the total
  if (discountCents <= 0) return { ok: false, reason: 'zero_discount' }
  return { ok: true, discountCents }
}

/** User-facing German message for an invalid-code reason. */
export const PROMO_INVALID_MESSAGES: Record<PromoInvalidReason, string> = {
  not_found: 'Dieser Code ist ungültig.',
  inactive: 'Dieser Code ist nicht mehr aktiv.',
  not_yet_valid: 'Dieser Code ist noch nicht gültig.',
  expired: 'Dieser Code ist abgelaufen.',
  wrong_scope: 'Dieser Code gilt nicht für diesen Einkauf.',
  below_min_order: 'Der Mindestbestellwert für diesen Code ist nicht erreicht.',
  usage_limit_reached: 'Dieser Code wurde bereits vollständig eingelöst.',
  per_user_limit_reached: 'Du hast diesen Code bereits eingelöst.',
  no_balance: 'Dieses Guthaben ist aufgebraucht.',
  zero_discount: 'Dieser Code ergibt keinen Rabatt für diesen Einkauf.',
}
