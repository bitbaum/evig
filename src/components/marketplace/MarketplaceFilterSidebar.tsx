'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_CATEGORY_VALUES,
  CATEGORY_ICONS,
  DELIVERY_OPTIONS,
  PAYMENT_MODES,
  MARKETPLACE_LIMITS,
  MARKETPLACE_SELLER_TYPE,
  SPEC_FILTER_STATE_MAP,
  getSpecFiltersForCategory,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { ORG } from '@/config/org'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type FiltersObj = ReturnType<typeof useMarketplaceListings>['filters']

interface FilterSidebarProps {
  filters: FiltersObj
  validatePrices: () => boolean
  resetOffset: () => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border py-3">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-text-primary hover:text-text-secondary py-0.5 h-auto px-0 bg-transparent hover:bg-transparent"
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-text-muted shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
        )}
      </Button>
      {open && <div className="mt-2.5 space-y-1.5">{children}</div>}
    </div>
  )
}

function RadioOption({
  name,
  checked,
  onChange,
  label,
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 text-secondary-600 border-default focus:ring-secondary-500 focus:ring-offset-0 shrink-0"
      />
      <span className="text-sm text-text-secondary group-hover:text-text-primary leading-snug">
        {label}
      </span>
    </label>
  )
}

function CheckOption({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded-sm text-secondary-600 border-default focus:ring-secondary-500 focus:ring-offset-0 shrink-0"
      />
      <span className="text-sm text-text-secondary group-hover:text-text-primary leading-snug">
        {label}
      </span>
    </label>
  )
}

