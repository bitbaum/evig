'use client'

/**
 * Pagination Component
 *
 * Reusable pagination controls for lists.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5 // Max pages to show

    if (totalPages <= showPages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show subset with ellipsis
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.06] rounded-xl">
      {/* Info */}
      <div className="text-sm text-neutral-700 dark:text-neutral-300">
        <span className="font-medium">{start}</span> bis{' '}
        <span className="font-medium">{end}</span> von{' '}
        <span className="font-medium">{total}</span> Einträgen
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((p, i) =>
          typeof p === 'number' ? (
            <button
              key={i}
              onClick={() => onPageChange(p)}
              className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="px-2 text-neutral-400">
              {p}
            </span>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
