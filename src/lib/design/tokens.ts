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

export const DESIGN_TOKENS = {
  // Icon badges — brand green only. No rainbow, no per-section colors.
  // (Every section maps to the same green badge — kept as a per-section map
  // for API stability; a future DRY pass can collapse this to a constant.)
  iconBadges: {
    marketplace: GREEN_BADGE,
    itHilfe:     GREEN_BADGE,
    services:    GREEN_BADGE,
    about:       GREEN_BADGE,
    contact:     GREEN_BADGE,
    getInvolved: GREEN_BADGE,
    workshops:   GREEN_BADGE,
    blog:        GREEN_BADGE,
    faq:         GREEN_BADGE,
    space:       GREEN_BADGE,
    projects:    GREEN_BADGE,
    repairers:   GREEN_BADGE,
    knowhow:     GREEN_BADGE,
    home:        GREEN_BADGE,
  },

  buttons: {
    // All primary buttons → brand green. Consistent. Unmistakably RevampIT.
    primary: {
      marketplace: PRIMARY_BTN,
      itHilfe:     PRIMARY_BTN,
      services:    PRIMARY_BTN,
      about:       PRIMARY_BTN,
      contact:     PRIMARY_BTN,
      getInvolved: PRIMARY_BTN,
      workshops:   PRIMARY_BTN,
      blog:        PRIMARY_BTN,
      faq:         PRIMARY_BTN,
      space:       PRIMARY_BTN,
      projects:    PRIMARY_BTN,
      repairers:   PRIMARY_BTN,
      knowhow:     PRIMARY_BTN,
      home:        PRIMARY_BTN,
    },
    // All secondary buttons → ghost outline. Clean, dark-aware.
    secondary: {
      marketplace: SECONDARY_BTN,
      itHilfe:     SECONDARY_BTN,
      services:    SECONDARY_BTN,
      about:       SECONDARY_BTN,
      contact:     SECONDARY_BTN,
      getInvolved: SECONDARY_BTN,
      workshops:   SECONDARY_BTN,
      blog:        SECONDARY_BTN,
      faq:         SECONDARY_BTN,
      space:       SECONDARY_BTN,
      projects:    SECONDARY_BTN,
      repairers:   SECONDARY_BTN,
      knowhow:     SECONDARY_BTN,
      home:        SECONDARY_BTN,
    },
  },

  focusOutline: {
    marketplace: FOCUS_GREEN,
    itHilfe:     FOCUS_GREEN,
    services:    FOCUS_GREEN,
    about:       FOCUS_GREEN,
    contact:     FOCUS_GREEN,
    getInvolved: FOCUS_GREEN,
    workshops:   FOCUS_GREEN,
    blog:        FOCUS_GREEN,
    faq:         FOCUS_GREEN,
    space:       FOCUS_GREEN,
    projects:    FOCUS_GREEN,
    repairers:   FOCUS_GREEN,
    knowhow:     FOCUS_GREEN,
    home:        FOCUS_GREEN,
  },

  cards: {
    hoverText: {
      marketplace: GREEN_HOVER,
      itHilfe:     GREEN_HOVER,
      services:    GREEN_HOVER,
      about:       GREEN_HOVER,
      contact:     GREEN_HOVER,
      getInvolved: GREEN_HOVER,
      workshops:   GREEN_HOVER,
      blog:        GREEN_HOVER,
      faq:         GREEN_HOVER,
      space:       GREEN_HOVER,
      projects:    GREEN_HOVER,
      repairers:   GREEN_HOVER,
      knowhow:     GREEN_HOVER,
      home:        GREEN_HOVER,
    },
    border: {
      default:  'border-subtle',
      featured: 'border-action/30 ring-1 ring-action/20',
    },
  },
} as const

export type ThemeKey = keyof typeof DESIGN_TOKENS.iconBadges
