/**
 * Payment Fee Calculations
 *
 * Pure functions for computing payment processing fees and VAT.
 * No database or API calls — only math.
 */

import { SWISS_VAT_RATES } from '@/lib/payments/tax-compliance'
import type { SupportedCurrency } from '@/lib/payments/currency'

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CURRENCY: SupportedCurrency = 'CHF'
export const DEFAULT_AUTO_RELEASE_DAYS = 7

// ============================================================================
// Types
// ============================================================================

export interface PaymentProvider {
  id: string
  slug: string
  fee_percentage: number
  fee_fixed_cents: number
}

export interface FeeCalculation {
  baseAmountCents: number
  feeCents: number
  totalAmountCents: number
  currency: SupportedCurrency
}

// ============================================================================
// Fee Calculations
// ============================================================================

/**
 * Calculate payment fees based on provider configuration
 */
export function calculateFees(
  baseAmountCents: number,
  provider: PaymentProvider,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): FeeCalculation {
  const feeCents = Math.round(baseAmountCents * (provider.fee_percentage / 100)) + provider.fee_fixed_cents
  const totalAmountCents = baseAmountCents + feeCents

  return {
    baseAmountCents,
    feeCents,
    totalAmountCents,
    currency
  }
}

/**
 * Calculate VAT for Swiss transactions
 */
export function calculateSwissVAT(baseAmountCents: number): number {
  return Math.round(baseAmountCents * SWISS_VAT_RATES.standard)
}

/**
 * Convert cents to display amount
 */
export function centsToDisplay(cents: number): number {
  return cents / 100
}
