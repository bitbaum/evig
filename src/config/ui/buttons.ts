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
    primary: `${designPrimitive.button.primary} focus-visible:ring-action`,
    secondary: `${designPrimitive.button.outline} focus-visible:ring-action`,
    outline: 'bg-transparent text-action border border-action hover:bg-action-muted focus-visible:ring-action',
    ghost: 'bg-transparent text-action hover:bg-action-muted focus-visible:ring-action',
  },

  // Variants (for IT-Hilfe)
  itHilfe: {
    primary: `${designPrimitive.button.primary} focus-visible:ring-action`,
    secondary: `${designPrimitive.button.outline} focus-visible:ring-action`,
    outline: 'bg-transparent text-action border border-action hover:bg-action-muted focus-visible:ring-action',
    ghost: 'bg-transparent text-action hover:bg-action-muted focus-visible:ring-action',
  },

  // Common variants
  common: {
    danger: `${designPrimitive.button.destructive} focus-visible:ring-error-500`,
    success: `${designPrimitive.button.primary} focus-visible:ring-action`,
    neutral: `${designPrimitive.button.secondary} focus-visible:ring-action`,
  },

  // Generic app button primitive variants
  app: {
    default: designPrimitive.button.default,
    primary: designPrimitive.button.primary,
    outline: designPrimitive.button.outline,
    outlineLight: designPrimitive.button.outlineLight,
    secondary: designPrimitive.button.secondary,
    ghost: designPrimitive.button.ghost,
    destructive:        designPrimitive.button.destructive,
    'destructive-ghost':    designPrimitive.button['destructive-ghost'],
    'destructive-outline':  designPrimitive.button['destructive-outline'],
    warning: designPrimitive.button.warning,
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
