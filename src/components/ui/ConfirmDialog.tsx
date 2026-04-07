'use client'

/**
 * ConfirmDialog - Reusable confirmation dialog
 *
 * Used for destructive actions like delete, with customizable title,
 * message, and button labels. Built on the shared Modal wrapper.
 */

import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  itemName?: string
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
    title: 'text-red-600 dark:text-red-400',
    button: 'bg-red-600 hover:bg-red-700',
    icon: 'text-red-500',
  },
  warning: {
    title: 'text-orange-600 dark:text-orange-400',
    button: 'bg-orange-600 hover:bg-orange-700',
    icon: 'text-orange-500',
  },
  success: {
    title: 'text-green-600 dark:text-green-400',
    button: 'bg-green-600 hover:bg-green-700',
    icon: 'text-green-500',
  },
  default: {
    title: 'text-gray-900 dark:text-white',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    icon: 'text-gray-600',
  },
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  itemName,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  isLoading = false,
  error = null,
  variant = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
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
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="mb-6">
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          {message}
        </p>
        {itemName && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">
              {itemName}
            </p>
          </div>
        )}
        {variant === 'danger' && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={onClose} disabled={isLoading} variant="ghost" size="sm">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          size="sm"
          className={`${styles.button} gap-2`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
