/**
 * Pricing Module — payment fee and total calculations.
 *
 * Components and hooks import from this module — never hardcode rates.
 * VAT rates are NOT defined here: they live in @/config/tax. This file used to
 * declare its own `VAT_RATE_CHF = 0.077` while calling itself the SSOT, which is
 * how the platform ended up issuing invoices at the pre-2024 rate.
 */

import { SWISS_VAT_RATES, EU_VAT_RATES, SWISS_VAT_STANDARD_PERCENT } from '@/config/tax'

/** Swiss VAT rate — SSOT: @/config/tax (8.1% since 2024-01-01). */
export const VAT_RATE_CHF = SWISS_VAT_RATES.standard

/** Default VAT rate for non-CHF currencies. */
export const VAT_RATE_DEFAULT = EU_VAT_RATES.standard

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
  // Derived, not typed: this string is printed on invoices, so a literal here
  // would show customers a different rate than the one actually charged.
  return currency === 'CHF'
    ? SWISS_VAT_STANDARD_PERCENT
    : (EU_VAT_RATES.standard * 100).toFixed(1)
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
 * Format an integer cents value as CHF with no decimal places (e.g. 1200 → "CHF 12").
 * Use for hourly rates and workshop prices where fractional cents don't apply.
 */
export function formatCentsToChf(cents: number): string {
  return `CHF ${Math.round(cents / 100)}`
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
