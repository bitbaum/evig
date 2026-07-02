'use client'

import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_CATEGORY_VALUES,
  MARKETPLACE_SELLER_TYPE,
} from '@/config/marketplace'
import { ORG } from '@/config/org'
import type { FiltersObj } from '@/components/marketplace/MarketplaceFilterSidebar'
import { FilterPill } from '@/components/marketplace/FilterPill'

interface MarketplaceFilterBarProps {
  filters: FiltersObj
  resetOffset: () => void
  onOpenAdvanced?: () => void
  activeAdvancedCount?: number
}

/**
 * Unified marketplace filters — source + category as one horizontal control
 * surface (no separate "Revamp-IT Geräte" island vs accordion sidebar).
 */
export function MarketplaceFilterBar({
  filters,
  resetOffset,
  onOpenAdvanced,
  activeAdvancedCount = 0,
}: MarketplaceFilterBarProps) {
  const t = useTranslations('marketplace')

  const sourceOptions = [
    { value: '', label: t('sellerTypes.all') },
    { value: MARKETPLACE_SELLER_TYPE.REVAMPIT, label: t('sellerTypes.revampit', { orgName: ORG.name }) },
    { value: MARKETPLACE_SELLER_TYPE.COMMUNITY, label: t('sellerTypes.community') },
  ] as const

  return (
    <div className="space-y-4 mb-6">
      {/* Source — same row as browse, not a separate nav destination */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {t('filters.sellerTypeTitle')}
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('filters.sellerTypeAriaLabel')}
        >
          {sourceOptions.map((opt) => (
            <FilterPill
              key={opt.value || 'all'}
              active={filters.sellerType === opt.value}
              onClick={() => {
                filters.setSellerType(opt.value)
                resetOffset()
              }}
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Category — horizontal scan, no emoji wall */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {t('filters.categoryTitle')}
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
          role="group"
          aria-label={t('filters.categoryAriaLabel')}
        >
          <FilterPill
            active={!filters.category}
            onClick={() => {
              filters.setCategory('')
              resetOffset()
            }}
          >
            {t('categories.all')}
          </FilterPill>
          {MARKETPLACE_CATEGORY_VALUES.map((val) => (
            <FilterPill
              key={val}
              active={filters.category === val}
              onClick={() => {
                filters.setCategory(val)
                resetOffset()
              }}
            >
              {t(`categories.${val}` as never)}
            </FilterPill>
          ))}
        </div>
      </div>

      {onOpenAdvanced && (
        // Compact-viewport affordance only — on lg+ the persistent filter
        // rail replaces this trigger, so hide it to avoid a redundant control.
        <div className="flex items-center gap-3 pt-1 border-t border-subtle lg:hidden">
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
