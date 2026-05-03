/**
 * UI Button Configuration
 *
 * SSOT for button styles and variants.
 * Consistent button appearance across all pages.
 */

export const BUTTONS = {
  // Base button styles (size + spacing)
  base: 'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',

  // Sizes
  sizes: {
    small: 'px-3 py-1.5 text-xs sm:text-sm',
    medium: 'px-4 py-2 text-sm sm:text-base',
    large: 'px-6 py-3 text-base sm:text-lg',
  },

  // Variants (for marketplace)
  marketplace: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    outline: 'bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  },

  // Variants (for IT-Hilfe)
  itHilfe: {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    secondary: 'bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500',
    outline: 'bg-transparent text-emerald-600 border border-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500',
    ghost: 'bg-transparent text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500',
  },

  // Common variants
  common: {
    danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    success: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    neutral: 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-500',
  },
} as const

/**
 * Helper function to get button classes
 */
export function getButtonClasses(
  variant: keyof typeof BUTTONS.marketplace | keyof typeof BUTTONS.itHilfe | keyof typeof BUTTONS.common,
  size: keyof typeof BUTTONS.sizes = 'medium',
  theme: 'marketplace' | 'itHilfe' | 'common' = 'common'
): string {
  const sizeClass = BUTTONS.sizes[size]
  let variantClass: string

  if (theme === 'common') {
    variantClass = BUTTONS.common[variant as keyof typeof BUTTONS.common]
  } else if (theme === 'marketplace') {
    variantClass = BUTTONS.marketplace[variant as keyof typeof BUTTONS.marketplace]
  } else {
    variantClass = BUTTONS.itHilfe[variant as keyof typeof BUTTONS.itHilfe]
  }

  return `${BUTTONS.base} ${sizeClass} ${variantClass}`
}
