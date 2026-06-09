/**
 * Design System Utilities
 * 
 * Single source of truth for colors, contrast, and styling
 * Ensures WCAG AA compliance and consistent design across the app
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Initial design system utilities for contrast-safe colors
 */

/**
 * Background color variants
 */
export type BackgroundVariant = 'white' | 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

/**
 * Text color variants (ensures proper contrast)
 */
export type TextVariant = 'primary' | 'secondary' | 'muted' | 'inverse' | 'on-primary' | 'on-dark'

/**
 * Contrast-safe color combinations
 * Ensures WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
 */
export const contrastSafeColors = {
  // White backgrounds
  white: {
    text: {
      primary: 'text-neutral-900',      // High contrast on white
      secondary: 'text-neutral-700',    // Medium contrast
      muted: 'text-neutral-600',       // Muted but WCAG AA safe on white
      inverse: 'text-neutral-900',      // Same as primary
    },
    bg: 'bg-white',
    border: 'border-neutral-200',
  },
  
  // Neutral/Light gray backgrounds (bg-neutral-50)
  neutral: {
    text: {
      primary: 'text-neutral-900',      // High contrast
      secondary: 'text-neutral-700',
      muted: 'text-neutral-600',       // WCAG AA safe on neutral-50
      inverse: 'text-neutral-900',
    },
    bg: 'bg-neutral-50',
    border: 'border-neutral-300',
  },
  
  // Primary green backgrounds
  primary: {
    text: {
      primary: 'text-white',            // White on green
      secondary: 'text-primary-50',    // Very light green
      muted: 'text-primary-100',
      inverse: 'text-white',
      onPrimary: 'text-white',
    },
    bg: 'bg-primary-600',
    border: 'border-primary-700',
  },
  
  // Secondary orange backgrounds
  secondary: {
    text: {
      primary: 'text-white',
      secondary: 'text-secondary-50',
      muted: 'text-secondary-100',
      inverse: 'text-white',
    },
    bg: 'bg-secondary-500',
    border: 'border-secondary-600',
  },
  
  // Success green backgrounds
  success: {
    text: {
      primary: 'text-white',
      secondary: 'text-success-50',
      muted: 'text-success-100',
      inverse: 'text-white',
    },
    bg: 'bg-success-600',
    border: 'border-success-700',
  },
  
  // Warning yellow backgrounds
  warning: {
    text: {
      primary: 'text-neutral-900',      // Dark text on yellow (better contrast)
      secondary: 'text-neutral-800',
      muted: 'text-neutral-700',
      inverse: 'text-neutral-900',
    },
    bg: 'bg-warning-500',
    border: 'border-warning-600',
  },
  
  // Error red backgrounds
  error: {
    text: {
      primary: 'text-white',
      secondary: 'text-error-50',
      muted: 'text-error-100',
      inverse: 'text-white',
    },
    bg: 'bg-error-600',
    border: 'border-error-700',
  },
  
  // Info blue backgrounds (mapped to neutral)
  info: {
    text: {
      primary: 'text-white',
      secondary: 'text-neutral-200',
      muted: 'text-neutral-300',
      inverse: 'text-white',
    },
    bg: 'bg-neutral-600',
    border: 'border-neutral-700',
  },
  
  // Dark backgrounds
  dark: {
    text: {
      primary: 'text-white',
      secondary: 'text-neutral-200',
      muted: 'text-neutral-400',
      inverse: 'text-white',
      onDark: 'text-white',
    },
    bg: 'bg-neutral-900',
    border: 'border-neutral-700',
  },
} as const

/**
 * Get contrast-safe text color for a given background
 */
export function getTextColor(
  background: BackgroundVariant | 'dark',
  variant: TextVariant = 'primary'
): string {
  const colors = contrastSafeColors[background] || contrastSafeColors.white
  // Convert kebab-case variants to camelCase for object access
  const variantKey = variant.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as keyof typeof colors.text
  return colors.text[variantKey] || colors.text.primary
}

/**
 * Get contrast-safe background color
 */
export function getBackgroundColor(background: BackgroundVariant | 'dark'): string {
  return contrastSafeColors[background]?.bg || contrastSafeColors.white.bg
}

/**
 * Get contrast-safe border color
 */
export function getBorderColor(background: BackgroundVariant | 'dark'): string {
  return contrastSafeColors[background]?.border || contrastSafeColors.white.border
}

