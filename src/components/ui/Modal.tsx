'use client'

/**
 * Shared Modal wrapper component
 *
 * Provides consistent backdrop, header with title/close button,
 * escape-to-close, click-outside-to-close, initial-focus, focus
 * restoration on close, and a focus trap that cycles Tab inside
 * the dialog.
 *
 * The trap is intentionally minimal (no `focus-trap-react` dep);
 * it covers the common case — modals contain a few interactive
 * elements, not a treeview. If a future modal needs more complex
 * focus management, swap to a tested library here only.
 */

import { useEffect, useCallback, useRef, type ReactNode } from 'react'
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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md',
}: ModalProps) {
  const t = useTranslations('common')
  const dialogRef = useRef<HTMLDivElement>(null)
  // Track the element that was focused when the modal opened so we can
  // restore focus on close. Without this, keyboard users land back at the
  // top of the page every time.
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return

    // Remember whoever opened the modal so we can return focus on close.
    previousFocusRef.current = document.activeElement as HTMLElement | null

    document.addEventListener('keydown', handleKeyDown)

    // Move focus into the dialog. Prefer the first focusable element
    // (typically a form input or close button) so screen readers
    // announce the modal contents immediately.
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const target = focusables?.[0] ?? dialogRef.current
    target?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to whatever opened the modal — only if that
      // element is still in the document (e.g. the trigger wasn't
      // unmounted while the modal was open).
      const prev = previousFocusRef.current
      if (prev && document.body.contains(prev)) {
        prev.focus()
      }
    }
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

        {/* Dialog — tabIndex=-1 so it can receive focus programmatically
            but isn't part of normal tab order. */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          className={`relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl ${SIZE_CLASSES[size]} w-full p-4 sm:p-6 focus:outline-none ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Heading id="modal-title" level={3} className="text-lg font-semibold text-neutral-900 dark:text-white">
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
