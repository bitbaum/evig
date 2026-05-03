'use client'

import { ButtonHTMLAttributes, forwardRef, ElementType } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: ElementType
  variant?: 'default' | 'primary' | 'outline' | 'outline-light' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, as: Tag = 'button', variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Tag
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap',
          {
            'bg-primary-600 text-white hover:bg-primary-700': variant === 'default',
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700': variant === 'outline',
            'border border-white/70 bg-transparent text-white hover:bg-white hover:text-neutral-900': variant === 'outline-light',
            'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600': variant === 'secondary',
            'bg-transparent hover:bg-white/10 text-inherit': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
          },
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