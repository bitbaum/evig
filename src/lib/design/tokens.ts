/**
 * Design System Tokens — SSOT for visual design
 *
 * Philosophy (xAI-inspired with RevampIT green + orange):
 * - Dark-first: near-black surfaces, ultra-subtle borders
 * - Color appears in focused moments only: CTAs, icon accents
 * - Primary action = brand green (always)
 * - Secondary = ghost/outline (neutral, dark-aware)
 * - Orange reserved for marketplace-specific contexts
 * - Rainbow per-section button colours eliminated
 */

// Unified button classes — same across all themes for visual discipline
const PRIMARY_BTN =
  'bg-primary-600 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400'

const SECONDARY_BTN =
  'border-neutral-300 dark:border-white/[0.1] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.06]'

const FOCUS_GREEN = 'focus-visible:outline-primary-600'

export const DESIGN_TOKENS = {
  gradients: {
    marketplace: 'from-orange-50 to-warning-50',
    itHilfe: 'from-emerald-50 to-primary-50',
    services: 'from-blue-50 to-indigo-50',
    about: 'from-primary-50 to-teal-50',
    contact: 'from-neutral-50 to-slate-50',
    getInvolved: 'from-purple-50 to-pink-50',
    workshops: 'from-warning-50 to-orange-50',
    blog: 'from-rose-50 to-pink-50',
    faq: 'from-sky-50 to-blue-50',
    space: 'from-teal-50 to-cyan-50',
    projects: 'from-indigo-50 to-violet-50',
    repairers: 'from-warning-50 to-warning-50',
    knowhow: 'from-cyan-50 to-sky-50',
    home: 'from-emerald-50 to-teal-50',
  },

  // Icon badges — section-tinted in light mode, TWO brand colors only in dark mode.
  // Dark: green = brand identity, orange = marketplace/commerce identity. No rainbow.
  iconBadges: {
    marketplace: { bg: 'bg-orange-100 dark:bg-secondary-500/15', text: 'text-orange-600 dark:text-secondary-400' },
    itHilfe:     { bg: 'bg-emerald-100 dark:bg-primary-500/15',   text: 'text-emerald-600 dark:text-primary-400' },
    services:    { bg: 'bg-blue-100 dark:bg-primary-500/15',      text: 'text-blue-600 dark:text-primary-400' },
    about:       { bg: 'bg-primary-100 dark:bg-primary-500/15',   text: 'text-primary-600 dark:text-primary-400' },
    contact:     { bg: 'bg-neutral-100 dark:bg-primary-500/15',   text: 'text-neutral-600 dark:text-primary-400' },
    getInvolved: { bg: 'bg-purple-100 dark:bg-primary-500/15',    text: 'text-purple-600 dark:text-primary-400' },
    workshops:   { bg: 'bg-warning-100 dark:bg-secondary-500/15', text: 'text-warning-600 dark:text-secondary-400' },
    blog:        { bg: 'bg-rose-100 dark:bg-primary-500/15',      text: 'text-rose-600 dark:text-primary-400' },
    faq:         { bg: 'bg-sky-100 dark:bg-primary-500/15',       text: 'text-sky-600 dark:text-primary-400' },
    space:       { bg: 'bg-teal-100 dark:bg-primary-500/15',      text: 'text-teal-600 dark:text-primary-400' },
    projects:    { bg: 'bg-indigo-100 dark:bg-primary-500/15',    text: 'text-indigo-600 dark:text-primary-400' },
    repairers:   { bg: 'bg-warning-100 dark:bg-secondary-500/15', text: 'text-warning-600 dark:text-secondary-400' },
    knowhow:     { bg: 'bg-cyan-100 dark:bg-primary-500/15',      text: 'text-cyan-600 dark:text-primary-400' },
    home:        { bg: 'bg-emerald-100 dark:bg-primary-500/15',   text: 'text-emerald-600 dark:text-primary-400' },
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
      marketplace: 'group-hover:text-orange-500 dark:group-hover:text-secondary-400',
      itHilfe:     'group-hover:text-emerald-600 dark:group-hover:text-primary-400',
      services:    'group-hover:text-blue-600 dark:group-hover:text-primary-400',
      about:       'group-hover:text-primary-600 dark:group-hover:text-primary-400',
      contact:     'group-hover:text-neutral-700 dark:group-hover:text-primary-400',
      getInvolved: 'group-hover:text-purple-600 dark:group-hover:text-primary-400',
      workshops:   'group-hover:text-warning-600 dark:group-hover:text-secondary-400',
      blog:        'group-hover:text-rose-600 dark:group-hover:text-primary-400',
      faq:         'group-hover:text-sky-600 dark:group-hover:text-primary-400',
      space:       'group-hover:text-teal-600 dark:group-hover:text-primary-400',
      projects:    'group-hover:text-indigo-600 dark:group-hover:text-primary-400',
      repairers:   'group-hover:text-warning-600 dark:group-hover:text-secondary-400',
      knowhow:     'group-hover:text-cyan-600 dark:group-hover:text-primary-400',
      home:        'group-hover:text-emerald-600 dark:group-hover:text-primary-400',
    },
    border: {
      default:  'border-neutral-200 dark:border-white/[0.06]',
      featured: 'border-primary-300 dark:border-primary-500/30 ring-1 ring-primary-200 dark:ring-primary-500/20',
    },
  },
} as const

export type ThemeKey = keyof typeof DESIGN_TOKENS.gradients
