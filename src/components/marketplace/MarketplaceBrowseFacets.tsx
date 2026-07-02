'use client'

import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_CATEGORY_VALUES,
  MARKETPLACE_SELLER_TYPE,
} from '@/config/marketplace'
import { ORG } from '@/config/org'
import type { FiltersObj } from '@/components/marketplace/MarketplaceFilterSidebar'
import { FilterPill } from '@/components/marketplace/FilterPill'

interface MarketplaceBrowseFacetsProps {
  filters: FiltersObj
  resetOffset: () => void
  /**
   * `horizontal` — scroll rows for the mobile top strip.
   * `vertical`   — hairline-divided wrapped groups for the desktop filter rail.
   */
  orientation: 'horizontal' | 'vertical'
}

/**
 * The primary browse facets — seller source + category. Single source of the
 * seller/category pill rendering, shared by the mobile top strip
 * (`MarketplaceFilterBar`) and the desktop filter rail
 * (`MarketplaceFilterSidebar`), so the two never drift.
 */
export function MarketplaceBrowseFacets({
  filters,
  resetOffset,
  orientation,
}: MarketplaceBrowseFacetsProps) {
  const t = useTranslations('marketplace')
  const isVertical = orientation === 'vertical'

  const sourceOptions = [
    { value: '', label: t('sellerTypes.all') },
    { value: MARKETPLACE_SELLER_TYPE.REVAMPIT, label: t('sellerTypes.revampit', { orgName: ORG.name }) },
    { value: MARKETPLACE_SELLER_TYPE.COMMUNITY, label: t('sellerTypes.community') },
  ] as const

  // Vertical shares the rail's group treatment (hairline + wrap); horizontal is
  // a compact scroll row for the mobile strip.
  const blockClass = isVertical ? 'border-t border-subtle pt-5' : ''
  const rowClass = isVertical
    ? 'flex flex-wrap gap-1.5'
    : 'flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin'
  const labelClass = 'mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted'

  return (
    <>
      {/* Source */}
      <div className={blockClass}>
        <p className={labelClass}>{t('filters.sellerTypeTitle')}</p>
        <div className={rowClass} role="group" aria-label={t('filters.sellerTypeAriaLabel')}>
          {sourceOptions.map((opt) => (
            <FilterPill
              key={opt.value || 'all'}
              active={filters.sellerType === opt.value}
              onClick={() => { filters.setSellerType(opt.value); resetOffset() }}
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className={blockClass}>
        <p className={labelClass}>{t('filters.categoryTitle')}</p>
        <div className={rowClass} role="group" aria-label={t('filters.categoryAriaLabel')}>
          <FilterPill
            active={!filters.category}
            onClick={() => { filters.setCategory(''); resetOffset() }}
          >
            {t('categories.all')}
          </FilterPill>
          {MARKETPLACE_CATEGORY_VALUES.map((val) => (
            <FilterPill
              key={val}
              active={filters.category === val}
              onClick={() => { filters.setCategory(val); resetOffset() }}
            >
              {t(`categories.${val}` as never)}
            </FilterPill>
          ))}
        </div>
      </div>
    </>
  )
}
