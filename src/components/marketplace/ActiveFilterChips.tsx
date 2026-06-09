'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_ICONS,
  MARKETPLACE_SELLER_TYPE,
  getSpecFiltersForCategory,
  type DeliveryOption,
  type PaymentMode,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { ORG } from '@/config/org'
import type { FiltersObj } from './MarketplaceFilterSidebar'

type Translator = ReturnType<typeof useTranslations<'marketplace'>>

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
  orgName: string,
  t: Translator
): Chip[] {
  const chips: Chip[] = []

  if (filters.category) {
    const icon = CATEGORY_ICONS[filters.category]
    const label = t(`categories.${filters.category}` as never)
    chips.push({
      key: 'category',
      label: `${icon ? icon + ' ' : ''}${label}`,
      onRemove: () => { filters.setCategory(''); resetOffset() },
    })
  }

  if (filters.sellerType) {
    chips.push({
      key: 'sellerType',
      label:
        filters.sellerType === MARKETPLACE_SELLER_TYPE.REVAMPIT
          ? t('chips.orgDevices', { orgName })
          : t('chips.community'),
      onRemove: () => { filters.setSellerType(''); resetOffset() },
    })
  }

  if (filters.condition) {
    const opt = ZUSTAND_OPTIONS.find((o) => o.value === filters.condition)
    chips.push({
      key: 'condition',
      label: opt ? t(`conditions.${opt.value}` as never) : filters.condition,
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
      label: t('chips.priceFrom', { min: filters.priceMin }),
      onRemove: () => { filters.setPriceMin(''); filters.setPriceError(null); resetOffset() },
    })
  } else if (filters.priceMax) {
    chips.push({
      key: 'priceMax',
      label: t('chips.priceTo', { max: filters.priceMax }),
      onRemove: () => { filters.setPriceMax(''); filters.setPriceError(null); resetOffset() },
    })
  }

  if (filters.delivery) {
    chips.push({
      key: 'delivery',
      label: t(`delivery.${filters.delivery as DeliveryOption}` as never),
      onRemove: () => { filters.setDelivery(''); resetOffset() },
    })
  }

  if (filters.payment) {
    chips.push({
      key: 'payment',
      label: t(`payment.${filters.payment as PaymentMode}` as never),
      onRemove: () => { filters.setPayment(''); resetOffset() },
    })
  }

  if (filters.gratisOnly) {
    chips.push({
      key: 'gratis',
      label: t('chips.gratis'),
      onRemove: () => { filters.setGratisOnly(false); resetOffset() },
    })
  }

  if (filters.verifiedOnly) {
    chips.push({
      key: 'verified',
      label: t('chips.verified'),
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
  const chips = buildChips(filters, resetOffset, ORG.name, t)

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" aria-label={t('filters.activeFilters')}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-secondary-50 border border-secondary-200 pl-3 pr-2 py-1 text-sm text-secondary-800 font-medium"
        >
          {chip.label}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={chip.onRemove}
            aria-label={t('chips.remove', { label: chip.label })}
            className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full hover:bg-secondary-200 text-secondary-500 hover:text-secondary-700 h-auto p-0 bg-transparent"
          >
            <X className="w-2.5 h-2.5" />
          </Button>
        </span>
      ))}
      {chips.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-sm text-text-tertiary hover:text-text-secondary font-medium underline underline-offset-2 h-auto px-0 bg-transparent hover:bg-transparent"
        >
          {t('filters.clearFilters')}
        </Button>
      )}
    </div>
  )
}
