/**
 * Design System Utilities
 * 
 * Single source of truth for colors, contrast, and styling
 * Ensures WCAG AA compliance and consistent design across the app
 * 
 * Created: 2025-12-17
 * Last Modified: 2026-06-15
 * Last Modified Summary: Migrate designPrimitive + surface/button helpers to semantic tokens (FleetCrown/x.ai discipline)
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
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-tertiary',
      inverse: 'text-text-primary',
    },
    bg: 'bg-surface-base',
    border: 'border-subtle',
  },

  neutral: {
    text: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-tertiary',
      inverse: 'text-text-primary',
    },
    bg: 'bg-surface-raised',
    border: 'border-default',
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
      primary: 'text-text-inverted',
      secondary: 'text-text-secondary',
      muted: 'text-text-muted',
      inverse: 'text-text-inverted',
      onDark: 'text-text-inverted',
    },
    bg: 'bg-surface-page',
    border: 'border-subtle',
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
    bg: 'bg-surface-raised',
    text: 'text-text-primary',
    border: 'border-subtle',
    icon: 'text-text-secondary',
  },
  neutral: {
    bg: 'bg-surface-raised',
    text: 'text-text-primary',
    border: 'border-subtle',
    icon: 'text-text-secondary',
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
    bg: 'bg-action',
    hover: 'hover:bg-action-hover',
    text: 'text-action-text',
    border: 'border-transparent',
  },
  secondary: {
    bg: 'bg-secondary-500',
    hover: 'hover:bg-secondary-600',
    text: 'text-white',
    border: 'border-secondary-600',
  },
  outline: {
    bg: 'bg-transparent',
    hover: 'hover:bg-surface-raised',
    text: 'text-text-secondary',
    border: 'border-subtle',
  },
  ghost: {
    bg: 'bg-transparent',
    hover: 'hover:bg-surface-raised',
    text: 'text-text-secondary',
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
    bg: 'bg-surface-base',
    text: 'text-text-primary',
    border: 'border-subtle',
  },
  elevated: {
    bg: 'bg-surface-base',
    text: 'text-text-primary',
    border: 'border-subtle',
    shadow: 'shadow-xs',
  },
  subtle: {
    bg: 'bg-surface-raised',
    text: 'text-text-primary',
    border: 'border-subtle',
  },
  primary: {
    bg: 'bg-action-muted',
    text: 'text-text-primary',
    border: 'border-action/20',
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
    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page',

  // ── Typography ────────────────────────────────────────────────────────────
  // x.ai style: tight tracking, high contrast, scale discipline
  type: {
    pageTitle:   'text-2xl font-bold tracking-tight text-text-primary',
    sectionTitle:'text-sm font-semibold tracking-tight text-text-primary',
    subTitle:    'text-sm font-medium text-text-secondary',
    body:        'text-sm text-text-secondary',
    meta:        'text-xs text-text-tertiary',
    smallMeta:   'text-xs text-text-muted',
    tableHeader: 'text-xs font-medium uppercase tracking-wider text-text-muted',
    stat:        'text-2xl font-bold tabular-nums text-text-primary',
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
    default:     'bg-action text-action-text hover:bg-action-hover',
    primary:     'bg-action text-action-text hover:bg-action-hover',
    outline:     'border border-subtle bg-surface-base text-text-primary hover:bg-surface-raised',
    outlineLight:'border border-white/70 bg-transparent text-white hover:bg-white hover:text-text-primary',
    secondary:   'bg-surface-raised text-text-primary hover:bg-surface-overlay',
    ghost:       'bg-transparent text-text-secondary hover:bg-surface-raised hover:text-text-primary',
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
    default:     'border-transparent bg-action text-action-text',
    secondary:   'border-transparent bg-surface-raised text-text-secondary',
    destructive: 'border-transparent bg-error-600 text-white',
    outline:     'border-subtle text-text-secondary',
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
    thead: 'border-b border-subtle bg-surface-raised',
    th:    'px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted',
    tr:    'border-b border-subtle transition-colors hover:bg-surface-raised',
    td:    'px-4 py-3 text-sm text-text-secondary',
    empty: 'py-12 text-center text-sm text-text-tertiary',
  },
} as const

export type DesignButtonVariant = keyof typeof designPrimitive.button
export type DesignButtonSize = keyof typeof designPrimitive.buttonSize
export type DesignBadgeVariant = keyof typeof designPrimitive.badge


