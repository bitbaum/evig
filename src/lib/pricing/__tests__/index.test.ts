/**
 * Tests for pricing/index.ts — Swiss VAT and payment fee calculations.
 *
 * Pure functions, no mocks needed. Bugs here produce incorrect prices shown
 * to users and incorrect amounts charged through Payrexx.
 */

import {
  VAT_RATE_CHF,
  PAYMENT_FEE_PERCENTAGE,
  PAYMENT_FEE_FIXED,
  getVATRate,
  getVATRateLabel,
  calculateVAT,
  calculatePaymentFees,
  calculateTotalWithFees,
  calculateServicePricing,
} from '../index'

describe('getVATRate', () => {
  it('returns Swiss VAT rate (7.7%) for CHF', () => {
    expect(getVATRate('CHF')).toBe(VAT_RATE_CHF)
    expect(getVATRate('CHF')).toBeCloseTo(0.077)
  })

  it('returns default VAT rate (19%) for EUR', () => {
    expect(getVATRate('EUR')).toBeCloseTo(0.19)
  })

  it('returns default VAT rate for unknown currency', () => {
    expect(getVATRate('USD')).toBeCloseTo(0.19)
    expect(getVATRate('')).toBeCloseTo(0.19)
  })
})

describe('getVATRateLabel', () => {
  it('returns "7.7" for CHF', () => {
    expect(getVATRateLabel('CHF')).toBe('7.7')
  })

  it('returns "19.0" for EUR', () => {
    expect(getVATRateLabel('EUR')).toBe('19.0')
  })

  it('returns "19.0" for unknown currency', () => {
    expect(getVATRateLabel('USD')).toBe('19.0')
  })
})

describe('calculateVAT', () => {
  it('calculates Swiss VAT on CHF amount', () => {
    // 100 CHF subtotal → 7.70 CHF VAT
    expect(calculateVAT(100, 'CHF')).toBeCloseTo(7.7)
  })

  it('calculates EUR VAT on EUR amount', () => {
    // 100 EUR subtotal → 19.00 EUR VAT
    expect(calculateVAT(100, 'EUR')).toBeCloseTo(19.0)
  })

  it('defaults to CHF when currency omitted', () => {
    expect(calculateVAT(100)).toBeCloseTo(7.7)
  })

  it('returns 0 VAT on 0 subtotal', () => {
    expect(calculateVAT(0, 'CHF')).toBe(0)
  })

  it('scales linearly', () => {
    expect(calculateVAT(200, 'CHF')).toBeCloseTo(calculateVAT(100, 'CHF') * 2)
  })
})

describe('calculatePaymentFees', () => {
  it('applies percentage + fixed fee', () => {
    // 100 CHF: 2.9% + 0.30 = 2.90 + 0.30 = 3.20
    expect(calculatePaymentFees(100)).toBeCloseTo(3.20)
  })

  it('is correct for small amounts (fixed fee dominates)', () => {
    // 10 CHF: 2.9% + 0.30 = 0.29 + 0.30 = 0.59
    expect(calculatePaymentFees(10)).toBeCloseTo(0.59)
  })

  it('matches formula: amount * percentage + fixed', () => {
    const amount = 250
    const expected = amount * PAYMENT_FEE_PERCENTAGE + PAYMENT_FEE_FIXED
    expect(calculatePaymentFees(amount)).toBeCloseTo(expected)
  })

  it('returns fixed fee for zero amount', () => {
    expect(calculatePaymentFees(0)).toBeCloseTo(PAYMENT_FEE_FIXED)
  })
})

describe('calculateTotalWithFees', () => {
  it('adds CHF VAT then payment fees to subtotal', () => {
    // Subtotal: 100 CHF
    // VAT: 7.70 CHF → subtotalWithVat: 107.70
    // Payment fee: 107.70 * 2.9% + 0.30 = 3.1233 + 0.30 = 3.4233
    // Total: 107.70 + 3.4233 ≈ 111.12
    expect(calculateTotalWithFees(100, 'CHF')).toBeGreaterThan(100)
    expect(calculateTotalWithFees(100, 'CHF')).toBeCloseTo(111.12, 1)
  })

  it('total is always greater than subtotal', () => {
    expect(calculateTotalWithFees(50, 'CHF')).toBeGreaterThan(50)
    expect(calculateTotalWithFees(200, 'EUR')).toBeGreaterThan(200)
  })

  it('defaults to CHF', () => {
    expect(calculateTotalWithFees(100)).toBeCloseTo(calculateTotalWithFees(100, 'CHF'))
  })

  it('EUR total includes higher VAT', () => {
    const chfTotal = calculateTotalWithFees(100, 'CHF')
    const eurTotal = calculateTotalWithFees(100, 'EUR')
    expect(eurTotal).toBeGreaterThan(chfTotal)
  })
})

describe('calculateServicePricing', () => {
  it('converts cents to CHF subtotal correctly', () => {
    // 10000 cents = 100.00 CHF subtotal
    const result = calculateServicePricing(10000, 'CHF')
    expect(result.subtotal).toBeCloseTo(100)
  })

  it('calculates VAT on subtotal (not on total)', () => {
    const result = calculateServicePricing(10000, 'CHF')
    expect(result.vat).toBeCloseTo(7.7, 1)
  })

  it('total is subtotal + VAT + fees', () => {
    const result = calculateServicePricing(10000, 'CHF')
    // NOTE: calculateServicePricing applies fees to subtotal (not subtotal+VAT)
    const expectedTotal = result.subtotal + result.vat + calculatePaymentFees(result.subtotal)
    expect(result.total).toBeCloseTo(expectedTotal, 5)
  })

  it('returns object with subtotal, vat, total keys', () => {
    const result = calculateServicePricing(5000, 'CHF')
    expect(result).toHaveProperty('subtotal')
    expect(result).toHaveProperty('vat')
    expect(result).toHaveProperty('total')
  })

  it('handles zero cents input', () => {
    const result = calculateServicePricing(0, 'CHF')
    expect(result.subtotal).toBe(0)
    expect(result.vat).toBe(0)
  })

  it('defaults to CHF', () => {
    const chf = calculateServicePricing(10000, 'CHF')
    const def = calculateServicePricing(10000)
    expect(def.subtotal).toBeCloseTo(chf.subtotal)
    expect(def.vat).toBeCloseTo(chf.vat)
  })
})
