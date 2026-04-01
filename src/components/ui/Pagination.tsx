'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  /** For server-rendered pages: base URL with query params (page param will be appended/replaced) */
  hrefBase?: string
  /** For client components: called when user selects a page */
  onPageChange?: (page: number) => void
}

const btnClass = (active: boolean, disabled = false) =>
  `inline-flex items-center justify-center w-8 h-8 text-sm rounded-md transition-colors ${
    disabled
      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
      : active
      ? 'bg-blue-600 text-white font-medium'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
  }`

/** Build a page href by replacing or appending the `page` param in `hrefBase` */
function makeHref(hrefBase: string, page: number): string {
  const [path, qs] = hrefBase.split('?')
  const p = new URLSearchParams(qs || '')
  p.set('page', String(page))
  return `${path}?${p.toString()}`
}

function PageItem({
  page,
  active,
  hrefBase,
  onPageChange,
}: {
  page: number
  active: boolean
  hrefBase?: string
  onPageChange?: (page: number) => void
}) {
  if (hrefBase) {
    return (
      <Link href={makeHref(hrefBase, page)} className={btnClass(active)}>
        {page}
      </Link>
    )
  }
  return (
    <button
      onClick={() => onPageChange?.(page)}
      disabled={active}
      className={btnClass(active)}
    >
      {page}
    </button>
  )
}

function NavButton({
  page,
  disabled,
  children,
  hrefBase,
  onPageChange,
}: {
  page: number
  disabled: boolean
  children: React.ReactNode
  hrefBase?: string
  onPageChange?: (page: number) => void
}) {
  if (hrefBase) {
    return disabled ? (
      <span className={btnClass(false, true)}>{children}</span>
    ) : (
      <Link href={makeHref(hrefBase, page)} className={btnClass(false)}>
        {children}
      </Link>
    )
  }
  return (
    <button
      onClick={() => onPageChange?.(page)}
      disabled={disabled}
      className={btnClass(false, disabled)}
    >
      {children}
    </button>
  )
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  hrefBase,
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

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {from}–{to} von {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <NavButton page={currentPage - 1} disabled={currentPage <= 1} hrefBase={hrefBase} onPageChange={onPageChange}>
          <ChevronLeft className="w-4 h-4" />
        </NavButton>

        {pageList.map((page, i) => {
          const prev = pageList[i - 1]
          return (
            <div key={page} className="flex items-center gap-1">
              {prev && page - prev > 1 && (
                <span className="w-8 text-center text-sm text-gray-600">...</span>
              )}
              <PageItem page={page} active={page === currentPage} hrefBase={hrefBase} onPageChange={onPageChange} />
            </div>
          )
        })}

        <NavButton page={currentPage + 1} disabled={currentPage >= totalPages} hrefBase={hrefBase} onPageChange={onPageChange}>
          <ChevronRight className="w-4 h-4" />
        </NavButton>
      </div>
    </div>
  )
}
