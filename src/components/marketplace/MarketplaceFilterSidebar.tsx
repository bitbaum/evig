'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_CATEGORY_VALUES,
  MARKETPLACE_CATEGORY_LABELS,
  CATEGORY_ICONS,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  MARKETPLACE_LIMITS,
  MARKETPLACE_SELLER_TYPE,
  getSpecFiltersForCategory,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { ORG } from '@/config/org'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'

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
    <div className="border-b border-neutral-200 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-800 hover:text-neutral-600 py-0.5"
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
        )}
      </button>
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
        className="h-3.5 w-3.5 text-orange-600 border-neutral-300 focus:ring-orange-500 focus:ring-offset-0 flex-shrink-0"
      />
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900 leading-snug">
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
        className="h-3.5 w-3.5 rounded text-orange-600 border-neutral-300 focus:ring-orange-500 focus:ring-offset-0 flex-shrink-0"
      />
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900 leading-snug">
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1 pb-3 border-b border-neutral-200">
        <span className="text-sm font-bold text-neutral-900">{t('filters.label')}</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            {t('filters.clearFilters')}
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Kategorie">
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
                {MARKETPLACE_CATEGORY_LABELS[val] || val}
              </>
            }
          />
        ))}
      </FilterSection>

      {/* Seller type */}
      <FilterSection title="Anbieter">
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
            label={opt.label}
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
          <input
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
            className={`w-1/2 px-2.5 py-1.5 border rounded-md bg-white text-sm text-neutral-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none ${
              filters.priceError ? 'border-red-400' : 'border-neutral-300'
            }`}
          />
          <input
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
            className={`w-1/2 px-2.5 py-1.5 border rounded-md bg-white text-sm text-neutral-900 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none ${
              filters.priceError ? 'border-red-400' : 'border-neutral-300'
            }`}
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
            label={DELIVERY_LABELS[opt]}
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
            label={PAYMENT_MODE_LABELS[opt]}
          />
        ))}
      </FilterSection>

      {/* Verified */}
      <FilterSection title="Qualität" defaultOpen={false}>
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
            const filterValue =
              spec.meiliField === 'spec_ram_gb'
                ? filters.specRamMin
                : spec.meiliField === 'spec_storage_gb'
                ? filters.specStorageMin
                : spec.meiliField === 'spec_display_inches'
                ? filters.specDisplayMin
                : ''
            const setFilter =
              spec.meiliField === 'spec_ram_gb'
                ? filters.setSpecRamMin
                : spec.meiliField === 'spec_storage_gb'
                ? filters.setSpecStorageMin
                : spec.meiliField === 'spec_display_inches'
                ? filters.setSpecDisplayMin
                : null
            if (!setFilter) return null
            return (
              <div key={spec.key} className="mb-3">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
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
