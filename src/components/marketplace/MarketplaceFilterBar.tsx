'use client'

import { useTranslations } from 'next-intl'
import type { FiltersObj } from '@/components/marketplace/MarketplaceFilterSidebar'
import { FilterPill } from '@/components/marketplace/FilterPill'
import { MarketplaceBrowseFacets } from '@/components/marketplace/MarketplaceBrowseFacets'

interface MarketplaceFilterBarProps {
  filters: FiltersObj
  resetOffset: () => void
  onOpenAdvanced?: () => void
  activeAdvancedCount?: number
}

/**
 * Mobile top strip — the primary browse facets (source + category) as a
 * horizontal scan, plus a trigger into the advanced-filter drawer. On desktop
 * the persistent filter rail carries these facets instead, so this strip is
 * `lg:hidden` at the call site.
 */
export function MarketplaceFilterBar({
  filters,
  resetOffset,
  onOpenAdvanced,
  activeAdvancedCount = 0,
}: MarketplaceFilterBarProps) {
  const t = useTranslations('marketplace')

  return (
    <div className="space-y-4 mb-6">
      <MarketplaceBrowseFacets filters={filters} resetOffset={resetOffset} orientation="horizontal" />

      {onOpenAdvanced && (
        <div className="flex items-center gap-3 pt-1 border-t border-subtle">
          <FilterPill active={activeAdvancedCount > 0} onClick={onOpenAdvanced}>
            {t('filters.advanced')}
            {activeAdvancedCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-canvas/20 px-1 text-xs tabular-nums">
                {activeAdvancedCount}
              </span>
            )}
          </FilterPill>
        </div>
      )}
    </div>
  )
}
