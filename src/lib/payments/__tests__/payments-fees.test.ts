/**
 * Tests for payment fee calculation utilities (lib/payments/payments-fees.ts)
 *
 * Fee calculations are financial-critical: a rounding error means a buyer
 * or seller pays the wrong amount. These pure functions have no DB/API
 * dependencies — correctness is entirely deterministic.
 *
 * Covers: calculateFees, calculateSwissVAT, centsToDisplay.
 */

import {
  calculateFees,
  calculateSwissVAT,
  centsToDisplay,
  DEFAULT_CURRENCY,
  DEFAULT_AUTO_RELEASE_DAYS,
  type PaymentProvider,
} from '../payments-fees'

// ============================================================================
// Test helpers
// ============================================================================

function makeProvider(fee_percentage: number, fee_fixed_cents: number): PaymentProvider {
  return { id: 'test', slug: 'test', fee_percentage, fee_fixed_cents }
}

// ============================================================================
// calculateFees
// ============================================================================

describe('calculateFees', () => {
  it('calculates percentage fee correctly', () => {
    const provider = makeProvider(2.5, 0)
    const result = calculateFees(10000, provider) // CHF 100.00

    expect(result.baseAmountCents).toBe(10000)
    expect(result.feeCents).toBe(250) // 2.5% of 10000
    expect(result.totalAmountCents).toBe(10250)
    expect(result.currency).toBe('CHF')
  })

  it('calculates fixed fee correctly', () => {
    const provider = makeProvider(0, 30) // 30 cents flat
    const result = calculateFees(10000, provider)

    expect(result.feeCents).toBe(30)
    expect(result.totalAmountCents).toBe(10030)
  })

  it('combines percentage and fixed fee', () => {
    const provider = makeProvider(2.9, 30) // Payrexx-like: 2.9% + CHF 0.30
    const result = calculateFees(5000, provider) // CHF 50.00

    // 2.9% of 5000 = 145, + 30 fixed = 175
    expect(result.feeCents).toBe(175)
    expect(result.totalAmountCents).toBe(5175)
  })

  it('handles zero base amount', () => {
    const provider = makeProvider(2.5, 30)
    const result = calculateFees(0, provider)

    expect(result.baseAmountCents).toBe(0)
    expect(result.feeCents).toBe(30) // Only fixed fee applies
    expect(result.totalAmountCents).toBe(30)
  })

  it('rounds percentage fee to nearest cent', () => {
    const provider = makeProvider(2.5, 0)
    const result = calculateFees(333, provider) // 2.5% of 333 = 8.325 → 8

    expect(result.feeCents).toBe(8)
    expect(result.totalAmountCents).toBe(341)
  })

  it('uses CHF as default currency', () => {
    const provider = makeProvider(1, 0)
    const result = calculateFees(1000, provider)

    expect(result.currency).toBe('CHF')
  })

  it('accepts EUR currency override', () => {
    const provider = makeProvider(1, 0)
    const result = calculateFees(1000, provider, 'EUR')

    expect(result.currency).toBe('EUR')
  })

  it('returns correct structure shape', () => {
    const provider = makeProvider(0, 0)
    const result = calculateFees(5000, provider)

    expect(result).toMatchObject({
      baseAmountCents: 5000,
      feeCents: 0,
      totalAmountCents: 5000,
      currency: 'CHF',
    })
  })
})

// ============================================================================
// calculateSwissVAT
// ============================================================================

describe('calculateSwissVAT', () => {
  it('calculates VAT at 7.7% (Swiss standard rate)', () => {
    // 10000 * 0.077 = 770
    const vat = calculateSwissVAT(10000)
    expect(vat).toBe(770)
  })

  it('rounds to nearest cent', () => {
    // 333 * 0.077 = 25.641 → 26
    const vat = calculateSwissVAT(333)
    expect(vat).toBe(26)
  })

  it('returns 0 for 0 amount', () => {
    const vat = calculateSwissVAT(0)
    expect(vat).toBe(0)
  })

  it('handles typical shop price (CHF 350 → 35000 cents)', () => {
    // 35000 * 0.077 = 2695
    const vat = calculateSwissVAT(35000)
    expect(vat).toBe(2695)
  })
})

// ============================================================================
// centsToDisplay
// ============================================================================

describe('centsToDisplay', () => {
  it('converts 100 cents to 1.00', () => {
    expect(centsToDisplay(100)).toBe(1)
  })

  it('converts 0 cents to 0', () => {
    expect(centsToDisplay(0)).toBe(0)
  })

  it('converts 9999 cents to 99.99', () => {
    expect(centsToDisplay(9999)).toBe(99.99)
  })

  it('converts 35000 cents to 350 (CHF 350)', () => {
    expect(centsToDisplay(35000)).toBe(350)
  })

  it('converts 1 cent to 0.01', () => {
    expect(centsToDisplay(1)).toBe(0.01)
  })
})

// ============================================================================
// Constants
// ============================================================================

describe('module constants', () => {
  it('DEFAULT_CURRENCY is CHF', () => {
    expect(DEFAULT_CURRENCY).toBe('CHF')
  })

  it('DEFAULT_AUTO_RELEASE_DAYS is 7', () => {
    expect(DEFAULT_AUTO_RELEASE_DAYS).toBe(7)
  })
})
