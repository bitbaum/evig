'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'

/**
 * AdminListShell — shared scaffolding for admin list pages.
 *
 * Collapses the error / loading / empty / results-header boilerplate that was
 * hand-rolled in every *ListClient (users, blog, team, decisions, …). Pages
 * pass their own filters and table/pagination as slots; the shell owns the
 * four states and renders the children only when there is data.
 */
export interface AdminListShellProps {
  /** Filter UI, rendered above the state area (always visible). */
  filters?: ReactNode
  loading: boolean
  /** Optional custom loading UI (e.g. a skeleton grid). Defaults to a spinner. */
  loadingSlot?: ReactNode
  error?: string | null
  /** Retry handler for the error state and the results-header refresh button. */
  onRetry?: () => void
  /** True when there are no items to show (and not loading/error). */
  isEmpty: boolean
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription?: string
  /** Optional CTA in the empty state (e.g. a "create the first one" button). */
  emptyAction?: ReactNode
  /** When filters are active, the empty state offers a reset link. */
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  /** e.g. "42 Benutzer gefunden" — shown in the results header. */
  resultsLabel?: ReactNode
  /** Table + pagination; rendered only when there is data. */
  children: ReactNode
}

export function AdminListShell({
  filters,
  loading,
  loadingSlot,
  error,
  onRetry,
  isEmpty,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  hasActiveFilters = false,
  onResetFilters,
  resultsLabel,
  children,
}: AdminListShellProps) {
  return (
    <div className="space-y-6">
      {filters}

      {error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
          <div className="flex items-center justify-between gap-4">
            <p className="text-error-700 dark:text-error-300">{error}</p>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2 text-error-600 hover:text-error-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Erneut versuchen
              </Button>
            )}
          </div>
        </div>
      ) : loading ? (
        loadingSlot ?? (
          <div className="rounded-xl border border-subtle bg-surface-base p-8 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-text-tertiary" aria-hidden="true" />
            <p className="text-text-tertiary">Wird geladen …</p>
          </div>
        )
      ) : isEmpty ? (
        <div className="rounded-xl border border-subtle bg-surface-base p-12 text-center">
          <EmptyIcon className="mx-auto mb-4 h-12 w-12 text-text-muted" aria-hidden="true" />
          <Heading level={3} className="mb-2 text-lg font-medium text-text-primary">
            {emptyTitle}
          </Heading>
          {emptyDescription && <p className="mb-4 text-text-tertiary">{emptyDescription}</p>}
          {emptyAction}
          {hasActiveFilters && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-sm text-action hover:text-action"
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      ) : (
        <>
          {(resultsLabel || onRetry) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-tertiary">{resultsLabel}</p>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Aktualisieren
                </Button>
              )}
            </div>
          )}
          {children}
        </>
      )}
    </div>
  )
}
