import { computeDiscount, PROMO_CODE_SCOPES, type PromoCodeLike } from '@/config/promo-codes'

const base: PromoCodeLike = {
  type: 'percent',
  percent: 100,
  amountCents: null,
  balanceCents: null,
  scope: 'all',
  minOrderCents: 0,
  maxRedemptions: null,
  perUserLimit: null,
  redeemedCount: 0,
  validFrom: null,
  validUntil: null,
  isActive: true,
}
const NOW = Date.parse('2026-07-09T12:00:00Z')
const ctx = { scope: PROMO_CODE_SCOPES.MARKETPLACE, nowMs: NOW, userRedemptions: 0 }

describe('computeDiscount', () => {
  it('percent: 100% off zeroes the total', () => {
    const r = computeDiscount({ ...base, percent: 100 }, { ...ctx, totalCents: 4000 })
    expect(r).toEqual({ ok: true, discountCents: 4000 })
  })

  it('percent: 50% off halves (floor)', () => {
    const r = computeDiscount({ ...base, percent: 50 }, { ...ctx, totalCents: 4999 })
    expect(r).toEqual({ ok: true, discountCents: 2499 })
  })

  it('fixed: caps at the order total (never negative)', () => {
    const code = { ...base, type: 'fixed', percent: null, amountCents: 10000 }
    expect(computeDiscount(code, { ...ctx, totalCents: 4000 })).toEqual({ ok: true, discountCents: 4000 })
    expect(computeDiscount(code, { ...ctx, totalCents: 15000 })).toEqual({ ok: true, discountCents: 10000 })
  })

  it('gift_card: discounts up to the remaining balance', () => {
    const code = { ...base, type: 'gift_card', percent: null, amountCents: 5000, balanceCents: 3000 }
    expect(computeDiscount(code, { ...ctx, totalCents: 4000 })).toEqual({ ok: true, discountCents: 3000 })
  })

  it('gift_card: rejects when balance is empty', () => {
    const code = { ...base, type: 'gift_card', percent: null, balanceCents: 0 }
    expect(computeDiscount(code, { ...ctx, totalCents: 4000 })).toEqual({ ok: false, reason: 'no_balance' })
  })

  it('rejects inactive / expired / not-yet-valid', () => {
    expect(computeDiscount({ ...base, isActive: false }, { ...ctx, totalCents: 4000 }).ok).toBe(false)
    expect(computeDiscount({ ...base, validUntil: '2026-07-08T00:00:00Z' }, { ...ctx, totalCents: 4000 }))
      .toEqual({ ok: false, reason: 'expired' })
    expect(computeDiscount({ ...base, validFrom: '2026-07-10T00:00:00Z' }, { ...ctx, totalCents: 4000 }))
      .toEqual({ ok: false, reason: 'not_yet_valid' })
  })

  it('enforces scope', () => {
    const code = { ...base, scope: 'workshop' }
    expect(computeDiscount(code, { ...ctx, totalCents: 4000 })).toEqual({ ok: false, reason: 'wrong_scope' })
    // scope=all always matches
    expect(computeDiscount({ ...base, scope: 'all' }, { ...ctx, totalCents: 4000 }).ok).toBe(true)
  })

  it('enforces min order, global and per-user limits', () => {
    expect(computeDiscount({ ...base, minOrderCents: 5000 }, { ...ctx, totalCents: 4000 }))
      .toEqual({ ok: false, reason: 'below_min_order' })
    expect(computeDiscount({ ...base, maxRedemptions: 5, redeemedCount: 5 }, { ...ctx, totalCents: 4000 }))
      .toEqual({ ok: false, reason: 'usage_limit_reached' })
    expect(computeDiscount({ ...base, perUserLimit: 1 }, { ...ctx, totalCents: 4000, userRedemptions: 1 }))
      .toEqual({ ok: false, reason: 'per_user_limit_reached' })
  })

  it('rejects a zero-value discount', () => {
    expect(computeDiscount({ ...base, type: 'fixed', percent: null, amountCents: 0 }, { ...ctx, totalCents: 4000 }))
      .toEqual({ ok: false, reason: 'zero_discount' })
  })
})
