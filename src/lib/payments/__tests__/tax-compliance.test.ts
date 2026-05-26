/**
 * Tests for tax-compliance.ts
 *
 * Tests Swiss VAT calculations, EU VAT, reverse charge, tax reporting,
 * and VAT ID validation.
 */

import {
  SWISS_VAT_RATES,
  EU_VAT_RATES,
  TAX_CONFIGURATIONS,
  getTaxConfig,
  calculateTaxes,
  generateTaxInvoiceData,
  validateVATId,
  generateTaxReport,
  requiresTaxReporting,
} from '../tax-compliance'

// ============================================================================
// Constants
// ============================================================================

describe('VAT rate constants', () => {
  it('has correct Swiss VAT rates', () => {
    expect(SWISS_VAT_RATES.standard).toBe(0.077)
    expect(SWISS_VAT_RATES.reduced).toBe(0.025)
    expect(SWISS_VAT_RATES.special).toBe(0.035)
  })

  it('has correct EU VAT rates', () => {
    expect(EU_VAT_RATES.standard).toBe(0.19)
    expect(EU_VAT_RATES.reduced).toBe(0.07)
  })
})

describe('TAX_CONFIGURATIONS', () => {
  it('has Swiss configuration', () => {
    expect(TAX_CONFIGURATIONS.CH.regime).toBe('swiss')
    expect(TAX_CONFIGURATIONS.CH.vatRate).toBe(SWISS_VAT_RATES.standard)
    expect(TAX_CONFIGURATIONS.CH.currency).toBe('CHF')
  })

  it('has German configuration', () => {
    expect(TAX_CONFIGURATIONS.DE.regime).toBe('eu')
    expect(TAX_CONFIGURATIONS.DE.vatRate).toBe(EU_VAT_RATES.standard)
    expect(TAX_CONFIGURATIONS.DE.reverseChargeEligible).toBe(true)
  })

  it('has DEFAULT for unknown countries', () => {
    expect(TAX_CONFIGURATIONS.DEFAULT.vatRate).toBe(0)
    expect(TAX_CONFIGURATIONS.DEFAULT.requiresVAT).toBe(false)
  })
})

// ============================================================================
// getTaxConfig
// ============================================================================

describe('getTaxConfig', () => {
  it('returns Swiss config for CH', () => {
    const config = getTaxConfig('CH')
    expect(config.regime).toBe('swiss')
    expect(config.vatRate).toBe(0.077)
  })

  it('returns EU config for DE consumer', () => {
    const config = getTaxConfig('DE', 'consumer')
    expect(config.regime).toBe('eu')
    expect(config.vatRate).toBe(0.19)
  })

  it('applies reverse charge for EU business', () => {
    const config = getTaxConfig('DE', 'business')
    expect(config.regime).toBe('reverse_charge')
    expect(config.vatRate).toBe(0)
  })

  it('returns default for unknown country', () => {
    const config = getTaxConfig('XX')
    expect(config.vatRate).toBe(0)
  })

  it('does not apply reverse charge for Swiss business', () => {
    const config = getTaxConfig('CH', 'business')
    expect(config.regime).toBe('swiss')
    expect(config.vatRate).toBe(0.077)
  })
})

// ============================================================================
// calculateTaxes
// ============================================================================

describe('calculateTaxes', () => {
  it('calculates Swiss VAT correctly', () => {
    const result = calculateTaxes(100, 'CH')
    expect(result.subtotal).toBe(100)
    expect(result.vatAmount).toBe(7.7)
    expect(result.total).toBe(107.7)
    expect(result.regime).toBe('swiss')
  })

  it('calculates EU VAT correctly', () => {
    const result = calculateTaxes(100, 'DE', 'consumer')
    expect(result.subtotal).toBe(100)
    expect(result.vatAmount).toBe(19)
    expect(result.total).toBe(119)
  })

  it('applies reverse charge (no VAT added to total)', () => {
    const result = calculateTaxes(100, 'DE', 'business')
    expect(result.regime).toBe('reverse_charge')
    expect(result.vatAmount).toBe(0) // vatRate is 0 for reverse charge
    expect(result.total).toBe(100) // No VAT added
  })

  it('handles zero VAT for unknown country', () => {
    const result = calculateTaxes(100, 'XX')
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(100)
  })

  it('rounds to 2 decimal places', () => {
    // 33.33 * 0.077 = 2.56641
    const result = calculateTaxes(33.33, 'CH')
    expect(result.vatAmount).toBe(2.57)
    expect(result.total).toBe(35.9)
  })
})

// ============================================================================
// validateVATId
// ============================================================================

describe('validateVATId', () => {
  it('validates Swiss VAT ID format', () => {
    expect(validateVATId('CHE-123.456.789', 'CH')).toBe(true)
    expect(validateVATId('CHE-ABC.DEF.GHI', 'CH')).toBe(false)
    expect(validateVATId('', 'CH')).toBe(false)
  })

  it('validates German VAT ID format', () => {
    expect(validateVATId('DE123456789', 'DE')).toBe(true)
    expect(validateVATId('DE12345', 'DE')).toBe(false)
  })

  it('validates Austrian VAT ID format', () => {
    expect(validateVATId('ATU12345678', 'AT')).toBe(true)
    expect(validateVATId('AT12345678', 'AT')).toBe(false)
  })

  it('returns false for unknown country', () => {
    expect(validateVATId('XX12345', 'XX')).toBe(false)
  })
})

