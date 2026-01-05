/**
 * ContrastSafeButton Component
 * 
 * Button component with automatic contrast-safe colors
 * Uses design system for consistent styling
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Initial button component with contrast-safe colors
 */

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { getButtonVariant, type BackgroundVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'error'
type ButtonSize = 'sm' | 'base' | 'lg'

interface ContrastSafeButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  className?: string
  background?: BackgroundVariant | 'dark' // For outline buttons on colored backgrounds
}

/**
 * Button component with automatic contrast-safe colors
 */
export function ContrastSafeButton({
  children,
  variant = 'primary',
  size = 'base',
  href,
  className,
  background,
  ...props
}: ContrastSafeButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    base: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary': {
        const colors = getButtonVariant('primary')
        return cn(colors.bg, colors.text, colors.hover, 'border', colors.border)
      }
      case 'secondary': {
        const colors = getButtonVariant('secondary')
        return cn(colors.bg, colors.text, colors.hover, 'border', colors.border)
      }
      case 'outline': {
        if (background === 'primary' || background === 'dark') {
          // White outline on dark background
          return 'bg-transparent border-2 border-white text-white hover:bg-white/20'
        }
        // Dark outline on light background
        const colors = getButtonVariant('outline')
        return cn(colors.bg, colors.text, colors.hover, 'border-2', colors.border)
      }
      case 'ghost': {
        const colors = getButtonVariant('ghost')
        return cn(colors.bg, colors.text, colors.hover)
      }
      case 'success': {
        const colors = getButtonVariant('success')
        return cn(colors.bg, colors.text, colors.hover, 'border', colors.border)
      }
      case 'error': {
        const colors = getButtonVariant('error')
        return cn(colors.bg, colors.text, colors.hover, 'border', colors.border)
      }
      default:
        return ''
    }
  }

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold',
    'transition-colors duration-300',
    'touch-target',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeClasses[size],
    getVariantClasses(),
    className
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  )
}