export function MarketplaceFilterSidebar({
  filters,
  validatePrices,
  resetOffset,
  clearFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  const t = useTranslations('marketplace')
  const specFilters = getSpecFiltersForCategory(filters.category)

  // Build lookup maps from filter state for spec filter rendering — driven by SPEC_FILTER_STATE_MAP
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1 pb-3 border-b border">
        <span className="text-sm font-bold text-text-primary">{t('filters.label')}</span>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-secondary-600 hover:text-secondary-700 font-medium h-auto px-0 bg-transparent hover:bg-transparent"
          >
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>

      {/* Category */}
      <FilterSection title={t('filters.categoryTitle')}>
        <RadioOption
          name="category"
          checked={!filters.category}
          onChange={() => { filters.setCategory(''); resetOffset() }}
          label={t('categories.all')}
        />
        {MARKETPLACE_CATEGORY_VALUES.map((val) => (
          <RadioOption
            key={val}
            name="category"
            checked={filters.category === val}
            onChange={() => { filters.setCategory(val); resetOffset() }}
            label={
              <>
                {CATEGORY_ICONS[val] && (
                  <span className="mr-1 text-base leading-none">{CATEGORY_ICONS[val]}</span>
                )}
                {t(`categories.${val}` as never)}
              </>
            }
          />
        ))}
      </FilterSection>

      {/* Seller type */}
      <FilterSection title={t('filters.sellerTypeTitle')}>
        <RadioOption
          name="seller-type"
          checked={!filters.sellerType}
          onChange={() => { filters.setSellerType(''); resetOffset() }}
          label={t('sellerTypes.all')}
        />
        <RadioOption
          name="seller-type"
          checked={filters.sellerType === MARKETPLACE_SELLER_TYPE.REVAMPIT}
          onChange={() => { filters.setSellerType(MARKETPLACE_SELLER_TYPE.REVAMPIT); resetOffset() }}
          label={t('sellerTypes.revampit', { orgName: ORG.name })}
        />
        <RadioOption
          name="seller-type"
          checked={filters.sellerType === MARKETPLACE_SELLER_TYPE.COMMUNITY}
          onChange={() => { filters.setSellerType(MARKETPLACE_SELLER_TYPE.COMMUNITY); resetOffset() }}
          label={t('sellerTypes.community')}
        />
      </FilterSection>

      {/* Condition */}
      <FilterSection title={t('filters.condition')}>
        <RadioOption
          name="condition"
          checked={!filters.condition}
          onChange={() => { filters.setCondition(''); resetOffset() }}
          label={t('filters.allConditions')}
        />
        {ZUSTAND_OPTIONS.map((opt) => (
          <RadioOption
            key={opt.value}
            name="condition"
            checked={filters.condition === opt.value}
            onChange={() => { filters.setCondition(opt.value); resetOffset() }}
            label={t(`conditions.${opt.value}` as never)}
          />
        ))}
      </FilterSection>

      {/* Price */}
      <FilterSection title={t('filters.priceRange')}>
        <CheckOption
          checked={filters.gratisOnly}
          onChange={() => { filters.setGratisOnly(!filters.gratisOnly); resetOffset() }}
          label={t('filters.gratisOnly')}
        />
        <div className="flex gap-2 mt-2">
          <Input
            type="number"
            min="0"
            max={MARKETPLACE_LIMITS.MAX_PRICE_CHF}
            step="1"
            placeholder={t('filters.priceMin')}
            value={filters.priceMin}
            onChange={(e) => {
              filters.setPriceMin(e.target.value)
              filters.setPriceError(null)
            }}
            onBlur={() => {
              validatePrices()
              resetOffset()
            }}
            aria-label={t('filters.priceMinAriaLabel')}
            aria-invalid={!!filters.priceError}
            className={`w-1/2 ${filters.priceError ? 'border-red-400' : ''}`}
          />
          <Input
            type="number"
            min="0"
            max={MARKETPLACE_LIMITS.MAX_PRICE_CHF}
            step="1"
            placeholder={t('filters.priceMax')}
            value={filters.priceMax}
            onChange={(e) => {
              filters.setPriceMax(e.target.value)
              filters.setPriceError(null)
            }}
            onBlur={() => {
              validatePrices()
              resetOffset()
            }}
            aria-label={t('filters.priceMaxAriaLabel')}
            aria-invalid={!!filters.priceError}
            className={`w-1/2 ${filters.priceError ? 'border-red-400' : ''}`}
          />
        </div>
        {filters.priceError && (
          <p className="text-xs text-red-600 mt-1">{filters.priceError}</p>
        )}
      </FilterSection>

      {/* Delivery */}
      <FilterSection title={t('filters.delivery')} defaultOpen={false}>
        <RadioOption
          name="delivery"
          checked={!filters.delivery}
          onChange={() => { filters.setDelivery(''); resetOffset() }}
          label={t('filters.allDelivery')}
        />
        {DELIVERY_OPTIONS.map((opt) => (
          <RadioOption
            key={opt}
            name="delivery"
            checked={filters.delivery === opt}
            onChange={() => { filters.setDelivery(opt); resetOffset() }}
            label={t(`delivery.${opt}` as never)}
          />
        ))}
      </FilterSection>

      {/* Payment */}
      <FilterSection title={t('filters.payment')} defaultOpen={false}>
        <RadioOption
          name="payment"
          checked={!filters.payment}
          onChange={() => { filters.setPayment(''); resetOffset() }}
          label={t('filters.allPayment')}
        />
        {PAYMENT_MODES.map((opt) => (
          <RadioOption
            key={opt}
            name="payment"
            checked={filters.payment === opt}
            onChange={() => { filters.setPayment(opt); resetOffset() }}
            label={t(`payment.${opt}` as never)}
          />
        ))}
      </FilterSection>

      {/* Verified */}
      <FilterSection title={t('filters.qualityTitle')} defaultOpen={false}>
        <CheckOption
          checked={filters.verifiedOnly}
          onChange={() => { filters.setVerifiedOnly(!filters.verifiedOnly); resetOffset() }}
          label={t('filters.verifiedOnly')}
        />
      </FilterSection>

      {/* Spec filters — only shown when a category with specs is selected */}
      {specFilters.length > 0 && (
        <FilterSection title={t('filters.technicalFilters')}>
          {specFilters.map((spec) => {
            const filterKey = SPEC_FILTER_STATE_MAP[spec.meiliField]
            if (!filterKey) return null
            const filterValue = specValues[filterKey] ?? ''
            const setFilter = specSetters[filterKey]
            if (!setFilter) return null
            return (
              <div key={spec.key} className="mb-3">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
                  {spec.label}
                </p>
                <RadioOption
                  name={`spec-${spec.key}`}
                  checked={!filterValue}
                  onChange={() => { setFilter(''); resetOffset() }}
                  label={t('filters.all')}
                />
                {spec.options.map((opt) => (
                  <RadioOption
                    key={opt.value}
                    name={`spec-${spec.key}`}
                    checked={filterValue === String(opt.value)}
                    onChange={() => { setFilter(String(opt.value)); resetOffset() }}
                    label={opt.label}
                  />
                ))}
              </div>
            )
          })}
        </FilterSection>
      )}
    </div>
  )
}
