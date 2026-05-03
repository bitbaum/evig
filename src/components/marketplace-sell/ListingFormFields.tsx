'use client'

import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_LIMITS,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  MARKETPLACE_CATEGORY_VALUES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { getConditionCriteria } from '@/config/marketplace/condition-criteria'
import { SpecFields } from './SpecFields'
import type { ListingFormData, ListingFormUpdater, SpecFieldData, ConditionCheckData } from './types'

interface Props {
  formData: ListingFormData
  setFormData: ListingFormUpdater
}

export function ListingFormFields({ formData, setFormData }: Props) {
  const t = useTranslations('marketplace.sell.form')
  const tCommon = useTranslations('common')

  const update = <K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const handleCategoryChange = (value: string) => {
    // Reset specs when category changes
    setFormData(prev => ({ ...prev, category: value, specs: [], conditionChecks: [] }))
  }

  const handleConditionChange = (value: string) => {
    // Load condition criteria for the selected category + condition
    const criteria = getConditionCriteria(formData.category, value)
    const checks: ConditionCheckData[] = criteria
      ? criteria.map(c => ({ key: c.key, label: c.label, checked: false }))
      : []
    setFormData(prev => ({ ...prev, condition: value, conditionChecks: checks }))
  }

  const handleConditionCheckToggle = (key: string) => {
    setFormData(prev => ({
      ...prev,
      conditionChecks: prev.conditionChecks.map(c =>
        c.key === key ? { ...c, checked: !c.checked } : c
      ),
    }))
  }

  const handleSpecsChange = (specs: SpecFieldData[]) => {
    update('specs', specs)
  }

  return (
    <>
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="listing-title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('title')} <span className="text-error-500">*</span>
          </label>
          <span className={`text-xs ${formData.title.length >= MARKETPLACE_LIMITS.MAX_TITLE_LENGTH ? 'text-error-500' : 'text-neutral-400'}`}>
            {formData.title.length}/{MARKETPLACE_LIMITS.MAX_TITLE_LENGTH}
          </span>
        </div>
        <input
          id="listing-title"
          type="text"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
          maxLength={MARKETPLACE_LIMITS.MAX_TITLE_LENGTH}
          placeholder={t('titlePlaceholder')}
          className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="listing-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('description')} <span className="text-error-500">*</span>
          </label>
          <span className={`text-xs ${formData.description.length >= MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH ? 'text-error-500' : 'text-neutral-400'}`}>
            {formData.description.length}/{MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          id="listing-description"
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          maxLength={MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH}
          rows={5}
          placeholder={t('descriptionPlaceholder')}
          className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-y"
        />
      </div>

      {/* Price + Category + Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="listing-price" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('price')}
          </label>
          <input
            id="listing-price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder={t('pricePlaceholder')}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          />
          {formData.price === '0' && (
            <p className="text-xs text-teal-600 mt-1">{t('freeNotice')}</p>
          )}
        </div>
        <div>
          <label htmlFor="listing-category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('category')} <span className="text-error-500">*</span>
          </label>
          <select
            id="listing-category"
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          >
            <option value="">{t('selectPlaceholder')}</option>
            {MARKETPLACE_CATEGORY_VALUES.map(val => (
              <option key={val} value={val}>
                {CATEGORY_ICONS[val] ? `${CATEGORY_ICONS[val]} ` : ''}{CATEGORY_LABELS[val] || val}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="listing-condition" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('condition')}
          </label>
          <select
            id="listing-condition"
            value={formData.condition}
            onChange={(e) => handleConditionChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          >
            <option value="">{t('selectPlaceholder')}</option>
            {ZUSTAND_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Condition Criteria Checklist */}
      {formData.conditionChecks.length > 0 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
            {t('conditionHeader', { condition: ZUSTAND_OPTIONS.find(o => o.value === formData.condition)?.label ?? '' })}
          </p>
          <div className="space-y-2">
            {formData.conditionChecks.map(check => (
              <label key={check.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={check.checked}
                  onChange={() => handleConditionCheckToggle(check.key)}
                  className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{check.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brand + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('brand')} <span className="text-xs text-neutral-500">({tCommon('optional')})</span>
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => update('brand', e.target.value)}
            placeholder={t('brandPlaceholder')}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('model')} <span className="text-xs text-neutral-500">({tCommon('optional')})</span>
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => update('model', e.target.value)}
            placeholder={t('modelPlaceholder')}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* Spec Fields (dynamic based on category) */}
      {formData.category && (
        <SpecFields
          categoryValue={formData.category}
          specs={formData.specs}
          onSpecsChange={handleSpecsChange}
        />
      )}

      {/* Delivery + Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('delivery')}
          </label>
          <select
            value={formData.deliveryOptions}
            onChange={(e) => update('deliveryOptions', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          >
            {DELIVERY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{DELIVERY_LABELS[opt]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('payment')}
          </label>
          <select
            value={formData.paymentMode}
            onChange={(e) => update('paymentMode', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          >
            {PAYMENT_MODES.map(opt => (
              <option key={opt} value={opt}>{PAYMENT_MODE_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipping cost (conditional) */}
      {formData.deliveryOptions !== 'pickup' && (
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('shippingCost')}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.shippingCost}
            onChange={(e) => update('shippingCost', e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          />
        </div>
      )}

      {/* Pickup location */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {t('pickupLocation')} <span className="text-xs text-neutral-500">({tCommon('optional')})</span>
        </label>
        <input
          type="text"
          value={formData.pickupLocation}
          onChange={(e) => update('pickupLocation', e.target.value)}
          placeholder={t('locationPlaceholder')}
          className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        />
      </div>
    </>
  )
}
