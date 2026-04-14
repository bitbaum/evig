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
  pageTitle:    'text-2xl font-bold text-gray-900 dark:text-white',
  /** h2: card/section header */
  sectionTitle: 'text-sm font-semibold text-gray-900 dark:text-white',
  /** h3: sub-heading inside a card */
  subTitle:     'text-sm font-medium text-gray-700 dark:text-gray-300',
  /** Table column headers, filter labels */
  tableHeader:  'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide',
  /** Standard body text */
  body:         'text-sm text-gray-700 dark:text-gray-300',
  /** Secondary / meta text — 14px minimum for readability (WCAG) */
  meta:         'text-sm text-gray-500 dark:text-gray-400',
  /** Large metric number in stat cards — font-mono ensures consistent digit widths */
  stat:         'text-2xl font-bold tabular-nums font-mono text-gray-900 dark:text-white',
  /** Stat card label below the number */
  statLabel:    'text-xs text-gray-500 dark:text-gray-400 mt-0.5',
} as const

// ─── Surfaces ────────────────────────────────────────────────────────────────
// Card and panel background patterns.

export const adminSurface = {
  /** Standard white card */
  card:    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
  /** Card with subtle shadow (for detail/focus pages) */
  cardElevated: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
  /** Inset / secondary panel */
  inset:   'bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700',
  /** Table wrapper — card with overflow-hidden for crisp border on table edges */
  table:   'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
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
  green:  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  amber:  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  red:    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  teal:   'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
} as const

export type AdminIconColorKey = keyof typeof adminIconColor

// ─── Status Badge Colors ──────────────────────────────────────────────────────
// Semantic color tokens for status badges across all admin pages.
// Import these in config files instead of hardcoding class strings.

export const adminStatus = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  danger:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
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
    'inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Standard secondary: edit, configure */
  secondary:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md border border-gray-300 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
  /** Status transition: approve, publish, activate */
  action:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Warning state: suspend, pause */
  warning:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Destructive confirm (inside modals only): permanently delete */
  danger:
    'inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  /** Destructive inline (table rows): delete, remove — outline not filled */
  dangerOutline:
    'inline-flex items-center gap-2 px-3 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800 dark:hover:bg-red-900/20 dark:text-red-400',
  /** Ghost: low-emphasis, tertiary actions */
  ghost:
    'inline-flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700',
  /** Icon-only button — 44×44px touch target (WCAG 2.5.5) */
  icon:
    'inline-flex items-center justify-center min-w-[2.75rem] min-h-[2.75rem] w-9 h-9 text-gray-500 hover:bg-gray-100 rounded-md transition-colors dark:text-gray-400 dark:hover:bg-gray-700',
} as const

export type AdminBtnVariant = keyof typeof adminBtn

// ─── Table ────────────────────────────────────────────────────────────────────

export const adminTable = {
  /** thead row */
  thead: 'border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900',
  /** th cell */
  th:    'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide',
  /** tbody tr */
  tr:    'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
  /** td cell */
  td:    'px-4 py-3 text-sm text-gray-700 dark:text-gray-300',
  /** Empty state container */
  empty: 'py-12 text-center text-sm text-gray-500 dark:text-gray-400',
} as const

// ─── Form ─────────────────────────────────────────────────────────────────────

export const adminForm = {
  /** Standard text input */
  input:
    'w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
  /** Textarea */
  textarea:
    'w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
  /** Select */
  select:
    'rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  /** Field label */
  label:
    'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
  /** Helper text below a field */
  hint:
    'mt-1 text-xs text-gray-500 dark:text-gray-400',
  /** Error message below a field */
  error:
    'mt-1 text-xs text-red-600 dark:text-red-400',
} as const
