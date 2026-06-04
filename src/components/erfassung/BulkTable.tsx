'use client'

/**
 * BulkTable Component
 *
 * Spreadsheet-like review table for bulk product entry.
 * Shows all products with inline editing, status indicators, and pagination.
 */

import { useState } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { BulkProduct, BulkProductStatus } from '@/types/erfassung'
import { BULK_TABLE_COLUMNS, BULK_LIMITS } from '@/config/erfassung'
import { KATEGORIEN, getConditionLabel } from '@/config/erfassung'
import { Input } from '@/components/ui/input'

interface BulkTableProps {
  products: BulkProduct[]
  page: number
  onPageChange: (page: number) => void
  onProductUpdate: (tempId: string, updates: Partial<BulkProduct>) => void
  onProductSelect: (tempId: string) => void
  onSelectAll: () => void
  onProductClick: (tempId: string) => void
}

function StatusIcon({ status }: { status: BulkProductStatus }) {
  switch (status) {
    case 'valid':
    case 'saved':
      return <CheckCircle2 className="w-4 h-4 text-primary-500" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-warning-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-error-500" />
    case 'processing':
      return <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
    default:
      return null
  }
}

function getCategoryLabel(value: string): string {
  const kat = KATEGORIEN.find(k => k.value === value)
  return kat ? `${kat.icon || ''} ${kat.label}` : value || '-'
}

export function BulkTable({
  products,
  page,
  onPageChange,
  onProductUpdate,
  onProductSelect,
  onSelectAll,
  onProductClick,
}: BulkTableProps) {
  const t = useTranslations('components.erfassung.bulkTable')
  const [editingCell, setEditingCell] = useState<{ tempId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const pageSize = BULK_LIMITS.pageSize
  const totalPages = Math.ceil(products.length / pageSize)
  const paginatedProducts = products.slice(page * pageSize, (page + 1) * pageSize)
  const allSelected = products.every(p => p._selected)

  const startEditing = (tempId: string, field: string, currentValue: string) => {
    setEditingCell({ tempId, field })
    setEditValue(currentValue)
  }

  const commitEdit = () => {
    if (editingCell) {
      onProductUpdate(editingCell.tempId, { [editingCell.field]: editValue } as Partial<BulkProduct>)
      setEditingCell(null)
    }
  }

  return (
    <div className="card-shell overflow-hidden">
      {/* Table wrapper with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-raised dark:bg-neutral-900/50 border-b border dark:border-neutral-700 sticky top-0">
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-4 h-4 text-action rounded border-neutral-300 focus:ring-primary-500"
                />
              </th>
              {/* Row number */}
              <th className="w-10 px-2 py-3 text-left text-text-secondary font-medium">{t('columnNumber')}</th>
              {/* Dynamic columns */}
              {BULK_TABLE_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-left text-text-secondary font-medium"
                  style={{ minWidth: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {/* Status */}
              <th className="w-16 px-3 py-3 text-center text-text-secondary font-medium">{t('columnStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product, index) => {
              const rowNum = page * pageSize + index + 1
              const isEditing = (field: string) =>
                editingCell?.tempId === product._tempId && editingCell?.field === field

              return (
                <tr
                  key={product._tempId}
                  className={`border-b border-subtle dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors cursor-pointer ${
                    product._status === 'error' ? 'bg-error-50/50 dark:bg-error-900/10' :
                    product._status === 'saved' ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                  onClick={() => onProductClick(product._tempId)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={product._selected}
                      onChange={() => onProductSelect(product._tempId)}
                      className="w-4 h-4 text-action rounded border-neutral-300 focus:ring-primary-500"
                    />
                  </td>
                  {/* Row number */}
                  <td className="px-2 py-2 text-text-muted">{rowNum}</td>
                  {/* Dynamic columns */}
                  {BULK_TABLE_COLUMNS.map(col => {
                    const value = (product as unknown as Record<string, unknown>)[col.key] as string || ''

                    // Display formatting for special columns
                    if (col.key === 'hauptkategorie' && !isEditing(col.key)) {
                      return (
                        <td key={col.key} className="px-3 py-2">
                          <span className="text-sm">{getCategoryLabel(value)}</span>
                        </td>
                      )
                    }

                    if (col.key === 'zustand' && !isEditing(col.key)) {
                      return (
                        <td key={col.key} className="px-3 py-2">
                          <span className="text-sm">{value ? getConditionLabel(value) : '-'}</span>
                        </td>
                      )
                    }

                    if (col.key === 'verkaufspreis' && !isEditing(col.key)) {
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 font-medium ${col.editable ? 'hover:bg-primary-50 dark:hover:bg-primary-900/20' : ''}`}
                          onClick={col.editable ? (e) => { e.stopPropagation(); startEditing(product._tempId, col.key, value) } : undefined}
                        >
                          {value ? `${value} CHF` : '-'}
                        </td>
                      )
                    }

                    // Editable cell (actively editing)
                    if (isEditing(col.key)) {
                      return (
                        <td key={col.key} className="px-1 py-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit()
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            autoFocus
                          />
                        </td>
                      )
                    }

                    // Normal cell — editable cells intercept click to start editing
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${col.editable ? 'hover:bg-primary-50 dark:hover:bg-primary-900/20' : ''} truncate max-w-[200px]`}
                        onClick={col.editable ? (e) => { e.stopPropagation(); startEditing(product._tempId, col.key, value) } : undefined}
                        title={value}
                      >
                        {value || <span className="text-neutral-300 dark:text-neutral-600">-</span>}
                      </td>
                    )
                  })}
                  {/* Status */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1" title={product._errors.join(', ')}>
                      <StatusIcon status={product._status} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border dark:border-neutral-700 bg-surface-raised dark:bg-neutral-900/50">
          <span className="text-sm text-text-secondary">
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, products.length)} {t('ofText')} {products.length} {t('productsText')}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center text-sm text-text-secondary px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
