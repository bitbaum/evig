// Tax Compliance & VAT Handling for RevampIT
// Implements Swiss and EU tax regulations for digital services

export type TaxRegime = 'swiss' | 'eu' | 'reverse_charge'

export interface TaxConfig {
  regime: TaxRegime
  country: string
  vatRate: number
  currency: 'CHF' | 'EUR'
  requiresVAT: boolean
  reverseChargeEligible: boolean
  taxId?: string
}

export interface TaxCalculation {
  subtotal: number
  vatAmount: number
  total: number
  vatRate: number
  regime: TaxRegime
  currency: 'CHF' | 'EUR'
  breakdown: {
    taxableAmount: number
    vatExemptAmount: number
    reverseChargeAmount: number
  }
}

// Swiss VAT rates (as of 2024)
export const SWISS_VAT_RATES = {
  standard: 0.077,    // 7.7% for most services
  reduced: 0.025,     // 2.5% for certain goods
  special: 0.035      // 3.7% for accommodation
} as const

// EU VAT rates (simplified - in practice, varies by country)
export const EU_VAT_RATES = {
  standard: 0.19,     // 19% standard rate
  reduced: 0.07,      // 7% reduced rate
  superReduced: 0.05  // 5% super reduced rate
} as const

// Tax configurations by country/region
export const TAX_CONFIGURATIONS: Record<string, TaxConfig> = {
  // Switzerland
  CH: {
    regime: 'swiss',
    country: 'Switzerland',
    vatRate: SWISS_VAT_RATES.standard,
    currency: 'CHF',
    requiresVAT: true,
    reverseChargeEligible: false
  },

  // EU Countries (simplified - each country has different rates)
  DE: {
    regime: 'eu',
    country: 'Germany',
    vatRate: EU_VAT_RATES.standard,
    currency: 'EUR',
    requiresVAT: true,
    reverseChargeEligible: true
  },
  FR: {
    regime: 'eu',
    country: 'France',
    vatRate: EU_VAT_RATES.standard,
    currency: 'EUR',
    requiresVAT: true,
    reverseChargeEligible: true
  },
  AT: {
    regime: 'eu',
    country: 'Austria',
    vatRate: EU_VAT_RATES.standard,
    currency: 'EUR',
    requiresVAT: true,
    reverseChargeEligible: true
  },
  IT: {
    regime: 'eu',
    country: 'Italy',
    vatRate: EU_VAT_RATES.standard,
    currency: 'EUR',
    requiresVAT: true,
    reverseChargeEligible: true
  },
  ES: {
    regime: 'eu',
    country: 'Spain',
    vatRate: EU_VAT_RATES.standard,
    currency: 'EUR',
    requiresVAT: true,
    reverseChargeEligible: true
  },

  // Default for other countries (no VAT)
  DEFAULT: {
    regime: 'swiss',
    country: 'International',
    vatRate: 0,
    currency: 'CHF',
    requiresVAT: false,
    reverseChargeEligible: false
  }
}

/**
 * Determine tax configuration based on customer location
 */
export function getTaxConfig(
  countryCode: string,
  customerType: 'business' | 'consumer' = 'consumer',
  serviceType: 'digital' | 'physical' | 'service' = 'service'
): TaxConfig {
  // Get base configuration
  const config = TAX_CONFIGURATIONS[countryCode] || TAX_CONFIGURATIONS.DEFAULT

  // Apply special rules
  if (config.regime === 'eu' && customerType === 'business' && config.reverseChargeEligible) {
    // EU business-to-business transactions may use reverse charge
    return {
      ...config,
      regime: 'reverse_charge' as TaxRegime,
      vatRate: 0 // No VAT charged, customer accounts for it
    }
  }

  return config
}

/**
 * Calculate taxes for a transaction
 */
export function calculateTaxes(
  amount: number,
  countryCode: string,
  customerType: 'business' | 'consumer' = 'consumer',
  serviceType: 'digital' | 'physical' | 'service' = 'service',
  currency: 'CHF' | 'EUR' = 'CHF'
): TaxCalculation {
  const config = getTaxConfig(countryCode, customerType, serviceType)

  const subtotal = amount
  let vatAmount = 0
  let regime = config.regime

  // Apply tax rules
  if (config.requiresVAT && config.vatRate > 0) {
    if (regime === 'reverse_charge') {
      // Reverse charge: no VAT charged, but tracked
      vatAmount = subtotal * config.vatRate
      regime = 'reverse_charge'
    } else {
      // Standard VAT application
      vatAmount = subtotal * config.vatRate
    }
  }

  const total = subtotal + (regime === 'reverse_charge' ? 0 : vatAmount)

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    vatRate: config.vatRate,
    regime,
    currency,
    breakdown: {
      taxableAmount: subtotal,
      vatExemptAmount: 0,
      reverseChargeAmount: regime === 'reverse_charge' ? vatAmount : 0
    }
  }
}

/**
 * Generate tax-compliant invoice data
 */
