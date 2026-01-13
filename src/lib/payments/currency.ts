// Currency utilities for RevampIT payment processing
// Supports CHF (Swiss Franc) and EUR (Euro) with automatic conversion

export type SupportedCurrency = 'CHF' | 'EUR'

export interface CurrencyConfig {
  code: SupportedCurrency
  symbol: string
  name: string
  decimalPlaces: number
  taxRate: number // VAT rate for this currency
}

export interface ServicePricing {
  originalPrice: number
  originalCurrency: SupportedCurrency
  convertedPrice: number
  convertedCurrency: SupportedCurrency
  vat: number
  total: number
}

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyConfig> = {
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimalPlaces: 2,
    taxRate: 0.077 // 7.7% Swiss VAT
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    taxRate: 0.19 // 19% EU VAT (standard rate)
  }
}

// Current exchange rates (in production, these should come from a reliable API)
// CHF to EUR conversion rate (approximate, should be updated regularly)
export const EXCHANGE_RATES = {
  'CHF_TO_EUR': 0.93, // 1 CHF = 0.93 EUR
  'EUR_TO_CHF': 1.075 // 1 EUR = 1.075 CHF
} as const

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // For now, use static rates. In production, integrate with currency API
  if (fromCurrency === 'CHF' && toCurrency === 'EUR') {
    return Math.round(amount * EXCHANGE_RATES.CHF_TO_EUR * 100) / 100
  } else if (fromCurrency === 'EUR' && toCurrency === 'CHF') {
    return Math.round(amount * EXCHANGE_RATES.EUR_TO_CHF * 100) / 100
  }

  throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`)
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  locale: string = 'de-CH'
): string {
  const config = CURRENCY_CONFIG[currency]

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces
  }).format(amount)
}

/**
 * Calculate VAT for an amount
 */
export function calculateVAT(
  amount: number,
  currency: SupportedCurrency,
  includeVAT: boolean = true
): { subtotal: number; vat: number; total: number } {
  const config = CURRENCY_CONFIG[currency]
  const subtotal = includeVAT ? amount / (1 + config.taxRate) : amount
  const vat = subtotal * config.taxRate
  const total = subtotal + vat

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

/**
 * Calculate payment provider fees
 */
export function calculatePaymentFees(
  amount: number,
  provider: {
    fee_percentage: number
    fee_fixed_cents: number
  }
): { fee: number; total: number } {
  const feePercentage = amount * provider.fee_percentage
  const feeFixed = provider.fee_fixed_cents / 100
  const fee = Math.round((feePercentage + feeFixed) * 100) / 100
  const total = Math.round((amount + fee) * 100) / 100

  return { fee, total }
}

/**
 * Get currency-specific pricing for services
 */
export function getServicePricing(
  basePriceCHF: number,
  requestedCurrency: SupportedCurrency
): {
  originalPrice: number
  originalCurrency: SupportedCurrency
  convertedPrice: number
  convertedCurrency: SupportedCurrency
  vat: number
  total: number
} {
  const originalPrice = basePriceCHF
  const originalCurrency = 'CHF' as SupportedCurrency
  const convertedPrice = requestedCurrency === 'CHF' ? basePriceCHF : convertCurrency(basePriceCHF, 'CHF', requestedCurrency)
  const convertedCurrency = requestedCurrency

  const { subtotal, vat, total } = calculateVAT(convertedPrice, requestedCurrency)

  return {
    originalPrice,
    originalCurrency,
    convertedPrice: subtotal,
    convertedCurrency,
    vat,
    total
  }
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return currency in CURRENCY_CONFIG
}

/**
 * Get currency config
 */
export function getCurrencyConfig(currency: SupportedCurrency): CurrencyConfig {
  return CURRENCY_CONFIG[currency]
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): SupportedCurrency[] {
  return Object.keys(CURRENCY_CONFIG) as SupportedCurrency[]
}

/**
 * Format amount in cents to decimal
 */
export function centsToDecimal(cents: number): number {
  return cents / 100
}

/**
 * Format decimal to cents
 */
export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100)
}

/**
 * Check if currency is Euro-based (for EU VAT compliance)
 */
export function isEuroZone(currency: SupportedCurrency): boolean {
  return currency === 'EUR'
}

/**
 * Get appropriate VAT rate for business type
 */
export function getVATRate(
  currency: SupportedCurrency,
  businessType: 'service' | 'product' | 'digital' = 'service'
): number {
  // Swiss VAT is 7.7% for most services
  // EU VAT varies by service type and country
  if (currency === 'CHF') {
    return 0.077 // Swiss VAT
  } else if (currency === 'EUR') {
    // EU standard VAT rates
    switch (businessType) {
      case 'service':
        return 0.19 // 19% standard rate
      case 'product':
        return 0.19 // 19% standard rate
      case 'digital':
        return 0.19 // 19% for digital services
      default:
        return 0.19
    }
  }

  return 0
}