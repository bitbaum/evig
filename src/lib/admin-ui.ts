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
 * - Color = meaning only: green = create/success, red = danger, amber = warning.
 *   Everything else is neutral (monochrome chrome — no decorative rainbow).
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
  sm:   'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
  /** Medium box: 40×40, inside page header */
  md:   'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
  /** Icon size inside sm box */
  icon: 'w-4 h-4',
  /** Icon size inside md box */
  iconMd: 'w-5 h-5',
} as const

// ─── Icon Box Colors ──────────────────────────────────────────────────────────

// Monochrome admin chrome: only the three SEMANTIC colors carry meaning
// (green = success/create, amber = warning, red = danger). Every other key is
// neutral — the decorative rainbow (blue/purple/indigo/teal/orange) is retired.
// Keys are kept for API stability; the non-semantic ones now render neutral.
const NEUTRAL_ICON = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/12 dark:text-neutral-400'
export const adminIconColor = {
  green:  'bg-primary-100 text-primary-600 dark:bg-primary-500/12 dark:text-primary-400',
  amber:  'bg-warning-100 text-warning-600 dark:bg-warning-500/12 dark:text-warning-400',
  red:    'bg-error-100 text-error-600 dark:bg-error-500/12 dark:text-error-400',
  blue:   NEUTRAL_ICON,
  purple: NEUTRAL_ICON,
  indigo: NEUTRAL_ICON,
  teal:   NEUTRAL_ICON,
  orange: NEUTRAL_ICON,
  gray:   'bg-neutral-100 text-neutral-600 dark:bg-white/6 dark:text-neutral-400',
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
  /** tbody tr — admin-surface hover; use on `<tr>` inside admin tables */
  tr:    'border-b border-neutral-100 transition-colors hover:bg-surface-raised dark:border-white/4 dark:hover:bg-surface-base/6',
  /** td cell */
  td:    designPrimitive.table.td,
  /** Empty state container */
  empty: designPrimitive.table.empty,
} as const

// ─── Interactive states ───────────────────────────────────────────────────────
// Hover, selected, and active patterns for dense admin surfaces (tables, lists,
// sidebar, command palette). Fixes malformed Tailwind like `/[0.06]/50`.

export const adminInteractive = {
  /** Table rows, queue links, card rows — standard pointer hover */
  rowHover:        'hover:bg-surface-raised dark:hover:bg-surface-base/6',
  /** Sidebar items, icon buttons — lighter hover */
  rowHoverSubtle:  'hover:bg-surface-raised dark:hover:bg-surface-base/4',
  /** Compact list rows (timecards, payroll batches) */
  rowHoverFaint:   'hover:bg-surface-raised dark:hover:bg-surface-base/2',
  /** Checkbox-selected or active leave-period row */
  rowSelected:     'bg-action-muted/40',
  /** Sidebar nav item — current route */
  navActive:       'bg-action/10 text-action ring-1 ring-action/20',
  /** Command palette / typeahead keyboard highlight */
  pickerActive:    'bg-action-muted text-action',
  /** Unread notification row tint */
  unreadTint:      'bg-action-muted/50',
  /** Active team member avatar */
  avatarActive:    'bg-action text-white',
  /** Inactive team member avatar — readable initials on dark admin chrome */
  avatarInactive:  'bg-surface-overlay text-text-secondary',
} as const

// ─── Chrome (layout shell) ────────────────────────────────────────────────────

export const adminChrome = {
  /** Sticky admin top bar — matches public header pattern */
  topBar:
    'sticky top-0 z-40 border-b border bg-surface-base/90 backdrop-blur-xs',
  /** Primary action link in the top bar (e.g. Zur Website) */
  websiteLink:
    'hidden items-center gap-1.5 rounded-md border border-action/40 px-3 py-1.5 text-xs font-medium text-action transition-colors hover:border-action hover:bg-action/10 dark:border-action/30 sm:flex',
  /** Vertical divider between header action clusters */
  actionDivider: 'hidden h-5 w-px bg-surface-overlay dark:bg-surface-base/10 sm:block',
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