export function generateTaxInvoiceData(
  transaction: any,
  customerLocation: { countryCode: string; vatId?: string },
  businessType: 'business' | 'consumer' = 'consumer'
) {
  const taxCalculation = calculateTaxes(
    transaction.amount_cents / 100,
    customerLocation.countryCode,
    businessType,
    'digital', // Assuming digital services for RevampIT
    transaction.currency
  )

  return {
    invoice: {
      subtotal: taxCalculation.subtotal,
      vatAmount: taxCalculation.vatAmount,
      total: taxCalculation.total,
      vatRate: taxCalculation.vatRate,
      currency: taxCalculation.currency,
      taxRegime: taxCalculation.regime,
      taxExempt: taxCalculation.regime === 'reverse_charge'
    },
    compliance: {
      country: customerLocation.countryCode,
      vatId: customerLocation.vatId,
      regime: taxCalculation.regime,
      reverseChargeApplied: taxCalculation.regime === 'reverse_charge',
      vatReportingRequired: taxCalculation.vatAmount > 0
    },
    legal: {
      taxAuthority: getTaxAuthority(customerLocation.countryCode),
      reportingPeriod: getReportingPeriod(customerLocation.countryCode),
      retentionPeriod: 10 // 10 years for Swiss/EU tax records
    }
  }
}

/**
 * Get tax authority for a country
 */
function getTaxAuthority(countryCode: string): string {
  const authorities: Record<string, string> = {
    CH: 'Eidgenössische Steuerverwaltung (ESTV)',
    DE: 'Bundesministerium der Finanzen',
    FR: 'Direction générale des Finances publiques',
    AT: 'Bundesministerium für Finanzen',
    IT: 'Agenzia delle Entrate',
    ES: 'Agencia Tributaria'
  }

  return authorities[countryCode] || 'Local Tax Authority'
}

/**
 * Get tax reporting period for a country
 */
function getReportingPeriod(countryCode: string): string {
  // Most countries require monthly or quarterly VAT returns
  const periods: Record<string, string> = {
    CH: 'Quarterly', // Switzerland: quarterly for small businesses
    DE: 'Monthly',
    FR: 'Monthly',
    AT: 'Monthly',
    IT: 'Monthly',
    ES: 'Monthly'
  }

  return periods[countryCode] || 'Monthly'
}

/**
 * Validate VAT ID format (basic validation)
 */
export function validateVATId(vatId: string, countryCode: string): boolean {
  if (!vatId) return false

  // Basic format validation (simplified)
  const patterns: Record<string, RegExp> = {
    CH: /^CHE-\d{3}\.\d{3}\.\d{3}$/, // Swiss VAT format
    DE: /^DE\d{9}$/, // German VAT format
    FR: /^FR\d{11}$/, // French VAT format (simplified)
    AT: /^ATU\d{8}$/, // Austrian VAT format
    IT: /^IT\d{11}$/, // Italian VAT format
    ES: /^[A-Z]\d{8}$/ // Spanish VAT format (simplified)
  }

  const pattern = patterns[countryCode]
  return pattern ? pattern.test(vatId) : false
}

/**
 * Generate tax report data for accounting
 */
export function generateTaxReport(
  transactions: any[],
  period: { start: Date; end: Date },
  countryCode: string = 'CH'
) {
  const report = {
    period: {
      start: period.start.toISOString().split('T')[0],
      end: period.end.toISOString().split('T')[0]
    },
    country: countryCode,
    summary: {
      totalTransactions: transactions.length,
      totalAmount: 0,
      totalVAT: 0,
      currency: 'CHF'
    },
    transactions: [] as any[],
    compliance: {
      reportingRequired: true,
      deadline: calculateReportingDeadline(period.end, countryCode),
      authority: getTaxAuthority(countryCode)
    }
  }

  transactions.forEach(transaction => {
    const taxData = generateTaxInvoiceData(
      transaction,
      { countryCode, vatId: transaction.customerVatId },
      transaction.customerType || 'consumer'
    )

    report.summary.totalAmount += taxData.invoice.subtotal
    report.summary.totalVAT += taxData.invoice.vatAmount

    report.transactions.push({
      id: transaction.id,
      date: transaction.created_at,
      amount: taxData.invoice.subtotal,
      vat: taxData.invoice.vatAmount,
      total: taxData.invoice.total,
      regime: taxData.compliance.regime,
      customerCountry: countryCode
    })
  })

  report.summary.totalAmount = Math.round(report.summary.totalAmount * 100) / 100
  report.summary.totalVAT = Math.round(report.summary.totalVAT * 100) / 100

  return report
}

/**
 * Calculate tax reporting deadline
 */
function calculateReportingDeadline(periodEnd: Date, countryCode: string): string {
  const deadline = new Date(periodEnd)

  // Add reporting period (typically 30-90 days after period end)
  const daysToAdd = countryCode === 'CH' ? 60 : 30 // Switzerland has longer deadline
  deadline.setDate(deadline.getDate() + daysToAdd)

  return deadline.toISOString().split('T')[0]
}

/**
 * Check if transaction requires tax reporting
 */
export function requiresTaxReporting(
  transaction: any,
  customerCountry: string
): boolean {
  // EU digital services require reporting regardless of customer location
  if (transaction.serviceType === 'digital' && isEUCountry(customerCountry)) {
    return true
  }

  // Swiss transactions always require reporting
  if (customerCountry === 'CH') {
    return true
  }

  // High-value transactions may require reporting
  if (transaction.amount_cents / 100 > 1000) {
    return true
  }

  return false
}

/**
 * Check if country is in EU
 */
function isEUCountry(countryCode: string): boolean {
  const euCountries = ['DE', 'FR', 'AT', 'IT', 'ES', 'BE', 'NL', 'LU', 'DK', 'SE', 'FI', 'PT', 'IE', 'GR', 'PL', 'CZ', 'HU', 'SI', 'SK', 'EE', 'LV', 'LT', 'MT', 'CY', 'HR', 'BG', 'RO']
  return euCountries.includes(countryCode)
}