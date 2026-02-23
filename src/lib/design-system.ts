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
  
  // Info blue backgrounds
  info: {
    text: {
      primary: 'text-white',
      secondary: 'text-info-50',
      muted: 'text-info-100',
      inverse: 'text-white',
    },
    bg: 'bg-info-600',
    border: 'border-info-700',
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
    bg: 'bg-error-50',
    text: 'text-error-800',
    border: 'border-error-200',
    icon: 'text-error-600',
  },
  info: {
    bg: 'bg-info-50',
    text: 'text-info-800',
    border: 'border-info-200',
    icon: 'text-info-600',
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
    bg: 'bg-primary-50',
    text: 'text-neutral-900',
    border: 'border-primary-200',
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
  base: 'min-h-[44px] min-w-[44px]',
  sm: 'min-h-[36px] min-w-[36px]',
  lg: 'min-h-[48px] min-w-[48px]',
} as const



