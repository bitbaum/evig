/**
 * Pricing Module — SSOT for payment calculations
 *
 * All payment fees, VAT rates, and pricing logic lives here.
 * Components and hooks import from this module — never hardcode rates.
 */

/** Swiss VAT rate (7.7%) */
export const VAT_RATE_CHF = 0.077

/** Default VAT rate for non-CHF currencies */
export const VAT_RATE_DEFAULT = 0.19

/** Payment processor fee percentage (Payrexx) */
export const PAYMENT_FEE_PERCENTAGE = 0.029

/** Payment processor fixed fee in base currency units */
export const PAYMENT_FEE_FIXED = 0.30

/**
 * Get VAT rate for a given currency.
 */
export function getVATRate(currency: string): number {
  return currency === 'CHF' ? VAT_RATE_CHF : VAT_RATE_DEFAULT
}

/**
 * Get VAT rate as display string (e.g., "7.7").
 */
export function getVATRateLabel(currency: string): string {
  return currency === 'CHF' ? '7.7' : '19.0'
}

/**
 * Calculate VAT amount on a subtotal.
 */
export function calculateVAT(subtotal: number, currency: string = 'CHF'): number {
  return subtotal * getVATRate(currency)
}

/**
 * Calculate payment processor fees.
 */
export function calculatePaymentFees(amount: number): number {
  return amount * PAYMENT_FEE_PERCENTAGE + PAYMENT_FEE_FIXED
}

/**
 * Calculate total including VAT and payment fees.
 */
export function calculateTotalWithFees(subtotal: number, currency: string = 'CHF'): number {
  const vat = calculateVAT(subtotal, currency)
  const subtotalWithVat = subtotal + vat
  return subtotalWithVat + calculatePaymentFees(subtotalWithVat)
}

/**
 * Calculate display pricing from a service price in cents.
 */
export function calculateServicePricing(priceCents: number, currency: string = 'CHF') {
  const subtotal = priceCents / 100
  const vat = calculateVAT(subtotal, currency)
  const total = subtotal + vat + calculatePaymentFees(subtotal)
  return { subtotal, vat, total }
}