/**
 * Status color mappings (for badges, alerts, etc.)
 */
export const statusColors = {
  success: {
    bg: 'bg-success-50',
    text: 'text-success-800',
    border: 'border-success-200',
    icon: 'text-success-600',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-800',
    border: 'border-warning-200',
    icon: 'text-warning-600',
  },
  error: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    text: 'text-error-800 dark:text-error-300',
    border: 'border-error-200 dark:border-error-800/30',
    icon: 'text-error-600 dark:text-error-400',
  },
  info: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    icon: 'text-neutral-600',
  },
  neutral: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    icon: 'text-neutral-600',
  },
} as const

/**
 * Get status colors
 */
export function getStatusColors(status: keyof typeof statusColors) {
  return statusColors[status] || statusColors.neutral
}

/**
 * Button variants with proper contrast
 */
export const buttonVariants = {
  primary: {
    bg: 'bg-primary-600',
    hover: 'hover:bg-primary-700',
    text: 'text-white',
    border: 'border-primary-700',
  },
  secondary: {
    bg: 'bg-secondary-500',
    hover: 'hover:bg-secondary-600',
    text: 'text-white',
    border: 'border-secondary-600',
  },
  outline: {
    bg: 'bg-transparent',
    hover: 'hover:bg-neutral-50',
    text: 'text-neutral-700',
    border: 'border-neutral-300',
  },
  ghost: {
    bg: 'bg-transparent',
    hover: 'hover:bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-transparent',
  },
  success: {
    bg: 'bg-success-600',
    hover: 'hover:bg-success-700',
    text: 'text-white',
    border: 'border-success-700',
  },
  error: {
    bg: 'bg-error-600',
    hover: 'hover:bg-error-700',
    text: 'text-white',
    border: 'border-error-700',
  },
} as const

/**
 * Get button variant classes
 */
export function getButtonVariant(variant: keyof typeof buttonVariants) {
  return buttonVariants[variant] || buttonVariants.primary
}

/**
 * Card/Container variants
 */
export const containerVariants = {
  default: {
    bg: 'bg-white',
    text: 'text-neutral-900',
    border: 'border-neutral-200',
  },
  elevated: {
    bg: 'bg-white',
    text: 'text-neutral-900',
    border: 'border-neutral-200',
    shadow: 'shadow-lg',
  },
  subtle: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-900',
    border: 'border-neutral-200',
  },
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    text: 'text-neutral-900',
    border: 'border-primary-200 dark:border-primary-800/30',
  },
} as const

/**
 * Mobile-first responsive utilities
 */
export const responsive = {
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl',
  },
  padding: {
    sm: 'p-2 sm:p-4',
    base: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  },
  gap: {
    sm: 'gap-2 sm:gap-4',
    base: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  },
} as const

/**
 * Touch target utilities (minimum 44x44px for accessibility)
 */
export const touchTarget = {
  base: 'min-h-touch min-w-touch',
  sm: 'min-h-[36px] min-w-[36px]',
  lg: 'min-h-[48px] min-w-[48px]',
} as const

/**
 * Semantic component primitives.
 *
 * These are the design adapter layer: public and admin components should
 * consume these named primitives instead of hardcoding visual Tailwind classes.
 * A future visual direction change should start here, then only move outward
 * when a workflow needs a different information architecture.
 */
