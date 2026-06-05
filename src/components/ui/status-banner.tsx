'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, type LucideIcon } from 'lucide-react'

/**
 * Block-level status callout. The companion to <StatusBadge> (inline pill):
 *   - StatusBadge → "this thing is in state X" (inline metadata)
 *   - StatusBanner → "something just happened / needs your attention" (block message)
 *
 * Three callsites converged on the same JSX shape (login error/success
 * banners, forgot-password error banner, register verify warnings).
 * Extracted per Rule of Three.
 *
 * Each variant has a default icon; pass `icon` to override.
 */

export type StatusBannerVariant = 'success' | 'error' | 'warning' | 'info'

interface StatusBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant: StatusBannerVariant
  /** Override the default icon. */
  icon?: LucideIcon
  /** When true, the banner announces itself via aria-live for screen readers. */
  announce?: boolean
}

const VARIANT_CLASSES: Record<StatusBannerVariant, {
  surface: string
  icon: string
  text: string
}> = {
  success: {
    surface: 'bg-action-muted border-action/30',
    icon: 'text-action',
    text: 'text-action',
  },
  error: {
    surface: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800/30',
    icon: 'text-error-600 dark:text-error-400',
    text: 'text-error-700 dark:text-error-400',
  },
  warning: {
    surface: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/30',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-800 dark:text-warning-200',
  },
  info: {
    surface: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/30',
    icon: 'text-info-600 dark:text-info-400',
    text: 'text-info-800 dark:text-info-200',
  },
}

const DEFAULT_ICON: Record<StatusBannerVariant, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export const StatusBanner = forwardRef<HTMLDivElement, StatusBannerProps>(
  ({ variant, icon, announce, className, children, ...props }, ref) => {
    const Icon = icon ?? DEFAULT_ICON[variant]
    const v = VARIANT_CLASSES[variant]

    return (
      <div
        ref={ref}
        role="alert"
        // Errors are urgent → assertive. Success/warning/info → polite.
        aria-live={announce !== false ? (variant === 'error' ? 'assertive' : 'polite') : undefined}
        className={cn(
          'p-4 rounded-lg flex items-start gap-3 border',
          v.surface,
          className,
        )}
        {...props}
      >
        <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', v.icon)} aria-hidden="true" />
        <div className={cn('text-sm', v.text)}>{children}</div>
      </div>
    )
  },
)
StatusBanner.displayName = 'StatusBanner'
