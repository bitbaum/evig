'use client'

// Result-row rendering for the command palette: grouped rows + empty/searching state.

import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminInteractive } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'
import type { ResultItem } from './types'
import type { CommandBarT } from './build-results'

interface ResultsListProps {
  results: ResultItem[]
  groups: Map<string, ResultItem[]>
  activeIdx: number
  loading: boolean
  query: string
  t: CommandBarT
  onSelect: (item: ResultItem) => void
  onHover: (idx: number) => void
}

export function ResultsList({
  results,
  groups,
  activeIdx,
  loading,
  query,
  t,
  onSelect,
  onHover,
}: ResultsListProps) {
  // Flat index for cursor tracking across groups
  let flatIdx = 0

  return (
    <div className="overflow-y-auto max-h-96 py-2">
      {results.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-text-muted">
          {loading ? t('searching') : t('noResults', { query })}
        </p>
      ) : (
        Array.from(groups.entries()).map(([groupLabel, items]) => (
          <div key={groupLabel}>
            <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {groupLabel}
            </p>
            {items.map(item => {
              const isCurrent = flatIdx === activeIdx
              const currentFlatIdx = flatIdx
              flatIdx++
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => onHover(currentFlatIdx)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left h-auto rounded-none justify-start',
                    isCurrent
                      ? adminInteractive.pickerActive
                      : cn('text-text-secondary', adminInteractive.rowHoverSubtle),
                  )}
                >
                  <span className={`shrink-0 ${isCurrent ? 'text-action' : 'text-text-muted'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm leading-snug truncate">
                      {item.label}
                    </span>
                    {item.sub && (
                      <span className="block text-xs text-text-muted truncate mt-0.5">
                        {item.sub}
                      </span>
                    )}
                  </span>
                  {isCurrent && (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-action" aria-hidden="true" />
                  )}
                </Button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
