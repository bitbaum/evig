import { designPrimitive } from '@/lib/design-system'

export const BUTTONS = {
  // Base button styles (size + spacing)
  base: `${designPrimitive.buttonBase} ${designPrimitive.focus}`,

  // Sizes
  sizes: {
    small: designPrimitive.buttonSize.sm,
    medium: designPrimitive.buttonSize.default,
    large: designPrimitive.buttonSize.lg,
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
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    outline: 'bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  },

  // Common variants
  common: {
    danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    success: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    neutral: 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-500',
  },

  // Generic app button primitive variants
  app: {
    default: designPrimitive.button.default,
    primary: designPrimitive.button.primary,
    outline: designPrimitive.button.outline,
    outlineLight: designPrimitive.button.outlineLight,
    secondary: designPrimitive.button.secondary,
    ghost: designPrimitive.button.ghost,
    destructive: designPrimitive.button.destructive,
  },

  badges: {
    default: designPrimitive.badge.default,
    secondary: designPrimitive.badge.secondary,
    destructive: designPrimitive.badge.destructive,
    outline: designPrimitive.badge.outline,
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
