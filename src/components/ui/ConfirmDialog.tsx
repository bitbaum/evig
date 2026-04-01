'use client'

/**
 * ConfirmDialog - Reusable confirmation dialog
 *
 * Used for destructive actions like delete, with customizable title,
 * message, and button labels.
 */

import { X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

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
  if (!isOpen) return null

  const styles = VARIANT_STYLES[variant]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />

        {/* Dialog */}
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {variant === 'success' ? (
                <CheckCircle className={`w-5 h-5 ${styles.icon}`} />
              ) : (
                <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
              )}
              <h3 id="confirm-dialog-title" className={`text-lg font-semibold ${styles.title}`}>
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
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
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white ${styles.button} rounded-lg disabled:opacity-50 flex items-center gap-2`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
