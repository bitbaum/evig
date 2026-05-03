/**
 * Admin UI Design Tokens — SSOT
 *
 * Single source of truth for all admin interface design decisions.
 * Import from here instead of writing inline Tailwind class strings.
 *
 * Principles:
 * - Admin UIs are data-dense; headings must be much smaller than marketing pages
 * - Every design decision is a named export — no magic strings in components
 * - Color = meaning: green = create/success, red = danger, amber = warning, blue = info
 */

// ─── Typography ─────────────────────────────────────────────────────────────
// Admin-specific scale. NOT the public marketing site scale.

export const adminType = {
  /** h1: page title in AdminPageWrapper — 24px, bold, strong hierarchy anchor */
  pageTitle:    'text-2xl font-bold text-neutral-900 dark:text-white',
  /** h2: card/section header */
  sectionTitle: 'text-sm font-semibold text-neutral-900 dark:text-white',
  /** h3: sub-heading inside a card */
  subTitle:     'text-sm font-medium text-neutral-700 dark:text-neutral-300',
  /** Table column headers, filter labels */
  tableHeader:  'text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide',
  /** Standard body text */
  body:         'text-sm text-neutral-700 dark:text-neutral-300',
  /** Secondary / meta text — 14px minimum for readability (WCAG) */
  meta:         'text-sm text-neutral-500 dark:text-neutral-400',
  /** Large metric number in stat cards — font-mono ensures consistent digit widths */
  stat:         'text-2xl font-bold tabular-nums font-mono text-neutral-900 dark:text-white',
  /** Stat card label below the number */
  statLabel:    'text-xs text-neutral-500 dark:text-neutral-400 mt-0.5',
} as const

// ─── Surfaces ────────────────────────────────────────────────────────────────
// Card and panel background patterns.

export const adminSurface = {
  /** Standard white card */
  card:    'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700',
  /** Card with subtle shadow (for detail/focus pages) */
  cardElevated: 'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm',
  /** Inset / secondary panel */
  inset:   'bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700',
  /** Table wrapper — card with overflow-hidden for crisp border on table edges */
  table:   'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden',
} as const

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const adminSpace = {
  /** Outer page padding (matches AdminLayoutClient main) */
  page:     'p-4 lg:p-6',
  /** Inner card padding — standard */
  card:     'p-4',
  /** Inner card padding — form sections with more breathing room */
  cardForm: 'p-5',
  /** Vertical rhythm between major page sections */
  sections: 'space-y-5',
  /** Gap inside a stats grid or card grid */
  grid:     'gap-4',
  /** Gap between chips/badges in a row */
  chips:    'gap-1.5',
  /** Gap between form field groups */
  form:     'gap-5',
} as const

// ─── Icon Box ─────────────────────────────────────────────────────────────────
// The colored-square-with-icon pattern used in stat cards and page headers.

export const adminIconBox = {
  /** Small box: 36×36, inside stat cards */
  sm:   'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
  /** Medium box: 40×40, inside page header */
  md:   'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
  /** Icon size inside sm box */
  icon: 'w-4 h-4',
  /** Icon size inside md box */
  iconMd: 'w-5 h-5',
} as const

// ─── Icon Box Colors ──────────────────────────────────────────────────────────

export const adminIconColor = {
  blue:   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green:  'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  amber:  'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
  red:    'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  teal:   'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  gray:   'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
} as const

export type AdminIconColorKey = keyof typeof adminIconColor

// ─── Status Badge Colors ──────────────────────────────────────────────────────
// Semantic color tokens for status badges across all admin pages.
// Import these in config files instead of hardcoding class strings.

export const adminStatus = {
  success: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  danger:  'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  purple:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  teal:    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
} as const

export type AdminStatusKey = keyof typeof adminStatus

// ─── Buttons ──────────────────────────────────────────────────────────────────
// Every admin button style. Use these instead of inline Tailwind class strings.
// Color = intent (NOT per-feature brand color):
//   create/primary → green (brand affirmative)
//   edit/secondary → gray outline
//   danger confirm → red filled (only in confirm dialogs)
//   danger outline → red outline (destructive row actions)

export const adminBtn = {
  /** Primary CTA: create, submit, save */
  primary:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Standard secondary: edit, configure */
  secondary:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-md border border-neutral-300 transition-colors dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700',
  /** Status transition: approve, publish, activate */
  action:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Warning state: suspend, pause */
  warning:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-warning-500 hover:bg-warning-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Destructive confirm (inside modals only): permanently delete */
  danger:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-error-600 hover:bg-error-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Destructive inline (table rows): delete, remove — outline not filled */
  dangerOutline:
    'inline-flex items-center gap-2 px-3 py-1.5 border border-error-300 hover:bg-error-50 text-error-600 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-error-800 dark:hover:bg-error-900/20 dark:text-error-400',
  /** Ghost: low-emphasis, tertiary actions */
  ghost:
    'inline-flex items-center gap-2 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:bg-neutral-700',
  /** Icon-only button — 44×44px touch target (WCAG 2.5.5) */
  icon:
    'inline-flex items-center justify-center min-w-[2.75rem] min-h-[2.75rem] w-9 h-9 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700',
} as const

export type AdminBtnVariant = keyof typeof adminBtn

// ─── Table ────────────────────────────────────────────────────────────────────

export const adminTable = {
  /** thead row */
  thead: 'border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900',
  /** th cell */
  th:    'px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide',
  /** tbody tr */
  tr:    'border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors',
  /** td cell */
  td:    'px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300',
  /** Empty state container */
  empty: 'py-12 text-center text-sm text-neutral-500 dark:text-neutral-400',
} as const

// ─── Form ─────────────────────────────────────────────────────────────────────

export const adminForm = {
  /** Standard text input */
  input:
    'w-full rounded-md border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
  /** Textarea */
  textarea:
    'w-full rounded-md border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
  /** Select */
  select:
    'rounded-md border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  /** Field label */
  label:
    'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1',
  /** Helper text below a field */
  hint:
    'mt-1 text-xs text-neutral-500 dark:text-neutral-400',
  /** Error message below a field */
  error:
    'mt-1 text-xs text-error-600 dark:text-error-400',
} as const
