'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGridPointerInput } from './useGridPointerInput'

/**
 * useCellSelection — stateful multi-block selection for the day hour grid,
 * built on the shared useGridPointerInput gesture engine (the month calendar
 * uses the engine directly, with its selection state in useTimecardDraft).
 *
 * Interaction model (identical for mouse and touch):
 *   - Drag/swipe over cells PAINTS them; starting the drag on an already
 *     selected cell ERASES instead. Split shifts are therefore two drags:
 *     paint 08:00–12:00, lift, paint 14:00–17:00 — the gap becomes the break.
 *   - Click/tap toggles a single cell (no modifier needed).
 *   - Shift-click ADDS the anchor…cell range to the selection.
 *
 * Drags interpolate along `orderedKeys` between hit cells, so a fast swipe
 * can't leave holes — correct for a time ribbon where "from here to there"
 * means every slot in between.
 *
 * `version` increments on every USER mutation (never on setExact/clear), so
 * consumers can report user changes upward without echoing programmatic
 * re-seeds back to the parent.
 */
export function useCellSelection(orderedKeys: string[], initial?: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial ?? []))
  const [version, setVersion] = useState(0)
  const anchorRef = useRef<string | null>(null)
  const paintModeRef = useRef<'paint' | 'erase'>('paint')
  const selectedRef = useRef(selected)
  useEffect(() => {
    selectedRef.current = selected
  })

  const applySpan = useCallback(
    (fromKey: string, toKey: string, mode: 'paint' | 'erase') => {
      const a = orderedKeys.indexOf(fromKey)
      const b = orderedKeys.indexOf(toKey)
      if (a < 0 || b < 0) return
      const [lo, hi] = a <= b ? [a, b] : [b, a]
      setSelected(prev => {
        const next = new Set(prev)
        for (let i = lo; i <= hi; i++) {
          if (mode === 'paint') next.add(orderedKeys[i])
          else next.delete(orderedKeys[i])
        }
        return next
      })
      setVersion(v => v + 1)
    },
    [orderedKeys],
  )

  const input = useGridPointerInput({
    onDragStart: key => {
      paintModeRef.current = selectedRef.current.has(key) ? 'erase' : 'paint'
      anchorRef.current = key
      applySpan(key, key, paintModeRef.current)
    },
    onDragOver: (key, lastKey) => {
      applySpan(lastKey ?? key, key, paintModeRef.current)
    },
    onTap: (key, info) => {
      if (info.shiftKey && anchorRef.current) {
        applySpan(anchorRef.current, key, 'paint')
        return
      }
      anchorRef.current = key
      applySpan(key, key, selectedRef.current.has(key) ? 'erase' : 'paint')
    },
  })

  const clear = useCallback(() => {
    setSelected(new Set())
    anchorRef.current = null
  }, [])

  /** Programmatic re-seed (external prop change) — does NOT bump `version`. */
  const setExact = useCallback((keys: string[]) => {
    setSelected(new Set(keys))
    anchorRef.current = keys[keys.length - 1] ?? null
  }, [])

  return {
    selected,
    version,
    clear,
    setExact,
    getCellProps: input.getCellProps,
    containerProps: input.containerProps,
  }
}
