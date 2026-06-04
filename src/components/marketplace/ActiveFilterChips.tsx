'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_CATEGORY_LABELS,
  CATEGORY_ICONS,
  DELIVERY_LABELS,
  PAYMENT_MODE_LABELS,
  MARKETPLACE_SELLER_TYPE,
  getSpecFiltersForCategory,
  type DeliveryOption,
  type PaymentMode,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { ORG } from '@/config/org'
import type { FiltersObj } from './MarketplaceFilterSidebar'

interface ActiveFilterChipsProps {
  filters: FiltersObj
  resetOffset: () => void
  clearFilters: () => void
}

interface Chip {
  key: string
  label: string
  onRemove: () => void
}

function buildChips(
  filters: FiltersObj,
  resetOffset: () => void,
  orgName: string
): Chip[] {
  const chips: Chip[] = []

  if (filters.category) {
    const icon = CATEGORY_ICONS[filters.category]
    chips.push({
      key: 'category',
      label: `${icon ? icon + ' ' : ''}${MARKETPLACE_CATEGORY_LABELS[filters.category] || filters.category}`,
      onRemove: () => { filters.setCategory(''); resetOffset() },
    })
  }

  if (filters.sellerType) {
    chips.push({
      key: 'sellerType',
      label:
        filters.sellerType === MARKETPLACE_SELLER_TYPE.REVAMPIT
          ? `${orgName} Geräte`
          : 'Community',
      onRemove: () => { filters.setSellerType(''); resetOffset() },
    })
  }

  if (filters.condition) {
    const opt = ZUSTAND_OPTIONS.find((o) => o.value === filters.condition)
    chips.push({
      key: 'condition',
      label: opt?.label ?? filters.condition,
      onRemove: () => { filters.setCondition(''); resetOffset() },
    })
  }

  if (filters.priceMin && filters.priceMax) {
    chips.push({
      key: 'price',
      label: `CHF ${filters.priceMin} – ${filters.priceMax}`,
      onRemove: () => {
        filters.setPriceMin('')
        filters.setPriceMax('')
        filters.setPriceError(null)
        resetOffset()
      },
    })
  } else if (filters.priceMin) {
    chips.push({
      key: 'priceMin',
      label: `ab CHF ${filters.priceMin}`,
      onRemove: () => { filters.setPriceMin(''); filters.setPriceError(null); resetOffset() },
    })
  } else if (filters.priceMax) {
    chips.push({
      key: 'priceMax',
      label: `bis CHF ${filters.priceMax}`,
      onRemove: () => { filters.setPriceMax(''); filters.setPriceError(null); resetOffset() },
    })
  }

  if (filters.delivery) {
    chips.push({
      key: 'delivery',
      label: DELIVERY_LABELS[filters.delivery as DeliveryOption] ?? filters.delivery,
      onRemove: () => { filters.setDelivery(''); resetOffset() },
    })
  }

  if (filters.payment) {
    chips.push({
      key: 'payment',
      label: PAYMENT_MODE_LABELS[filters.payment as PaymentMode] ?? filters.payment,
      onRemove: () => { filters.setPayment(''); resetOffset() },
    })
  }

  if (filters.gratisOnly) {
    chips.push({
      key: 'gratis',
      label: 'Gratis',
      onRemove: () => { filters.setGratisOnly(false); resetOffset() },
    })
  }

  if (filters.verifiedOnly) {
    chips.push({
      key: 'verified',
      label: 'Geprüft',
      onRemove: () => { filters.setVerifiedOnly(false); resetOffset() },
    })
  }

  // Spec filters — look up label from spec options
  const specDefs = getSpecFiltersForCategory(filters.category)
  const specMap: Array<{ field: string; value: string; clear: () => void }> = [
    {
      field: 'spec_ram_gb',
      value: filters.specRamMin,
      clear: () => { filters.setSpecRamMin(''); resetOffset() },
    },
    {
      field: 'spec_storage_gb',
      value: filters.specStorageMin,
      clear: () => { filters.setSpecStorageMin(''); resetOffset() },
    },
    {
      field: 'spec_display_inches',
      value: filters.specDisplayMin,
      clear: () => { filters.setSpecDisplayMin(''); resetOffset() },
    },
  ]

  for (const { field, value, clear } of specMap) {
    if (!value) continue
    const spec = specDefs.find((s) => s.meiliField === field)
    const opt = spec?.options.find((o) => String(o.value) === value)
    const label = opt
      ? `${spec!.label}: ${opt.label}`
      : `${field}: ${value}`
    chips.push({ key: field, label, onRemove: clear })
  }

  return chips
}

export function ActiveFilterChips({
  filters,
  resetOffset,
  clearFilters,
}: ActiveFilterChipsProps) {
  const t = useTranslations('marketplace')
  const chips = buildChips(filters, resetOffset, ORG.name)

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" aria-label={t('filters.activeFilters')}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-secondary-50 border border-secondary-200 pl-3 pr-2 py-1 text-sm text-secondary-800 font-medium"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`${chip.label} entfernen`}
            className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full hover:bg-secondary-200 text-secondary-500 hover:text-secondary-700 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-text-tertiary hover:text-neutral-700 font-medium underline underline-offset-2"
        >
          {t('filters.clearFilters')}
        </button>
      )}
    </div>
  )
}
