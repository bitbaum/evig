/**
 * Tests for src/lib/pricing/index.ts
 *
 * Pure math functions: VAT rates, payment fees, total calculations.
 * All inputs/outputs are deterministic numbers — no mocks needed.
 *
 * These functions are the SSOT for payment calculations used across the
 * checkout flow and service pricing UI. Regressions here are billing bugs.
 */

import {
  VAT_RATE_CHF,
  VAT_RATE_DEFAULT,
  PAYMENT_FEE_PERCENTAGE,
  PAYMENT_FEE_FIXED,
  getVATRate,
  getVATRateLabel,
  calculateVAT,
  calculatePaymentFees,
  calculateTotalWithFees,
  calculateServicePricing,
} from '../pricing'

// ─── Constants ────────────────────────────────────────────────────────────────

describe('pricing constants', () => {
  it('VAT_RATE_CHF is 7.7%', () => {
    expect(VAT_RATE_CHF).toBeCloseTo(0.077)
  })

  it('VAT_RATE_DEFAULT is 19%', () => {
    expect(VAT_RATE_DEFAULT).toBeCloseTo(0.19)
  })

  it('PAYMENT_FEE_PERCENTAGE is 2.9%', () => {
    expect(PAYMENT_FEE_PERCENTAGE).toBeCloseTo(0.029)
  })

  it('PAYMENT_FEE_FIXED is CHF 0.30', () => {
    expect(PAYMENT_FEE_FIXED).toBeCloseTo(0.30)
  })
})

// ─── getVATRate ───────────────────────────────────────────────────────────────

describe('getVATRate', () => {
  it('CHF → 7.7% (Swiss VAT)', () => {
    expect(getVATRate('CHF')).toBe(VAT_RATE_CHF)
  })

  it('EUR → 19% (default)', () => {
    expect(getVATRate('EUR')).toBe(VAT_RATE_DEFAULT)
  })

  it('USD → 19% (default)', () => {
    expect(getVATRate('USD')).toBe(VAT_RATE_DEFAULT)
  })

  it('unknown currency → 19% default', () => {
    expect(getVATRate('XYZ')).toBe(VAT_RATE_DEFAULT)
  })

  it('returns a number between 0 and 1', () => {
    expect(getVATRate('CHF')).toBeGreaterThan(0)
    expect(getVATRate('CHF')).toBeLessThan(1)
  })
})

// ─── getVATRateLabel ──────────────────────────────────────────────────────────

describe('getVATRateLabel', () => {
  it('CHF → "7.7"', () => {
    expect(getVATRateLabel('CHF')).toBe('7.7')
  })

  it('EUR → "19.0"', () => {
    expect(getVATRateLabel('EUR')).toBe('19.0')
  })

  it('unknown currency → "19.0"', () => {
    expect(getVATRateLabel('GPB')).toBe('19.0')
  })

  it('returns a string', () => {
    expect(typeof getVATRateLabel('CHF')).toBe('string')
  })
})

// ─── calculateVAT ─────────────────────────────────────────────────────────────

describe('calculateVAT', () => {
  it('100 CHF subtotal → 7.70 VAT', () => {
    expect(calculateVAT(100, 'CHF')).toBeCloseTo(7.7)
  })

  it('100 EUR subtotal → 19.00 VAT', () => {
    expect(calculateVAT(100, 'EUR')).toBeCloseTo(19)
  })

  it('0 subtotal → 0 VAT', () => {
    expect(calculateVAT(0, 'CHF')).toBe(0)
  })

  it('defaults to CHF if no currency specified', () => {
    expect(calculateVAT(100)).toBeCloseTo(7.7)
  })

  it('result is proportional: 200 CHF → twice the VAT of 100 CHF', () => {
    expect(calculateVAT(200, 'CHF')).toBeCloseTo(2 * calculateVAT(100, 'CHF'))
  })
})

// ─── calculatePaymentFees ─────────────────────────────────────────────────────

describe('calculatePaymentFees', () => {
  it('100 → 2.9% × 100 + 0.30 = 3.20', () => {
    expect(calculatePaymentFees(100)).toBeCloseTo(3.20)
  })

  it('0 → fixed fee only (0.30)', () => {
    expect(calculatePaymentFees(0)).toBeCloseTo(0.30)
  })

  it('1000 → 29.30', () => {
    expect(calculatePaymentFees(1000)).toBeCloseTo(29.30)
  })

  it('fee increases with amount', () => {
    expect(calculatePaymentFees(200)).toBeGreaterThan(calculatePaymentFees(100))
  })

  it('minimum fee is PAYMENT_FEE_FIXED (0.30)', () => {
    expect(calculatePaymentFees(0)).toBeCloseTo(PAYMENT_FEE_FIXED)
  })
})

// ─── calculateTotalWithFees ───────────────────────────────────────────────────

describe('calculateTotalWithFees', () => {
  it('total is greater than subtotal (VAT + fees added)', () => {
    expect(calculateTotalWithFees(100, 'CHF')).toBeGreaterThan(100)
  })

  it('100 CHF → ~111.5 (100 + 7.7 VAT + ~3.5 payment fee on 107.7)', () => {
    // 100 + 7.7 = 107.7 subtotalWithVat; 107.7 * 0.029 + 0.30 = 3.423
    const expected = 107.7 + (107.7 * 0.029 + 0.30)
    expect(calculateTotalWithFees(100, 'CHF')).toBeCloseTo(expected, 2)
  })

  it('defaults to CHF', () => {
    expect(calculateTotalWithFees(100)).toBeCloseTo(calculateTotalWithFees(100, 'CHF'))
  })

  it('0 subtotal → still has payment fixed fee', () => {
    expect(calculateTotalWithFees(0, 'CHF')).toBeCloseTo(PAYMENT_FEE_FIXED)
  })
})

// ─── calculateServicePricing ──────────────────────────────────────────────────

describe('calculateServicePricing', () => {
  it('10000 cents (CHF 100) → subtotal=100', () => {
    const result = calculateServicePricing(10000, 'CHF')
    expect(result.subtotal).toBeCloseTo(100)
  })

  it('10000 cents (CHF 100) → vat≈7.70', () => {
    const result = calculateServicePricing(10000, 'CHF')
    expect(result.vat).toBeCloseTo(7.7)
  })

  it('total > subtotal + vat (payment fees included)', () => {
    const result = calculateServicePricing(10000, 'CHF')
    expect(result.total).toBeGreaterThan(result.subtotal + result.vat)
  })

  it('result has subtotal, vat, total', () => {
    const result = calculateServicePricing(5000, 'CHF')
    expect(result).toHaveProperty('subtotal')
    expect(result).toHaveProperty('vat')
    expect(result).toHaveProperty('total')
  })

  it('0 cents → subtotal=0, vat=0', () => {
    const result = calculateServicePricing(0, 'CHF')
    expect(result.subtotal).toBe(0)
    expect(result.vat).toBe(0)
  })

  it('all values are finite numbers', () => {
    const result = calculateServicePricing(10000, 'CHF')
    expect(isFinite(result.subtotal)).toBe(true)
    expect(isFinite(result.vat)).toBe(true)
    expect(isFinite(result.total)).toBe(true)
  })
})
