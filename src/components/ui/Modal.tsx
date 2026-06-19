'use client'

/**
 * Shared Modal wrapper component
 *
 * Provides consistent backdrop, header with title/close button,
 * click-outside-to-close, and accessible focus management
 * (escape-to-close, initial focus, focus restoration on close, and a
 * Tab trap) via the shared `useFocusTrap` hook.
 */

import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { useFocusTrap } from '@/hooks/useFocusTrap'

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
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

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

        {/* Dialog — tabIndex=-1 so it can receive focus programmatically
            but isn't part of normal tab order. */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          className={`relative card-shell ${SIZE_CLASSES[size]} w-full p-4 sm:p-6 focus:outline-hidden ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Heading id="modal-title" level={3} className="text-lg font-semibold text-text-primary">
              {title}
            </Heading>
            <button
              onClick={onClose}
              className="-mr-2 sm:-mr-1 inline-flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-raised transition-colors"
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
