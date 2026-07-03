'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SelectMode = 'single' | 'toggle' | 'range'

/**
 * useCellSelection — one selection model for every grid in the timecard tool
 * (SSOT). The month calendar selects dates; the day hour-grid selects time
 * slots; both behave identically:
 *
 *   - single  → replace the selection with [key]            (plain click)
 *   - toggle  → add/remove key, enabling NON-ADJACENT picks (Ctrl/Cmd-click)
 *   - range   → anchor…key inclusive                        (Shift-click / drag)
 *
 * Drag = mousedown (single, starts a drag) → mouseenter (range) → mouseup
 * (anywhere) ends it. The click that ends a drag is swallowed so it doesn't
 * collapse the range back to one cell.
 *
 * Keys are opaque strings in a caller-supplied order (dates "2026-06-03" or
 * slot indices "12"); range math uses that order.
 */
export function useCellSelection(orderedKeys: string[], initial?: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial ?? []))
  const [anchor, setAnchor] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragged = useRef(false)

  // Touch has no mouseenter-drag and no Ctrl/Shift, so taps build a range
  // instead: first tap anchors the start, the next tap extends to a range.
  // pointerdown tells us which device started the interaction so the
  // synthetic mouse events after a tap don't double-handle it.
  const lastPointerType = useRef<string>('mouse')

  useEffect(() => {
    if (!dragging) return
    const stop = () => setDragging(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [dragging])

  const select = useCallback(
    (key: string, mode: SelectMode) => {
      if (mode === 'toggle') {
        setSelected(prev => {
          const next = new Set(prev)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
        setAnchor(key)
      } else if (mode === 'range' && anchor) {
        const a = orderedKeys.indexOf(anchor)
        const b = orderedKeys.indexOf(key)
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a <= b ? [a, b] : [b, a]
          setSelected(new Set(orderedKeys.slice(lo, hi + 1)))
        } else {
          setSelected(new Set([key]))
          setAnchor(key)
        }
      } else {
        setSelected(new Set([key]))
        setAnchor(key)
      }
    },
    [anchor, orderedKeys],
  )

  const clear = useCallback(() => {
    setSelected(new Set())
    setAnchor(null)
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(orderedKeys))
    setAnchor(orderedKeys[0] ?? null)
  }, [orderedKeys])

  const setExact = useCallback((keys: string[]) => {
    setSelected(new Set(keys))
    setAnchor(keys[keys.length - 1] ?? null)
  }, [])

  // Per-cell DOM handlers — spread or call from the cell element.
  const onCellPointerDown = useCallback((e: { pointerType: string }) => {
    lastPointerType.current = e.pointerType
  }, [])

  const onCellMouseDown = useCallback(
    (key: string, e: { button: number; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; preventDefault: () => void }) => {
      // Touch taps arrive as synthetic mousedowns — handled in onCellClick.
      if (lastPointerType.current === 'touch') return
      if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return
      e.preventDefault()
      dragged.current = false
      setDragging(true)
      select(key, 'single')
    },
    [select],
  )

  const onCellMouseEnter = useCallback(
    (key: string) => {
      if (!dragging) return
      dragged.current = true
      select(key, 'range')
    },
    [dragging, select],
  )

  const onCellClick = useCallback(
    (key: string, e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => {
      if (dragged.current) {
        dragged.current = false
        return
      }
      if (lastPointerType.current === 'touch') {
        // Tap-tap range: anchored tap extends to a range, otherwise (re)anchor.
        if (anchor && anchor !== key && selected.size > 0) select(key, 'range')
        else select(key, 'single')
        return
      }
      select(key, e.shiftKey ? 'range' : e.ctrlKey || e.metaKey ? 'toggle' : 'single')
    },
    [select, anchor, selected],
  )

  return {
    selected,
    anchor,
    dragging,
    select,
    clear,
    selectAll,
    setExact,
    onCellPointerDown,
    onCellMouseDown,
    onCellMouseEnter,
    onCellClick,
  }
}
