/**
 * SSOT for VAT rates.
 *
 * These were previously declared in five places — `lib/pricing/index.ts`,
 * `lib/payments/tax-compliance.ts`, `lib/payments/currency.ts` (twice), the zod
 * default in `api/invoices/route.ts` and the `payment_transactions.tax_rate`
 * column default — and every copy carried the **pre-2024** Swiss rates. Two
 * files each described themselves as "the SSOT for VAT". Meanwhile
 * `lib/services/payment-webhook.ts` books Kivvi at 8.1%, so the platform issued
 * invoices at one rate and posted the accounting entry at another.
 *
 * Switzerland raised VAT on 2024-01-01 (AHV/IV financing):
 *   standard 7.7% → 8.1% · reduced 2.5% → 2.6% · accommodation 3.7% → 3.8%
 *
 * Historical invoices intentionally keep the rate they were issued at — the
 * stored `tax_rate` column is the record of what was charged, and is not
 * back-filled. Only newly issued documents pick up the current rate.
 */

/** Swiss VAT, current since 2024-01-01. */
export const SWISS_VAT_RATES = {
  /** Most goods and services. */
  standard: 0.081,
  /** Food, books, medicine, … */
  reduced: 0.026,
  /** Accommodation. */
  accommodation: 0.038,
} as const;

/**
 * The standard rate as the percentage STRING external systems expect
 * (Kivvi bookings, invoice line labels). Derived so it can never drift from
 * the number above.
 */
export const SWISS_VAT_STANDARD_PERCENT = (SWISS_VAT_RATES.standard * 100).toFixed(1);

/**
 * Fallback for non-CHF invoicing. The EU has no single rate; this is the
 * simplified default the invoicing path has always used for DE-style billing.
 */
export const EU_VAT_RATES = {
  standard: 0.19,
  reduced: 0.07,
  superReduced: 0.05,
} as const;

export type SwissVatKind = keyof typeof SWISS_VAT_RATES;
