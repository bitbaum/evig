'use client'

/**
 * ConfirmDialog - Reusable confirmation dialog
 *
 * Used for destructive actions like delete, with customizable title,
 * message, and button labels. Built on the shared Modal wrapper.
 */

import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  itemName?: string
  /**
   * Optional rich content rendered below the message. Use this when the
   * confirm needs a list of consequences, a checklist of prerequisites,
   * or any other non-string detail (e.g. "12 action items will become
   * uneditable; 3 attendees still unmapped").
   */
  details?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string | null
  variant?: 'danger' | 'warning' | 'success' | 'default'
  onConfirm: () => void
  onClose: () => void
}

const VARIANT_STYLES = {
  danger: {
    title: 'text-error-600 dark:text-error-400',
    button: 'bg-error-600 hover:bg-error-700',
    icon: 'text-error-500',
  },
  warning: {
    title: 'text-secondary-600 dark:text-secondary-400',
    button: 'bg-secondary-600 hover:bg-secondary-700',
    icon: 'text-secondary-500',
  },
  success: {
    title: 'text-action',
    button: 'bg-action hover:bg-action-hover text-action-text',
    icon: 'text-action',
  },
  default: {
    title: 'text-text-primary',
    button: 'bg-action hover:bg-action-hover text-action-text',
    icon: 'text-text-secondary',
  },
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  itemName,
  details,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  error = null,
  variant = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const effectiveConfirmLabel = confirmLabel ?? tCommon('confirm')
  const effectiveCancelLabel = cancelLabel ?? tCommon('cancel')
  const styles = VARIANT_STYLES[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {/* Variant icon next to title (rendered above Modal's title via negative margin) */}
      <div className="flex items-center gap-2 -mt-4 mb-4">
        {variant === 'success' ? (
          <CheckCircle className={`w-5 h-5 ${styles.icon}`} />
        ) : (
          <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
        )}
        <span className={`text-lg font-semibold ${styles.title}`}>
          {title}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="mb-6">
        <p className="text-text-secondary mb-2">
          {message}
        </p>
        {itemName && (
          <div className="p-3 bg-surface-raised rounded-lg">
            <p className="font-medium text-text-primary">
              {itemName}
            </p>
          </div>
        )}
        {details && (
          <div className="mt-3">
            {details}
          </div>
        )}
        {variant === 'danger' && (
          <p className="mt-3 text-sm text-error-600 dark:text-error-400">
            {tErrors('irreversible')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={onClose} disabled={isLoading} variant="ghost" size="sm">
          {effectiveCancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          size="sm"
          className={`${styles.button} gap-2`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {effectiveConfirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
