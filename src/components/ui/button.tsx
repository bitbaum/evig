'use client'

import { ButtonHTMLAttributes, forwardRef, ElementType } from 'react'
import { cn } from '@/lib/utils'
import { BUTTONS } from '@/config/ui'
import { designPrimitive } from '@/lib/design-system'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: ElementType
  href?: string
  target?: string
  rel?: string
  variant?: 'default' | 'primary' | 'outline' | 'outline-light' | 'secondary' | 'ghost' | 'destructive' | 'warning'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const buttonVariantClass = {
  default: BUTTONS.app.default,
  primary: BUTTONS.app.primary,
  outline: BUTTONS.app.outline,
  'outline-light': BUTTONS.app.outlineLight,
  secondary: BUTTONS.app.secondary,
  ghost: BUTTONS.app.ghost,
  destructive: BUTTONS.app.destructive,
  warning: BUTTONS.app.warning,
} as const

const buttonSizeClass = {
  default: designPrimitive.buttonSize.default,
  sm: designPrimitive.buttonSize.sm,
  lg: designPrimitive.buttonSize.lg,
  icon: designPrimitive.buttonSize.icon,
} as const

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, as: Tag = 'button', variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Tag
        className={cn(
          designPrimitive.buttonBase,
          designPrimitive.focus,
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
