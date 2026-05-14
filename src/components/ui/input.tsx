'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(designPrimitive.form.input, className)}
      ref={ref}
      {...props}
    />
  )
)

Input.displayName = 'Input'

export { Input }
