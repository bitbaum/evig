/**
 * ContrastSafeContainer Component
 * 
 * Container with automatic contrast-safe text colors
 * Ensures WCAG AA compliance
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Initial component for contrast-safe containers
 */

import { ReactNode } from 'react'
import { getBackgroundColor, getTextColor, getBorderColor, type BackgroundVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ContrastSafeContainerProps {
  children: ReactNode
  background?: BackgroundVariant | 'dark'
  className?: string
  border?: boolean
  padding?: 'none' | 'sm' | 'base' | 'lg'
  rounded?: boolean
}

/**
 * Container component that automatically applies contrast-safe colors
 */
export function ContrastSafeContainer({
  children,
  background = 'white',
  className,
  border = false,
  padding = 'base',
  rounded = true,
}: ContrastSafeContainerProps) {
  const bgColor = getBackgroundColor(background)
  const textColor = getTextColor(background, 'primary')
  const borderColor = border ? getBorderColor(background) : ''
  
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-4',
    base: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }
  
  return (
    <div
      className={cn(
        bgColor,
        textColor,
        borderColor,
        paddingClasses[padding],
        rounded && 'rounded-lg',
        className
      )}
    >
      {children}
    </div>
  )
}



