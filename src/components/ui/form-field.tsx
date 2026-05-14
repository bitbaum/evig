import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export interface FormFieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode
}

export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
          {required && <span className="ml-1 text-error-500" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className={designPrimitive.form.hint}>{hint}</p>
      )}
      {error && (
        <p className={designPrimitive.form.error} role="alert">{error}</p>
      )}
    </div>
  )
}
