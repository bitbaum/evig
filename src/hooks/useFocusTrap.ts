'use client'

/**
 * useFocusTrap — accessible focus management for dialogs, drawers and any
 * modal overlay.
 *
 * When `active` becomes true it:
 *   - remembers the element that had focus (so it can be restored on close),
 *   - moves focus to the first focusable element inside the container
 *     (or the container itself if it has none),
 *   - traps Tab / Shift+Tab so focus cycles within the container,
 *   - calls `onEscape` when Escape is pressed.
 *
 * When `active` becomes false (or the component unmounts) it restores focus
 * to whatever was focused before — but only if that element is still in the
 * document, so keyboard users don't get dumped back at the top of the page.
 *
 * Attach the returned ref to the dialog container (give it `tabIndex={-1}`
 * so it can receive focus programmatically without joining the tab order).
 *
 * The trap is intentionally minimal (no `focus-trap-react` dependency); it
 * covers the common case — overlays contain a handful of interactive
 * elements, not a treeview. Swap to a tested library here only if a future
 * overlay needs richer focus management.
 */

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean,
  onEscape?: () => void,
): RefObject<T> {
  const containerRef = useRef<T>(null)
  // Track the element focused when the trap activated, to restore on close.
  const previousFocusRef = useRef<HTMLElement | null>(null)
  // Keep the latest onEscape without re-running the trap effect (which would
  // re-steal focus) whenever the callback's identity changes.
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    previousFocusRef.current = document.activeElement as HTMLElement | null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscapeRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !container) return
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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

    document.addEventListener('keydown', handleKeyDown)

    // Move focus into the container so screen readers announce its contents.
    const focusables = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusables?.[0] ?? container)?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const prev = previousFocusRef.current
      if (prev && document.body.contains(prev)) {
        prev.focus()
      }
    }
  }, [active])

  return containerRef
}