// ============================================================================
// generateTaxInvoiceData
// ============================================================================

describe('generateTaxInvoiceData', () => {
  it('generates invoice data for Swiss consumer', () => {
    const transaction = {
      id: 'txn-1',
      amount_cents: 10000,
      currency: 'CHF' as const,
      created_at: '2024-01-15',
    }

    const result = generateTaxInvoiceData(transaction, { countryCode: 'CH' })

    expect(result.invoice.subtotal).toBe(100)
    expect(result.invoice.vatRate).toBe(0.077)
    expect(result.invoice.taxRegime).toBe('swiss')
    expect(result.compliance.reverseChargeApplied).toBe(false)
    expect(result.legal.retentionPeriod).toBe(10)
  })

  it('generates invoice data for EU business (reverse charge)', () => {
    const transaction = {
      id: 'txn-2',
      amount_cents: 20000,
      currency: 'EUR' as const,
      created_at: '2024-01-15',
    }

    const result = generateTaxInvoiceData(
      transaction,
      { countryCode: 'DE', vatId: 'DE123456789' },
      'business'
    )

    expect(result.invoice.taxExempt).toBe(true)
    expect(result.compliance.reverseChargeApplied).toBe(true)
    expect(result.compliance.vatId).toBe('DE123456789')
  })
})

// ============================================================================
// requiresTaxReporting
// ============================================================================

describe('requiresTaxReporting', () => {
  it('requires reporting for Swiss transactions', () => {
    const txn = { id: '1', amount_cents: 100, currency: 'CHF' as const, created_at: '2024-01-01' }
    expect(requiresTaxReporting(txn, 'CH')).toBe(true)
  })

  it('requires reporting for EU digital services', () => {
    const txn = { id: '2', amount_cents: 100, currency: 'EUR' as const, created_at: '2024-01-01', serviceType: 'digital' as const }
    expect(requiresTaxReporting(txn, 'DE')).toBe(true)
  })

  it('requires reporting for high-value transactions', () => {
    const txn = { id: '3', amount_cents: 200000, currency: 'CHF' as const, created_at: '2024-01-01' }
    expect(requiresTaxReporting(txn, 'XX')).toBe(true) // >1000 CHF
  })

  it('does not require reporting for small non-EU non-CH transactions', () => {
    const txn = { id: '4', amount_cents: 100, currency: 'CHF' as const, created_at: '2024-01-01' }
    expect(requiresTaxReporting(txn, 'US')).toBe(false)
  })
})

// ============================================================================
// generateTaxReport
// ============================================================================

describe('generateTaxReport', () => {
  it('generates a report for Swiss transactions', () => {
    const transactions = [
      { id: '1', amount_cents: 10000, currency: 'CHF' as const, created_at: '2024-01-15' },
      { id: '2', amount_cents: 5000, currency: 'CHF' as const, created_at: '2024-02-01' },
    ]

    const report = generateTaxReport(
      transactions,
      { start: '2024-01-01', end: '2024-03-31' },
      'CH'
    )

    expect(report.summary.totalTransactions).toBe(2)
    expect(report.summary.totalAmount).toBeGreaterThan(0)
    expect(report.transactions).toHaveLength(2)
    expect(report.compliance.reportingRequired).toBe(true)
  })

  it('uses period string boundaries verbatim for display (no UTC conversion that drifted year-end transactions)', () => {
    // Regression: prior signature was period: { start: Date; end: Date }
    // and the function did `period.end.toISOString().split('T')[0]` which
    // produced UTC dates. A Swiss-local January 2026 monthly report
    // (Swiss midnight Jan 1 = 23:00 UTC Dec 31 in winter) displayed the
    // start as "2025-12-31" — wrong. Now the function accepts already-
    // formatted Swiss-local YYYY-MM-DD strings and displays them as-is.
    const report = generateTaxReport(
      [],
      { start: '2026-01-01', end: '2026-01-31' },
      'CH',
    )
    expect(report.period.start).toBe('2026-01-01')
    expect(report.period.end).toBe('2026-01-31')
  })

  it('computes the CH reporting deadline 60 calendar days after period end', () => {
    // Reporting-deadline math used to receive a Date and use setDate +
    // toISOString. Now it parses YYYY-MM-DD and uses Date.UTC for pure
    // calendar arithmetic — no host-tz interference. Jan 31 + 60 days
    // = April 1 (2024 leap year: 31 + 60 = 91st day = March 31; 2026
    // non-leap: 31 + 60 = 91 = April 1).
    const report = generateTaxReport(
      [],
      { start: '2026-01-01', end: '2026-01-31' },
      'CH',
    )
    // 2026 is non-leap: Jan(31) + 60d = day 91 = Apr 1
    expect(report.compliance.deadline).toBe('2026-04-01')
  })

  it('computes the non-CH reporting deadline 30 calendar days after period end', () => {
    const report = generateTaxReport(
      [],
      { start: '2026-01-01', end: '2026-01-31' },
      'DE',
    )
    // Jan 31 + 30d = March 2 (Jan 31 + 30 days = day 61 = Mar 2 in 2026)
    expect(report.compliance.deadline).toBe('2026-03-02')
  })
})
