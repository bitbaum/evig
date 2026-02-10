/**
 * Tests for currency.ts
 *
 * Tests currency conversion, formatting, VAT calculation, and utility functions.
 */

import {
  CURRENCY_CONFIG,
  EXCHANGE_RATES,
  convertCurrency,
  formatCurrency,
  calculateVAT,
  calculatePaymentFees,
  getServicePricing,
  isValidCurrency,
  getCurrencyConfig,
  getSupportedCurrencies,
  centsToDecimal,
  decimalToCents,
  isEuroZone,
  getVATRate,
} from '../currency'

// ============================================================================
// Constants
// ============================================================================

describe('CURRENCY_CONFIG', () => {
  it('has CHF configuration', () => {
    expect(CURRENCY_CONFIG.CHF.code).toBe('CHF')
    expect(CURRENCY_CONFIG.CHF.taxRate).toBe(0.077)
    expect(CURRENCY_CONFIG.CHF.decimalPlaces).toBe(2)
  })

  it('has EUR configuration', () => {
    expect(CURRENCY_CONFIG.EUR.code).toBe('EUR')
    expect(CURRENCY_CONFIG.EUR.symbol).toBe('€')
    expect(CURRENCY_CONFIG.EUR.taxRate).toBe(0.19)
  })
})

// ============================================================================
// convertCurrency
// ============================================================================

describe('convertCurrency', () => {
  it('returns same amount for same currency', () => {
    expect(convertCurrency(100, 'CHF', 'CHF')).toBe(100)
    expect(convertCurrency(50, 'EUR', 'EUR')).toBe(50)
  })

  it('converts CHF to EUR', () => {
    const result = convertCurrency(100, 'CHF', 'EUR')
    expect(result).toBe(Math.round(100 * EXCHANGE_RATES.CHF_TO_EUR * 100) / 100)
  })

  it('converts EUR to CHF', () => {
    const result = convertCurrency(100, 'EUR', 'CHF')
    expect(result).toBe(Math.round(100 * EXCHANGE_RATES.EUR_TO_CHF * 100) / 100)
  })

  it('rounds to 2 decimal places', () => {
    const result = convertCurrency(33.33, 'CHF', 'EUR')
    const decimal = result.toString().split('.')[1]
    expect(!decimal || decimal.length <= 2).toBe(true)
  })
})

// ============================================================================
// formatCurrency
// ============================================================================

describe('formatCurrency', () => {
  it('formats CHF amount', () => {
    const formatted = formatCurrency(50, 'CHF')
    expect(formatted).toContain('50')
    expect(formatted).toContain('CHF')
  })

  it('formats EUR amount', () => {
    const formatted = formatCurrency(50, 'EUR', 'de-DE')
    expect(formatted).toContain('50')
  })
})

// ============================================================================
// calculateVAT
// ============================================================================

describe('calculateVAT', () => {
  it('calculates VAT for CHF (7.7%)', () => {
    const result = calculateVAT(100, 'CHF', false)
    expect(result.subtotal).toBe(100)
    expect(result.vat).toBe(7.7)
    expect(result.total).toBe(107.7)
  })

  it('extracts VAT from inclusive amount for CHF', () => {
    const result = calculateVAT(107.7, 'CHF', true)
    expect(result.subtotal).toBe(100)
    expect(result.vat).toBe(7.7)
    expect(result.total).toBe(107.7)
  })

  it('calculates VAT for EUR (19%)', () => {
    const result = calculateVAT(100, 'EUR', false)
    expect(result.subtotal).toBe(100)
    expect(result.vat).toBe(19)
    expect(result.total).toBe(119)
  })

  it('extracts VAT from inclusive EUR amount', () => {
    const result = calculateVAT(119, 'EUR', true)
    expect(result.subtotal).toBe(100)
    expect(result.vat).toBe(19)
    expect(result.total).toBe(119)
  })
})

// ============================================================================
// calculatePaymentFees
// ============================================================================

describe('calculatePaymentFees', () => {
  const provider = { fee_percentage: 0.029, fee_fixed_cents: 30 }

  it('calculates fees for a standard amount', () => {
    const result = calculatePaymentFees(100, provider)
    // fee = 100 * 0.029 + 0.30 = 2.9 + 0.3 = 3.2
    expect(result.fee).toBe(3.2)
    expect(result.total).toBe(103.2)
  })

  it('handles zero amount', () => {
    const result = calculatePaymentFees(0, provider)
    expect(result.fee).toBe(0.3) // Just the fixed fee
    expect(result.total).toBe(0.3)
  })
})

// ============================================================================
// Utility functions
// ============================================================================

describe('isValidCurrency', () => {
  it('returns true for supported currencies', () => {
    expect(isValidCurrency('CHF')).toBe(true)
    expect(isValidCurrency('EUR')).toBe(true)
  })

  it('returns false for unsupported currencies', () => {
    expect(isValidCurrency('USD')).toBe(false)
    expect(isValidCurrency('')).toBe(false)
  })
})

describe('getCurrencyConfig', () => {
  it('returns config for CHF', () => {
    expect(getCurrencyConfig('CHF').code).toBe('CHF')
  })
})

describe('getSupportedCurrencies', () => {
  it('returns all supported currencies', () => {
    const currencies = getSupportedCurrencies()
    expect(currencies).toContain('CHF')
    expect(currencies).toContain('EUR')
    expect(currencies).toHaveLength(2)
  })
})

describe('centsToDecimal', () => {
  it('converts cents to decimal', () => {
    expect(centsToDecimal(100)).toBe(1)
    expect(centsToDecimal(5099)).toBe(50.99)
    expect(centsToDecimal(0)).toBe(0)
  })
})

describe('decimalToCents', () => {
  it('converts decimal to cents', () => {
    expect(decimalToCents(1)).toBe(100)
    expect(decimalToCents(50.99)).toBe(5099)
    expect(decimalToCents(0)).toBe(0)
  })

  it('rounds to nearest cent', () => {
    // 1.005 * 100 = 100.49999... due to IEEE 754, so Math.round gives 100
    expect(decimalToCents(1.005)).toBe(100)
    expect(decimalToCents(1.006)).toBe(101)
    expect(decimalToCents(1.004)).toBe(100)
  })
})

describe('isEuroZone', () => {
  it('returns true for EUR', () => {
    expect(isEuroZone('EUR')).toBe(true)
  })

  it('returns false for CHF', () => {
    expect(isEuroZone('CHF')).toBe(false)
  })
})

describe('getVATRate', () => {
  it('returns 7.7% for CHF', () => {
    expect(getVATRate('CHF')).toBe(0.077)
  })

  it('returns 19% for EUR', () => {
    expect(getVATRate('EUR')).toBe(0.19)
  })

  it('returns same rate for all EUR business types', () => {
    expect(getVATRate('EUR', 'service')).toBe(0.19)
    expect(getVATRate('EUR', 'product')).toBe(0.19)
    expect(getVATRate('EUR', 'digital')).toBe(0.19)
  })
})
