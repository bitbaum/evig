'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** `elevated` lifts the dark-mode bg for use inside Modal/aside/toolbar containers. */
  variant?: 'default' | 'elevated'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <input
      className={cn(
        variant === 'elevated' ? designPrimitive.form.inputElevated : designPrimitive.form.input,
        className
      )}
      ref={ref}
      {...props}
    />
  )
)

Input.displayName = 'Input'

export { Input }
