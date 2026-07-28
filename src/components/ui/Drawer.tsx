'use client'

/**
 * Drawer — the edge-anchored overlay primitive (the sibling of <Modal>, which
 * is the centered dialog). The SSOT for right-side sheets (mobile menu, message
 * sidebar) and bottom sheets (dashboard "Mehr").
 *
 * Before this primitive, three overlays hand-rolled the same shell and drifted:
 * MobileMenu (portal + focus-trap + scroll-lock, the good reference),
 * DashboardMobileNav's sheet (same, duplicated), and MessageSidebar (NO portal,
 * NO focus-trap, NO scroll-lock, backdrop that didn't close, deprecated
 * `bg-opacity-50`). Drawer gives all three: a portal (so it escapes transformed
 * ancestors like the smart-hiding header), the shared `useFocusTrap`
 * (initial focus + Tab cycle + Escape + focus restore), body scroll-lock, and a
 * click-to-close backdrop.
 *
 * Caller owns the panel *contents* (header, body) and the open state. The panel
 * width/height is a sensible default per side; override via `className`. Use
 * `rootClassName` for viewport gating (e.g. `xl:hidden`, `lg:hidden`).
 */

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'

type DrawerSide = 'right' | 'bottom'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  /** Which edge the panel is anchored to. Default 'right'. */
  side?: DrawerSide
  /** Accessible name for the dialog (required — it's `aria-label`). */
  ariaLabel: string
  /** Classes for the sliding panel (width / max-height / padding overrides). */
  className?: string
  /** Classes for the root portal layer — e.g. `xl:hidden` / `lg:hidden`. */
  rootClassName?: string
  children: ReactNode
}

// Panel shape per side. `bg-surface-base` + border matches the design system
// (border-only separation; the translucent backdrop supplies the plane lift).
const SIDE_PANEL: Record<DrawerSide, string> = {
  right: 'inset-y-0 right-0 w-full sm:max-w-md border-l border',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-subtle',
}

export function Drawer({
  isOpen,
  onClose,
  side = 'right',
  ariaLabel,
  className,
  rootClassName,
  children,
}: DrawerProps) {
  // Escape-to-close, initial focus, Tab trap and focus restore all live in the
  // shared hook; attach its ref to the panel.
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
  // Portals need the document — mount after first client render.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className={cn('fixed inset-0 z-100', rootClassName)}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'fixed z-101 flex flex-col bg-surface-base focus:outline-hidden',
          SIDE_PANEL[side],
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
