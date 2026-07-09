'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * BulkActionBar — SSOT for the admin batch-action bar.
 *
 * The sticky "{n} ausgewählt + clear + actions" bar used to be copy-pasted into
 * every table with multi-select (timecards approvals, erfassung review, ...).
 * This is the single visual home for it: pair it with `useRowSelection` and drop
 * the caller's action buttons in as {children}.
 *
 * Renders nothing until `selectedCount > 0`.
 */
interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  /** Localised noun for the selection count, e.g. "ausgewählt". */
  label?: string
  /** Localised text for the clear button. */
  clearLabel?: string
  /** The caller's action buttons (batch-approve, batch-delete, ...). */
  children?: React.ReactNode
}

export function BulkActionBar({
  selectedCount,
  onClear,
  label = 'ausgewählt',
  clearLabel = 'Auswahl aufheben',
  children,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-strong bg-surface-overlay/95 px-4 py-3 shadow-md backdrop-blur-sm dark:border-action/30">
        <span className="text-sm font-semibold text-text">
          {selectedCount} {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-sm"
        >
          <X className="w-4 h-4" />
          {clearLabel}
        </Button>
        {children ? <div className="flex gap-2 sm:ml-2">{children}</div> : null}
      </div>
    </div>
  )
}
