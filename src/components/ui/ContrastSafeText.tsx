/**
 * ContrastSafeText Component
 * 
 * Ensures proper text contrast based on background color
 * Single source of truth for text color selection
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Initial component for contrast-safe text rendering
 */

import { ReactNode } from 'react'
import { getTextColor, type BackgroundVariant, type TextVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ContrastSafeTextProps {
  children: ReactNode
  background?: BackgroundVariant | 'dark'
  variant?: TextVariant
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Component that automatically applies contrast-safe text colors
 */
export function ContrastSafeText({
  children,
  background = 'white',
  variant = 'primary',
  className,
  as: Component = 'p',
}: ContrastSafeTextProps) {
  const textColor = getTextColor(background, variant)
  
  return (
    <Component className={cn(textColor, className)}>
      {children}
    </Component>
  )
}



