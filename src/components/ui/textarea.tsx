'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(designPrimitive.form.textarea, className)}
      ref={ref}
      {...props}
    />
  )
)

Textarea.displayName = 'Textarea'

export { Textarea }
