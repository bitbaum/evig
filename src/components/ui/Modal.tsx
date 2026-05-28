'use client'

/**
 * Shared Modal wrapper component
 *
 * Provides consistent backdrop, header with title/close button,
 * escape-to-close, and click-outside-to-close behavior.
 */

import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

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
  const t = useTranslations('common')
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
          className={`relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl ${SIZE_CLASSES[size]} w-full p-4 sm:p-6 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Heading level={3} className="text-lg font-semibold text-neutral-900 dark:text-white">
              {title}
            </Heading>
            <button
              onClick={onClose}
              className="-mr-2 sm:-mr-1 inline-flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label={t('close')}
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
