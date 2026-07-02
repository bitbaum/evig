'use client'

import { useEffect } from 'react'

interface UseKeyboardShortcutsParams {
  isExpanded: boolean
  isSubmitting: boolean
  closePanelAndReset: () => void
}

/**
 * Keyboard shortcuts for the suggestion panel.
 * - ESC: close the panel
 * - Ctrl+Enter: submit the form
 */
export function useKeyboardShortcuts({ isExpanded, isSubmitting, closePanelAndReset }: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return

      if (e.key === 'Escape') {
        e.preventDefault()
        closePanelAndReset()
      }

      if (e.key === 'Enter' && e.ctrlKey && !isSubmitting) {
        e.preventDefault()
        const form = document.querySelector('[data-suggestion-panel] form') as HTMLFormElement
        if (form) {
          form.requestSubmit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, isSubmitting, closePanelAndReset])
}
