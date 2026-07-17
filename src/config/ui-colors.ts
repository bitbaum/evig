/**
 * UI Color Configuration
 *
 * SSOT for colors used across the application.
 * Import from here instead of hardcoding hex values in components.
 *
 * NOT included here (acceptable hardcoded):
 * - Social media brand colors (ShareButtons.tsx)
 * - Media logos (AsSeenInLogos.tsx)
 * - Payment provider theme colors
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

/** Default blog/content category color */
export const DEFAULT_CATEGORY_COLOR = UI_COLOR_PALETTE[0]

/** Open Graph image colors */
export const OG_IMAGE_COLORS = {
  backgroundGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
  heading: '#111827',
  accent: '#16a34a',
  body: '#4b5563',
  meta: '#9ca3af',
} as const

/** Fallback product condition colors */
export const PRODUCT_CONDITION_FALLBACK_COLORS = {
  color: '#6B7280',
  bgColor: '#F3F4F6',
} as const

/** Element-selection overlay colors for the feedback UI */
export const ELEMENT_SELECTION_COLORS = {
  outline: 'rgba(59, 130, 246, 0.5)',
  overlay: 'rgba(59,130,246,0.06)',
  border: '#3b82f6',
  badge: '#3b82f6',
} as const

/** Feedback scope accent colors */
export const FEEDBACK_SCOPE_COLORS = {
  site: '#7c3aed',
  page: '#16a34a',
  element: '#2563eb',
} as const

/** Shared decorative hero background pattern */
export const HERO_PATTERN_BACKGROUND =
  'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)'

/** Global error page inline colors */
export const GLOBAL_ERROR_COLORS = {
  pageBg: '#f9fafb',
  heading: '#111827',
  body: '#4b5563',
  primary: '#16a34a',
  white: '#fff',
  secondaryText: '#374151',
  border: '#d1d5db',
} as const

/** Inline email block colors */
export const EMAIL_INLINE_COLORS = {
  mutedBlockBg: '#f9f9f9',
} as const

/** Standalone newsletter-confirmation HTML cannot consume CSS variables. */
export const NEWSLETTER_CONFIRMATION_COLORS = {
  success: '#22c55e',
  error: '#dc2626',
  body: '#333333',
  page: '#fafafa',
  surface: '#ffffff',
  muted: '#666666',
  border: '#e5e5e5',
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const

/** Decorative monitor-lamp SVG palette (non-UI illustration asset). */
export const MONITOR_LAMP_PLACEHOLDER_COLORS = {
  functional: { from: '#1f2937', to: '#0a0a0a', glow: '#f5f5f4' },
  warm: { from: '#3b2415', to: '#1c0f06', glow: '#fbbf24' },
  cool: { from: '#0e3a3a', to: '#062029', glow: '#7dd3fc' },
  art: { from: '#3b0764', to: '#1e1b4b', glow: '#f0abfc' },
  bezel: '#0a0a0a',
  stand: '#1c1917',
  highlight: '#ffffff',
} as const

/** Screen preview shadow for printable A4 pages */
export const PRINT_PREVIEW_SHADOW =
  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'

/** Customer profile badge colors */
export const CUSTOMER_PROFILE_COLORS = {
  oma: '#EC4899',
  buero: '#3B82F6',
  chiller: '#8B5CF6',
  student: '#06B6D4',
  gamer: '#EF4444',
  dev: '#10B981',
  kreativ: '#F59E0B',
  musik: '#7C3AED',
  grafiker: '#D946EF',
  video: '#DC2626',
} as const
