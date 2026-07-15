import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { adminTable, adminSurface, adminInteractive } from '@/lib/admin-ui'

/**
 * AdminTable — the SSOT for admin data tables.
 *
 * Before this, ~23 admin pages hand-rolled the same
 * `div.overflow-x-auto > table > thead > tbody.divide-y` scaffold with the
 * `adminTable.*` class tokens, and had already drifted (some hardcoded
 * `bg-surface-raised` on thead instead of `adminTable.thead`). This owns the
 * structure once; callers supply columns (render-prop cells for full freedom:
 * links, badges, action selects) + a stable row key.
 *
 * Below md each row renders as a stacked card instead of a table row — a
 * seven-column table on a phone was a blind horizontal scroll. The first
 * column is treated as the row's identity (card title); the rest render as
 * label/value lines.
 *
 * Pure render (no hooks) → usable from both Server and Client components.
 */
export interface AdminTableColumn<T> {
  /** Column header content. */
  header: ReactNode
  /** Cell renderer for a row. */
  cell: (row: T) => ReactNode
  /** Extra classes applied to BOTH the th and the td (width, wrapping, etc.). */
  className?: string
  /** Text alignment for header + cells. */
  align?: 'left' | 'right' | 'center'
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[]
  rows: T[]
  /** Stable unique key per row. */
  rowKey: (row: T) => string
  /** Optional: highlight selected rows (bulk-action selection). */
  isSelected?: (row: T) => boolean
  className?: string
}

const alignClass = (align?: 'left' | 'right' | 'center') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''

export function AdminTable<T>({ columns, rows, rowKey, isSelected, className }: AdminTableProps<T>) {
  const [identityColumn, ...detailColumns] = columns

  return (
    <div className={cn(adminSurface.table, className)}>
      {/* Phones/small tablets: stacked cards, no horizontal scrolling. */}
      <ul className="divide-y divide-subtle md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn('space-y-2 p-4', isSelected?.(row) && adminInteractive.rowSelected)}
          >
            <div className="text-sm font-medium text-text-primary">
              {identityColumn.cell(row)}
            </div>
            <dl className="space-y-1.5">
              {detailColumns.map((col, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="shrink-0 text-text-tertiary">{col.header}</dt>
                  <dd className="min-w-0 text-right text-text-secondary">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* md and up: the classic table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className={adminTable.thead}>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={cn(adminTable.th, alignClass(col.align), col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(adminTable.tr, isSelected?.(row) && adminInteractive.rowSelected)}
              >
                {columns.map((col, i) => (
                  <td key={i} className={cn(adminTable.td, alignClass(col.align), col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
