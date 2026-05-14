'use client'

import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(designPrimitive.form.select, 'w-full', className)}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
)

Select.displayName = 'Select'

export { Select }
