'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * ContextMenu — a small, reusable cursor-positioned menu (SSOT for right-click
 * menus). Open it by setting `position` to the event's {x, y}; close it via
 * `onClose`. It closes itself on outside-click, Escape, scroll, or resize, and
 * clamps itself inside the viewport so it never spills off-screen.
 *
 * It is intentionally generic: callers pass a flat list of items (with optional
 * separators and a `danger` tone). No domain knowledge lives here.
 */

export interface ContextMenuItem {
  label: string
  onSelect: () => void
  icon?: ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
  /** Draw a divider above this item. */
  separatorBefore?: boolean
}

export interface ContextMenuPosition {
  x: number
  y: number
}

export function ContextMenu({
  position,
  items,
  onClose,
  header,
}: {
  position: ContextMenuPosition | null
  items: ContextMenuItem[]
  onClose: () => void
  /** Optional muted label at the top (e.g. "3 Tage"). */
  header?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<ContextMenuPosition | null>(position)

  // Keep local coords in sync, then clamp to the viewport once measured.
  // (Measuring requires a post-render pass, so a setState in this layout
  // effect is the legitimate pattern here.)
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (!position) {
      setCoords(null)
      return
    }
    const el = ref.current
    const margin = 8
    let { x, y } = position
    if (el) {
      const { width, height } = el.getBoundingClientRect()
      if (x + width + margin > window.innerWidth) x = Math.max(margin, window.innerWidth - width - margin)
      if (y + height + margin > window.innerHeight) y = Math.max(margin, window.innerHeight - height - margin)
    }
    setCoords({ x, y })
  }, [position])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!position) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Capture-phase pointerdown so a click anywhere (incl. another cell) closes first.
    window.addEventListener('mousedown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('mousedown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [position, onClose])

  if (!position || !coords) return null

  return (
    <div
      ref={ref}
      role="menu"
      style={{ top: coords.y, left: coords.x }}
      className="fixed z-50 min-w-[12rem] overflow-hidden rounded-lg border border-strong bg-surface-base py-1 shadow-md"
    >
      {header && (
        <p className="px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-text-tertiary">
          {header}
        </p>
      )}
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`}>
          {item.separatorBefore && <div className="my-1 border-t border-subtle" />}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect()
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-40',
              item.tone === 'danger'
                ? 'text-error-600 hover:bg-error-50'
                : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
            )}
          >
            {item.icon && <span className="shrink-0 text-text-tertiary">{item.icon}</span>}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}
