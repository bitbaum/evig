/**
 * Filter bar for /it-hilfe — sort dropdown + expandable filter panel.
 *
 * Extracted from ItHilfePageClient as part of the QQ.3 god-component
 * split. Pure presentation — owns its own showFilters state since it's
 * a UI detail, not request state.
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SWISS_CANTONS,
  SORT_OPTIONS,
} from '@/config/it-hilfe'
import type { ITHilfeFilters as ITHilfeFiltersValue } from '@/hooks/useITHilfeRequests'

interface Props {
  sort: string
  setSort: (sort: string) => void
  filters: ITHilfeFiltersValue
  setFilter: (key: keyof ITHilfeFiltersValue, value: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
}

export function ItHilfeFilters({
  sort, setSort, filters, setFilter, hasActiveFilters, clearFilters,
}: Props) {
  const t = useTranslations('itHelp.page')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="mb-6 card-shell p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('filterButton')}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-text-primary" aria-label={t('activeFiltersIndicator')} />
          )}
        </Button>

        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-auto"
          aria-label={t('sortLabel')}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="w-4 h-4" />
            {t('resetFilters')}
          </Button>
        )}
      </div>

      {showFilters && (
        <div id="filter-panel" className="mt-4 pt-4 border-t border-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterSelect
              label={t('filterCategory')}
              labelAll={t('filterCategoryAll')}
              id="filter-category"
              value={filters.category}
              onChange={(v) => setFilter('category', v)}
              options={DEVICE_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FilterSelect
              label={t('filterCanton')}
              labelAll={t('filterCantonAll')}
              id="filter-canton"
              value={filters.canton}
              onChange={(v) => setFilter('canton', v)}
              options={SWISS_CANTONS.map((c) => ({ value: c, label: c }))}
            />
            <FilterSelect
              label={t('filterUrgency')}
              labelAll={t('filterUrgencyAll')}
              id="filter-urgency"
              value={filters.urgency}
              onChange={(v) => setFilter('urgency', v)}
              options={URGENCY_LEVELS.map((u) => ({ value: u.id, label: u.name }))}
            />
            <FilterSelect
              label={t('filterBudget')}
              labelAll={t('filterBudgetAll')}
              id="filter-budget"
              value={filters.budgetType}
              onChange={(v) => setFilter('budgetType', v)}
              options={[
                { value: 'free', label: t('filterBudgetFree') },
                { value: 'paid', label: t('filterBudgetPaid') },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── DRY helper for the four identical select+label blocks ── */

interface FilterSelectProps {
  id: string
  label: string
  labelAll: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}

function FilterSelect({ id, label, labelAll, value, onChange, options }: FilterSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-2">
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{labelAll}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
    </div>
  )
}