export const designPrimitive = {
  // Focus ring — primary green, consistent with brand
  focus:
    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950',

  // ── Typography ────────────────────────────────────────────────────────────
  // x.ai style: tight tracking, high contrast, scale discipline
  type: {
    pageTitle:   'text-2xl font-bold tracking-tight text-neutral-900 dark:text-white',
    sectionTitle:'text-sm font-semibold tracking-tight text-neutral-900 dark:text-white',
    subTitle:    'text-sm font-medium text-neutral-700 dark:text-neutral-300',
    body:        'text-sm text-neutral-600 dark:text-neutral-300',
    meta:        'text-xs text-neutral-500 dark:text-neutral-400',
    smallMeta:   'text-xs text-neutral-400 dark:text-neutral-500',
    tableHeader: 'text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500',
    stat:        'text-2xl font-bold tabular-nums text-neutral-900 dark:text-white',
  },

  // ── Surfaces ──────────────────────────────────────────────────────────────
  // card-shell / card-shell-inset are defined in globals.css @layer components.
  // They use CSS custom properties so dark mode is automatic — no dark: needed.
  surface: {
    card:        'card-shell',
    cardElevated:'card-shell shadow-xs',
    inset:       'card-shell-inset',
    table:       'card-shell overflow-hidden',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  // Fix: button.primary was `info-600` (blue) — corrected to `primary-600` (green)
  buttonBase:
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap',

  button: {
    // In dark mode the brand pulse goes brighter (primary-500 #22c55e) and the
    // text flips to near-black for WCAG AA contrast. Plain `text-white` on
    // primary-600 was reading as 3.1:1 — looked green-washed.
    default:     'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:text-neutral-950 dark:hover:bg-primary-400',
    primary:     'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:text-neutral-950 dark:hover:bg-primary-400',
    outline:     'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-white/8 dark:bg-transparent dark:text-white dark:hover:bg-white/4',
    outlineLight:'border border-white/70 bg-transparent text-white hover:bg-white hover:text-neutral-900',
    secondary:   'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/6 dark:text-white dark:hover:bg-white/10',
    ghost:       'bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/4 dark:hover:text-white',
    destructive:         'bg-error-600 text-white hover:bg-error-700',
    'destructive-ghost': 'bg-transparent text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20',
    'destructive-outline':'border border-error-200 text-error-700 hover:bg-error-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-900/20',
    warning:             'bg-warning-500 text-neutral-950 hover:bg-warning-600',
  },

  buttonSize: {
    default: 'min-h-touch px-4 py-2 text-sm',
    sm:      'min-h-[36px] px-3 py-1.5 text-sm',
    lg:      'min-h-touch px-6 py-2.5 text-sm',
    icon:    'min-h-touch min-w-touch p-2',
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badgeBase:
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',

  badge: {
    default:     'border-transparent bg-primary-600 text-white',
    secondary:   'border-transparent bg-neutral-100 text-neutral-700 dark:bg-white/8 dark:text-neutral-300',
    destructive: 'border-transparent bg-error-600 text-white',
    outline:     'border-neutral-300 text-neutral-700 dark:border-white/12 dark:text-neutral-400',
    success:     'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400',
    warning:     'border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400',
    info:        'border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-500/30 dark:bg-neutral-500/10 dark:text-neutral-400',
  },

  // ── Forms ─────────────────────────────────────────────────────────────────
  // `default` variants: page-level (page bg #0a0a0a, container surface neutral-900).
  // Form controls — semantic tokens only. The tokens (--surface-base,
  // --text-primary, --border-default, --accent-action) flip automatically
  // between light and dark via globals.css, so no `dark:` variants needed.
  //
  // `default` variant: sits on surface-page (the body background).
  // `elevated` variant: sits inside a surface-base panel (e.g. a modal)
  //   — bg lifts to surface-raised so it stays visible against the panel.
  form: {
    input:            'w-full rounded-md border bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-action focus:border-transparent disabled:opacity-50',
    inputElevated:    'w-full rounded-md border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-action focus:border-transparent disabled:opacity-50',
    textarea:         'w-full rounded-md border bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-action focus:border-transparent disabled:opacity-50',
    textareaElevated: 'w-full rounded-md border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-action focus:border-transparent disabled:opacity-50',
    select:           'rounded-md border bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-action focus:border-transparent',
    selectElevated:   'rounded-md border bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-action focus:border-transparent',
    label:    'block text-xs font-medium uppercase tracking-wide text-text-tertiary mb-1',
    hint:     'mt-1 text-xs text-text-muted',
    error:    'mt-1 text-xs text-error-600 dark:text-error-400',
  },

  // ── Tables ────────────────────────────────────────────────────────────────
  // x.ai: very subtle row separators, no heavy borders
  table: {
    thead: 'border-b border-neutral-200 bg-neutral-50 dark:border-white/6 dark:bg-transparent',
    th:    'px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500',
    tr:    'border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-white/4 dark:hover:bg-white/2',
    td:    'px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300',
    empty: 'py-12 text-center text-sm text-neutral-500 dark:text-neutral-400',
  },
} as const

export type DesignButtonVariant = keyof typeof designPrimitive.button
export type DesignButtonSize = keyof typeof designPrimitive.buttonSize
export type DesignBadgeVariant = keyof typeof designPrimitive.badge


