'use client'

import { useCallback, useMemo, useState } from 'react'

/**
 * useRowSelection — SSOT for admin row multi-select.
 *
 * The `Set<string>` + toggle / toggleAll / allSelected shape used to be
 * copy-pasted into every table that needs batch actions (timecards approvals,
 * erfassung review, ...). This is the single generic home for that logic so a
 * table only supplies its rows + an id accessor.
 *
 * Pair it with <BulkActionBar> for the visible bar.
 *
 * @param rows   the CURRENT rows (already filtered) the user can act on
 * @param getId  stable id accessor for a row
 *
 * `toggleAll` selects every current row when not all are selected, otherwise
 * clears. Selection is intentionally NOT auto-pruned here — callers that mutate
 * `rows` (e.g. after a batch action) should `clear()` or reconcile explicitly.
 */
export function useRowSelection<T>(rows: T[], getId: (row: T) => string) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allSelected = rows.length > 0 && rows.every(row => selected.has(getId(row)))

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      const allIds = rows.map(getId)
      const isAll = allIds.length > 0 && allIds.every(id => prev.has(id))
      return isAll ? new Set() : new Set(allIds)
    })
  }, [rows, getId])

  const clear = useCallback(() => setSelected(new Set()), [])

  const selectedCount = selected.size

  return useMemo(
    () => ({ selected, isSelected, toggle, toggleAll, clear, allSelected, selectedCount }),
    [selected, isSelected, toggle, toggleAll, clear, allSelected, selectedCount]
  )
}
