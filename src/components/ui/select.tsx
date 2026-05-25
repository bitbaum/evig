'use client'

import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
  /** `elevated` lifts the dark-mode bg for use inside Modal/aside/toolbar containers. */
  variant?: 'default' | 'elevated'
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, variant = 'default', ...props }, ref) => (
    <select
      className={cn(
        variant === 'elevated' ? designPrimitive.form.selectElevated : designPrimitive.form.select,
        'w-full',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
)

Select.displayName = 'Select'

export { Select }
