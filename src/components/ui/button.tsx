'use client'

import { ButtonHTMLAttributes, forwardRef, ElementType } from 'react'
import { cn } from '@/lib/utils'
import { BUTTONS } from '@/config/ui'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: ElementType
  variant?: 'default' | 'primary' | 'outline' | 'outline-light' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const buttonVariantClass = {
  default: BUTTONS.app.default,
  primary: BUTTONS.app.primary,
  outline: BUTTONS.app.outline,
  'outline-light': BUTTONS.app.outlineLight,
  secondary: BUTTONS.app.secondary,
  ghost: BUTTONS.app.ghost,
  destructive: BUTTONS.app.destructive,
} as const

const buttonSizeClass = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
} as const

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, as: Tag = 'button', variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Tag
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap',
          buttonVariantClass[variant],
          buttonSizeClass[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button } 
