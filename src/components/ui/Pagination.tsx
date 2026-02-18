'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  /** For server-rendered pages: builds the href for a given page number */
  buildHref?: (page: number) => string
  /** For client components: called when user selects a page */
  onPageChange?: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  buildHref,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  // Build visible page numbers: always show first, last, and ±2 around current
  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.add(i)
  }
  const pageList = Array.from(pages).sort((a, b) => a - b)

  const buttonClass = (active: boolean, disabled = false) =>
    `inline-flex items-center justify-center w-8 h-8 text-sm rounded-md transition-colors ${
      disabled
        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        : active
        ? 'bg-blue-600 text-white font-medium'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`

  function PageItem({ page }: { page: number }) {
    const active = page === currentPage
    if (buildHref) {
      return (
        <Link href={buildHref(page)} className={buttonClass(active)}>
          {page}
        </Link>
      )
    }
    return (
      <button
        onClick={() => onPageChange?.(page)}
        disabled={active}
        className={buttonClass(active)}
      >
        {page}
      </button>
    )
  }

  function NavButton({ page, disabled, children }: { page: number; disabled: boolean; children: React.ReactNode }) {
    if (buildHref) {
      return disabled ? (
        <span className={buttonClass(false, true)}>{children}</span>
      ) : (
        <Link href={buildHref(page)} className={buttonClass(false)}>
          {children}
        </Link>
      )
    }
    return (
      <button
        onClick={() => onPageChange?.(page)}
        disabled={disabled}
        className={buttonClass(false, disabled)}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {from}–{to} von {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <NavButton page={currentPage - 1} disabled={currentPage <= 1}>
          <ChevronLeft className="w-4 h-4" />
        </NavButton>

        {pageList.map((page, i) => {
          const prev = pageList[i - 1]
          return (
            <div key={page} className="flex items-center gap-1">
              {prev && page - prev > 1 && (
                <span className="w-8 text-center text-sm text-gray-400">…</span>
              )}
              <PageItem page={page} />
            </div>
          )
        })}

        <NavButton page={currentPage + 1} disabled={currentPage >= totalPages}>
          <ChevronRight className="w-4 h-4" />
        </NavButton>
      </div>
    </div>
  )
}
