import { UI_STATUS } from '@/config/ui/status'
import { designPrimitive } from '@/lib/design-system'

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
  pageTitle:    designPrimitive.type.pageTitle,
  /** h2: card/section header */
  sectionTitle: designPrimitive.type.sectionTitle,
  /** h3: sub-heading inside a card */
  subTitle:     designPrimitive.type.subTitle,
  /** Table column headers, filter labels */
  tableHeader:  designPrimitive.type.tableHeader,
  /** Standard body text */
  body:         designPrimitive.type.body,
  /** Secondary / meta text — 14px minimum for readability (WCAG) */
  meta:         designPrimitive.type.meta,
  /** Large metric number in stat cards — font-mono ensures consistent digit widths */
  stat:         designPrimitive.type.stat,
  /** Stat card label below the number */
  statLabel:    `${designPrimitive.type.smallMeta} mt-0.5`,
} as const

// ─── Surfaces ────────────────────────────────────────────────────────────────
// Card and panel background patterns.

export const adminSurface = {
  /** Standard white card */
  card:    designPrimitive.surface.card,
  /** Card with subtle shadow (for detail/focus pages) */
  cardElevated: designPrimitive.surface.cardElevated,
  /** Inset / secondary panel */
  inset:   designPrimitive.surface.inset,
  /** Table wrapper — card with overflow-hidden for crisp border on table edges */
  table:   designPrimitive.surface.table,
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
  blue:   'bg-info-100 text-info-600 dark:bg-info-500/[0.12] dark:text-info-400',
  green:  'bg-primary-100 text-primary-600 dark:bg-primary-500/[0.12] dark:text-primary-400',
  amber:  'bg-warning-100 text-warning-600 dark:bg-warning-500/[0.12] dark:text-warning-400',
  red:    'bg-error-100 text-error-600 dark:bg-error-500/[0.12] dark:text-error-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/[0.12] dark:text-purple-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/[0.12] dark:text-indigo-400',
  teal:   'bg-teal-100 text-teal-600 dark:bg-teal-500/[0.12] dark:text-teal-400',
  gray:   'bg-neutral-100 text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-500/[0.12] dark:text-orange-400',
} as const

export type AdminIconColorKey = keyof typeof adminIconColor

// ─── Status Badge Colors ──────────────────────────────────────────────────────
// Semantic color tokens for status badges across all admin pages.
// Import these in config files instead of hardcoding class strings.

export const adminStatus = UI_STATUS

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
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} ${designPrimitive.button.default} disabled:cursor-not-allowed`,
  /** Standard secondary: edit, configure */
  secondary:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} ${designPrimitive.button.outline} disabled:cursor-not-allowed`,
  /** Status transition: approve, publish, activate */
  action:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} ${designPrimitive.button.primary} disabled:cursor-not-allowed`,
  /** Warning state: suspend, pause */
  warning:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} ${designPrimitive.button.warning} disabled:cursor-not-allowed`,
  /** Destructive confirm (inside modals only): permanently delete */
  danger:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} ${designPrimitive.button.destructive} disabled:cursor-not-allowed`,
  /** Destructive inline (table rows): delete, remove — outline not filled */
  dangerOutline:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} border border-error-300 text-error-600 hover:bg-error-50 disabled:cursor-not-allowed dark:border-error-800 dark:text-error-400 dark:hover:bg-error-900/20`,
  /** Ghost: low-emphasis, tertiary actions */
  ghost:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.sm} ${designPrimitive.button.ghost} disabled:cursor-not-allowed`,
  /** Icon-only button — 44×44px touch target (WCAG 2.5.5) */
  icon:
    `${designPrimitive.buttonBase} ${designPrimitive.focus} ${designPrimitive.buttonSize.icon} ${designPrimitive.button.ghost}`,
} as const

export type AdminBtnVariant = keyof typeof adminBtn

// ─── Table ────────────────────────────────────────────────────────────────────

export const adminTable = {
  /** thead row */
  thead: designPrimitive.table.thead,
  /** th cell */
  th:    designPrimitive.table.th,
  /** tbody tr */
  tr:    designPrimitive.table.tr,
  /** td cell */
  td:    designPrimitive.table.td,
  /** Empty state container */
  empty: designPrimitive.table.empty,
} as const

// ─── Form ─────────────────────────────────────────────────────────────────────

export const adminForm = {
  /** Standard text input */
  input: designPrimitive.form.input,
  /** Textarea */
  textarea: `${designPrimitive.form.textarea} resize-none`,
  /** Select */
  select: designPrimitive.form.select,
  /** Field label */
  label: `${designPrimitive.form.label} mb-1`,
  /** Helper text below a field */
  hint: designPrimitive.form.hint,
  /** Error message below a field */
  error: designPrimitive.form.error,
} as const
