/**
 * UI Color Configuration
 *
 * SSOT for colors used across the application.
 * Import from here instead of hardcoding hex values in components.
 *
 * NOT included here (acceptable hardcoded):
 * - Social media brand colors (ShareButtons.tsx)
 * - Media logos (AsSeenInLogos.tsx)
 * - Stripe theme colors (StripeCheckout.tsx, WorkshopRegistrationForm.tsx)
 */

/** Revenue category colors used in financial charts */
export const REVENUE_CATEGORY_COLORS = {
  warenverkauf: '#22c55e',
  dienstleistungen: '#3b82f6',
  integration: '#8b5cf6',
  spenden: '#f59e0b',
  aufstockung: '#ec4899',
} as const

/** Revenue category labels (German) */
export const REVENUE_CATEGORY_LABELS = {
  warenverkauf: 'Warenverkauf',
  dienstleistungen: 'Dienstleistungen',
  integration: 'Integration',
  spenden: 'Spenden',
  aufstockung: 'Aufstockung',
} as const

/** Product condition status colors (factsheet, product display) */
export const CONDITION_COLORS: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'Neu', color: '#059669', bgColor: '#D1FAE5' },
  like_new: { label: 'Wie neu', color: '#059669', bgColor: '#D1FAE5' },
  good: { label: 'Gut', color: '#2563EB', bgColor: '#DBEAFE' },
  fair: { label: 'Akzeptabel', color: '#D97706', bgColor: '#FEF3C7' },
  poor: { label: 'Gebraucht', color: '#DC2626', bgColor: '#FEE2E2' },
  damaged: { label: 'Beschädigt', color: '#DC2626', bgColor: '#FEE2E2' },
}

/** Trend chart colors for year-over-year comparison */
export const TREND_CHART_COLORS = {
  previousYear: '#9ca3af',
  currentYear: '#3b82f6',
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#3b82f6',
} as const

/** Default color palette for pickers and category assignment */
export const UI_COLOR_PALETTE = [
  '#22c55e', '#3b82f6', '#06b6d4', '#8b5cf6', '#f97316',
  '#6b7280', '#ec4899', '#f59e0b', '#14b8a6', '#ef4444',
] as const
