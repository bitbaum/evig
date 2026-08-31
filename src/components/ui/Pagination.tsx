'use client';

import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NAV_STATE } from '@/lib/design/nav';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  /** For server-rendered pages: base URL with query params (page param will be appended/replaced) */
  hrefBase?: string;
  /** For client components: called when user selects a page */
  onPageChange?: (page: number) => void;
}

// min-w/min-h ensure 44×44px touch targets (WCAG 2.5.5) even when visually smaller.
// The current page is styled by NAV_STATE.chip.active — the one "selected item" fill.
const btnClass = (active: boolean, disabled = false) =>
  cn(
    'inline-flex items-center justify-center min-w-11 min-h-11 w-9 h-9 text-sm rounded-md transition-colors',
    disabled
      ? 'text-text-muted cursor-not-allowed'
      : active
        ? cn(NAV_STATE.chip.active, 'font-medium')
        : 'text-text-secondary hover:bg-surface-raised',
  );

/** Build a page href by replacing or appending the `page` param in `hrefBase` */
function makeHref(hrefBase: string, page: number): string {
  const [path, qs] = hrefBase.split('?');
  const p = new URLSearchParams(qs || '');
  p.set('page', String(page));
  return `${path}?${p.toString()}`;
}

function PageItem({
  page,
  active,
  hrefBase,
  onPageChange,
}: {
  page: number;
  active: boolean;
  hrefBase?: string;
  onPageChange?: (page: number) => void;
}) {
  if (hrefBase) {
    return (
      <Link
        href={makeHref(hrefBase, page)}
        aria-current={active ? 'page' : undefined}
        className={btnClass(active)}
      >
        {page}
      </Link>
    );
  }
  return (
    <button
      onClick={() => onPageChange?.(page)}
      disabled={active}
      aria-current={active ? 'page' : undefined}
      className={btnClass(active)}
    >
      {page}
    </button>
  );
}

function NavButton({
  page,
  disabled,
  label,
  children,
  hrefBase,
  onPageChange,
}: {
  page: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
  hrefBase?: string;
  onPageChange?: (page: number) => void;
}) {
  if (hrefBase) {
    return disabled ? (
      <span aria-hidden="true" className={btnClass(false, true)}>
        {children}
      </span>
    ) : (
      <Link href={makeHref(hrefBase, page)} aria-label={label} className={btnClass(false)}>
        {children}
      </Link>
    );
  }
  return (
    <button
      onClick={() => onPageChange?.(page)}
      disabled={disabled}
      aria-label={label}
      className={btnClass(false, disabled)}
    >
      {children}
    </button>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  hrefBase,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations('components.pagination');
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Build visible page numbers: always show first, last, and ±2 around current
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.add(i);
  }
  const pageList = Array.from(pages).sort((a, b) => a - b);

  return (
    <nav
      aria-label={t('label')}
      className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 border-t border-subtle"
    >
      <p className="text-sm text-text-tertiary">
        {from}–{to} {t('of')} {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <NavButton
          page={currentPage - 1}
          disabled={currentPage <= 1}
          label={t('previous')}
          hrefBase={hrefBase}
          onPageChange={onPageChange}
        >
          <ChevronLeft className="w-4 h-4" />
        </NavButton>

        {/* Page numbers hidden on mobile — only prev/next shown on small screens */}
        <div className="hidden sm:flex items-center gap-1">
          {pageList.map((page, i) => {
            const prev = pageList[i - 1];
            return (
              <div key={page} className="flex items-center gap-1">
                {prev && page - prev > 1 && (
                  <span
                    className="min-w-11 text-center text-sm text-text-muted"
                    aria-label={t('morePages')}
                  >
                    …
                  </span>
                )}
                <PageItem
                  page={page}
                  active={page === currentPage}
                  hrefBase={hrefBase}
                  onPageChange={onPageChange}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile: show current/total instead of page buttons */}
        <span className="sm:hidden text-sm text-text-tertiary px-2">
          {currentPage} / {totalPages}
        </span>

        <NavButton
          page={currentPage + 1}
          disabled={currentPage >= totalPages}
          label={t('next')}
          hrefBase={hrefBase}
          onPageChange={onPageChange}
        >
          <ChevronRight className="w-4 h-4" />
        </NavButton>
      </div>
    </nav>
  );
}
