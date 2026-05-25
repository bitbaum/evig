'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** `elevated` lifts the dark-mode bg for use inside Modal/aside/toolbar containers. */
  variant?: 'default' | 'elevated'
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <textarea
      className={cn(
        variant === 'elevated' ? designPrimitive.form.textareaElevated : designPrimitive.form.textarea,
        className
      )}
      ref={ref}
      {...props}
    />
  )
)

Textarea.displayName = 'Textarea'

export { Textarea }
