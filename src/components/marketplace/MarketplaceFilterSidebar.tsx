'use client'

import { useTranslations } from 'next-intl'
import {
  DELIVERY_OPTIONS,
  PAYMENT_MODES,
  MARKETPLACE_LIMITS,
  SPEC_FILTER_STATE_MAP,
  getSpecFiltersForCategory,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterPill } from '@/components/marketplace/FilterPill'
import { MarketplaceBrowseFacets } from '@/components/marketplace/MarketplaceBrowseFacets'

export type FiltersObj = ReturnType<typeof useMarketplaceListings>['filters']

interface FilterSidebarProps {
  filters: FiltersObj
  validatePrices: () => boolean
  resetOffset: () => void
  clearFilters: () => void
  hasActiveFilters: boolean
  /**
   * Include the primary browse facets (source + category) at the top. True for
   * the desktop rail (the single filter surface); false in the mobile drawer,
   * where the top strip already carries them.
   */
  showBrowse?: boolean
}

/**
 * A refinement group — mono micro-label + content, separated by a single
 * hairline. Flat and fully visible (no accordion chrome): the panel reads as
 * one scannable instrument, x.ai / fleetcrown discipline.
 */
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-subtle pt-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      {children}
    </div>
  )
}

/**
 * Single-select pill group — the same pill language as the top category bar,
 * so the whole filter experience speaks one visual dialect.
 */
function PillGroup({
  label,
  options,
  value,
  onSelect,
  ariaLabel,
}: {
  label: string
  options: readonly { value: string; label: string }[]
  value: string
  onSelect: (v: string) => void
  ariaLabel: string
}) {
  return (
    <FilterGroup label={label}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
        {options.map((opt) => (
          <FilterPill
            key={opt.value || 'all'}
            active={value === opt.value}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </FilterPill>
        ))}
      </div>
    </FilterGroup>
  )
}

export function MarketplaceFilterSidebar({
  filters,
  validatePrices,
  resetOffset,
  clearFilters,
  hasActiveFilters,
  showBrowse = false,
}: FilterSidebarProps) {
  const t = useTranslations('marketplace')
  const specFilters = getSpecFiltersForCategory(filters.category)

  // Filter state → spec render maps, driven by SPEC_FILTER_STATE_MAP (SSOT)
  const specValues: Record<string, string> = {
    specRamMin:     filters.specRamMin,
    specStorageMin: filters.specStorageMin,
    specDisplayMin: filters.specDisplayMin,
  }
  const specSetters: Record<string, (v: string) => void> = {
    specRamMin:     filters.setSpecRamMin,
    specStorageMin: filters.setSpecStorageMin,
    specDisplayMin: filters.setSpecDisplayMin,
  }

  const conditionOptions = [
    { value: '', label: t('filters.allConditions') },
    ...ZUSTAND_OPTIONS.map((opt) => ({ value: opt.value, label: t(`conditions.${opt.value}` as never) })),
  ]
  const deliveryOptions = [
    { value: '', label: t('filters.allDelivery') },
    ...DELIVERY_OPTIONS.map((opt) => ({ value: opt, label: t(`delivery.${opt}` as never) })),
  ]
  const paymentOptions = [
    { value: '', label: t('filters.allPayment') },
    ...PAYMENT_MODES.map((opt) => ({ value: opt, label: t(`payment.${opt}` as never) })),
  ]

  return (
    <div>
      {/* Panel header */}
      <div className="flex items-center justify-between pb-1">
        <span className="ui-public-eyebrow">{t('filters.label')}</span>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto bg-transparent px-0 text-xs font-medium text-text-secondary hover:bg-transparent hover:text-text-primary"
          >
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        {/* Primary browse facets — only in the desktop rail (single surface) */}
        {showBrowse && (
          <MarketplaceBrowseFacets
            filters={filters}
            resetOffset={resetOffset}
            orientation="vertical"
          />
        )}

        {/* Condition */}
        <PillGroup
          label={t('filters.condition')}
          options={conditionOptions}
          value={filters.condition}
          onSelect={(v) => { filters.setCondition(v); resetOffset() }}
          ariaLabel={t('filters.condition')}
        />

        {/* Price */}
        <FilterGroup label={t('filters.priceRange')}>
          <FilterPill
            active={filters.gratisOnly}
            onClick={() => { filters.setGratisOnly(!filters.gratisOnly); resetOffset() }}
          >
            {t('filters.gratisOnly')}
          </FilterPill>
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max={MARKETPLACE_LIMITS.MAX_PRICE_CHF}
              step="1"
              placeholder={t('filters.priceMin')}
              value={filters.priceMin}
              onChange={(e) => { filters.setPriceMin(e.target.value); filters.setPriceError(null) }}
              onBlur={() => { validatePrices(); resetOffset() }}
              aria-label={t('filters.priceMinAriaLabel')}
              aria-invalid={!!filters.priceError}
              className={`w-full ${filters.priceError ? 'border-error-400' : ''}`}
            />
            <span className="text-text-muted" aria-hidden="true">–</span>
            <Input
              type="number"
              min="0"
              max={MARKETPLACE_LIMITS.MAX_PRICE_CHF}
              step="1"
              placeholder={t('filters.priceMax')}
              value={filters.priceMax}
              onChange={(e) => { filters.setPriceMax(e.target.value); filters.setPriceError(null) }}
              onBlur={() => { validatePrices(); resetOffset() }}
              aria-label={t('filters.priceMaxAriaLabel')}
              aria-invalid={!!filters.priceError}
              className={`w-full ${filters.priceError ? 'border-error-400' : ''}`}
            />
          </div>
          {filters.priceError && (
            <p className="mt-1.5 text-xs text-error-600">{filters.priceError}</p>
          )}
        </FilterGroup>

        {/* Delivery */}
        <PillGroup
          label={t('filters.delivery')}
          options={deliveryOptions}
          value={filters.delivery}
          onSelect={(v) => { filters.setDelivery(v); resetOffset() }}
          ariaLabel={t('filters.delivery')}
        />

        {/* Payment */}
        <PillGroup
          label={t('filters.payment')}
          options={paymentOptions}
          value={filters.payment}
          onSelect={(v) => { filters.setPayment(v); resetOffset() }}
          ariaLabel={t('filters.payment')}
        />

        {/* Quality */}
        <FilterGroup label={t('filters.qualityTitle')}>
          <FilterPill
            active={filters.verifiedOnly}
            onClick={() => { filters.setVerifiedOnly(!filters.verifiedOnly); resetOffset() }}
          >
            {t('filters.verifiedOnly')}
          </FilterPill>
        </FilterGroup>

        {/* Technical (spec) filters — only when the category exposes specs */}
        {specFilters.length > 0 && specFilters.map((spec) => {
          const filterKey = SPEC_FILTER_STATE_MAP[spec.meiliField]
          if (!filterKey) return null
          const filterValue = specValues[filterKey] ?? ''
          const setFilter = specSetters[filterKey]
          if (!setFilter) return null
          return (
            <PillGroup
              key={spec.key}
              label={spec.label}
              options={[
                { value: '', label: t('filters.all') },
                ...spec.options.map((opt) => ({ value: String(opt.value), label: opt.label })),
              ]}
              value={filterValue}
              onSelect={(v) => { setFilter(v); resetOffset() }}
              ariaLabel={spec.label}
            />
          )
        })}
      </div>
    </div>
  )
}
