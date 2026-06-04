'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type StatusVariant = 'warning' | 'error' | 'success' | 'info' | 'neutral'
export type StatusTone = 'subtle' | 'solid'
export type StatusSize = 'sm' | 'md'

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant
  tone?: StatusTone
  size?: StatusSize
}

const TONE_CLASSES: Record<StatusVariant, Record<StatusTone, string>> = {
  warning: {
    subtle: 'bg-warning-50 text-warning-700 dark:text-warning-400',
    solid: 'bg-warning-100 text-warning-800 dark:text-warning-300',
  },
  error: {
    subtle: 'bg-error-50 text-error-600 dark:text-error-400',
    solid: 'bg-error-100 text-error-800 dark:text-error-300',
  },
  success: {
    subtle: 'bg-success-50 text-success-700 dark:text-success-400',
    solid: 'bg-success-100 text-success-800 dark:text-success-300',
  },
  info: {
    subtle: 'bg-info-50 text-info-700 dark:text-info-400',
    solid: 'bg-info-100 text-info-800 dark:text-info-300',
  },
  neutral: {
    subtle: 'bg-surface-raised text-text-secondary',
    solid: 'bg-surface-overlay text-text-primary',
  },
}

const SIZE_CLASSES: Record<StatusSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ variant, tone = 'solid', size = 'sm', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        TONE_CLASSES[variant][tone],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  ),
)
StatusBadge.displayName = 'StatusBadge'
