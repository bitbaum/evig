'use client'

/**
 * Shared Modal wrapper component
 *
 * Provides consistent backdrop, header with title/close button,
 * escape-to-close, and click-outside-to-close behavior.
 */

import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  size?: keyof typeof SIZE_CLASSES
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md',
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Dialog */}
        <div
          role="dialog"
          aria-modal="true"
          className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl ${SIZE_CLASSES[size]} w-full p-6 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Schliessen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {children}
        </div>
      </div>
    </div>
  )
}
