/**
 * Design System Tokens — SSOT for visual design
 *
 * Philosophy (xAI-inspired, RevampIT green):
 * - Dark-first: near-black surfaces, ultra-subtle borders
 * - Color appears in focused moments only: CTAs, icon accents
 * - Primary action = brand green (always)
 * - Secondary = ghost/outline (neutral, dark-aware)
 * - Single-accent icon system: brand green only (orange retired from chrome)
 * - No rainbow per-section colors
 */

// Unified button classes — same across all themes for visual discipline
const PRIMARY_BTN =
  'bg-action hover:bg-action-hover text-action-text'

const SECONDARY_BTN =
  'border-subtle text-text-secondary hover:bg-surface-raised'

const FOCUS_GREEN = 'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-action'

// Single-accent icon badge system — green only. Orange is retired from chrome:
// brand green is the sole accent, and commerce sections (marketplace, workshops,
// repairers) no longer carry a separate orange identity. Keeps the chrome
// monochrome; color is reserved for action + true semantics.
const GREEN_BADGE = { bg: 'bg-action-muted', text: 'text-action' }

// Hover accent — matches the badge system (green only).
const GREEN_HOVER = 'group-hover:text-action'

// Section keys — SSOT list of public section identities. Theming is uniform
// (a single green accent), so the maps below are generated from this list
// rather than repeating an identical entry per section.
export const SECTION_KEYS = [
  'marketplace', 'itHilfe', 'services', 'about', 'contact', 'getInvolved',
  'workshops', 'blog', 'faq', 'space', 'projects', 'repairers', 'knowhow', 'home',
] as const

export type ThemeKey = (typeof SECTION_KEYS)[number]

/** Build a uniform per-section map from one value (every section shares it). */
const bySection = <T>(value: T): Record<ThemeKey, T> =>
  Object.fromEntries(SECTION_KEYS.map((k) => [k, value])) as Record<ThemeKey, T>

// Icon badges, buttons, focus rings, and card-hover are brand-green only and
// uniform across every section (no rainbow, no per-section colors). Generated
// from SECTION_KEYS, so theming behaviour has exactly one place to change.
export const DESIGN_TOKENS = {
  iconBadges: bySection(GREEN_BADGE),
  buttons: {
    primary: bySection(PRIMARY_BTN),
    secondary: bySection(SECONDARY_BTN),
  },
  focusOutline: bySection(FOCUS_GREEN),
  cards: {
    hoverText: bySection(GREEN_HOVER),
    border: {
      default:  'border-subtle',
      featured: 'border-action/30 ring-1 ring-action/20',
    },
  },
} as const
