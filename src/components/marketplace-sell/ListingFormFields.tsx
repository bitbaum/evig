'use client'

import { useTranslations } from 'next-intl'
import {
  MARKETPLACE_LIMITS,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  MARKETPLACE_CATEGORY_VALUES,
  MARKETPLACE_CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { getConditionCriteria } from '@/config/marketplace/condition-criteria'
import { SpecFields } from './SpecFields'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
      {/* Section header: Basic info */}
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">{t('sectionBasicInfo')}</h2>

      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="listing-title" className="block text-sm font-medium text-text-secondary">
            {t('title')} <span className="text-error-500">*</span>
          </label>
          <span className={`text-xs ${formData.title.length >= MARKETPLACE_LIMITS.MAX_TITLE_LENGTH ? 'text-error-500' : 'text-text-muted'}`}>
            {formData.title.length}/{MARKETPLACE_LIMITS.MAX_TITLE_LENGTH}
          </span>
        </div>
        <Input
          id="listing-title"
          type="text"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
          maxLength={MARKETPLACE_LIMITS.MAX_TITLE_LENGTH}
          placeholder={t('titlePlaceholder')}
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="listing-description" className="block text-sm font-medium text-text-secondary">
            {t('description')} <span className="text-error-500">*</span>
          </label>
          <span className={`text-xs ${formData.description.length >= MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH ? 'text-error-500' : 'text-text-muted'}`}>
            {formData.description.length}/{MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <Textarea
          id="listing-description"
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          maxLength={MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH}
          rows={5}
          placeholder={t('descriptionPlaceholder')}
          className="resize-y"
        />
      </div>

      {/* Section header: Category & condition */}
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest pt-2">{t('sectionCategoryCondition')}</h2>

      {/* Price + Category + Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="listing-price" className="block text-sm font-medium text-text-secondary mb-1">
            {t('price')}
          </label>
          <Input
            id="listing-price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder={t('pricePlaceholder')}
          />
          {formData.price === '0' && (
            <p className="text-xs text-teal-600 mt-1">{t('freeNotice')}</p>
          )}
        </div>
        <div>
          <label htmlFor="listing-category" className="block text-sm font-medium text-text-secondary mb-1">
            {t('category')} <span className="text-error-500">*</span>
          </label>
          <Select
            id="listing-category"
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">{t('selectPlaceholder')}</option>
            {MARKETPLACE_CATEGORY_VALUES.map(val => (
              <option key={val} value={val}>
                {CATEGORY_ICONS[val] ? `${CATEGORY_ICONS[val]} ` : ''}{MARKETPLACE_CATEGORY_LABELS[val] || val}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="listing-condition" className="block text-sm font-medium text-text-secondary mb-1">
            {t('condition')}
          </label>
          <Select
            id="listing-condition"
            value={formData.condition}
            onChange={(e) => handleConditionChange(e.target.value)}
          >
            <option value="">{t('selectPlaceholder')}</option>
            {ZUSTAND_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Condition Criteria Checklist */}
      {formData.conditionChecks.length > 0 && (
        <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
          <p className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-3">
            {t('conditionHeader', { condition: ZUSTAND_OPTIONS.find(o => o.value === formData.condition)?.label ?? '' })}
          </p>
          <div className="space-y-2">
            {formData.conditionChecks.map(check => (
              <label key={check.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={check.checked}
                  onChange={() => handleConditionCheckToggle(check.key)}
                  className="mt-0.5 rounded-sm border-neutral-300 text-action focus:ring-primary-500"
                />
                <span className="text-sm text-text-secondary">{check.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brand + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('brand')} <span className="text-xs text-text-tertiary">({tCommon('optional')})</span>
          </label>
          <Input
            type="text"
            value={formData.brand}
            onChange={(e) => update('brand', e.target.value)}
            placeholder={t('brandPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('model')} <span className="text-xs text-text-tertiary">({tCommon('optional')})</span>
          </label>
          <Input
            type="text"
            value={formData.model}
            onChange={(e) => update('model', e.target.value)}
            placeholder={t('modelPlaceholder')}
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

      {/* Section header: Delivery & payment */}
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest pt-2">{t('sectionDelivery')}</h2>

      {/* Delivery + Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('delivery')}
          </label>
          <Select
            value={formData.deliveryOptions}
            onChange={(e) => update('deliveryOptions', e.target.value)}
          >
            {DELIVERY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{DELIVERY_LABELS[opt]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('payment')}
          </label>
          <Select
            value={formData.paymentMode}
            onChange={(e) => update('paymentMode', e.target.value)}
          >
            {PAYMENT_MODES.map(opt => (
              <option key={opt} value={opt}>{PAYMENT_MODE_LABELS[opt]}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Shipping cost (conditional) */}
      {formData.deliveryOptions !== 'pickup' && (
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('shippingCost')}
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.shippingCost}
            onChange={(e) => update('shippingCost', e.target.value)}
            placeholder="0.00"
          />
        </div>
      )}

      {/* Pickup location */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('pickupLocation')} <span className="text-xs text-text-tertiary">({tCommon('optional')})</span>
        </label>
        <Input
          type="text"
          value={formData.pickupLocation}
          onChange={(e) => update('pickupLocation', e.target.value)}
          placeholder={t('locationPlaceholder')}
        />
      </div>
    </>
  )
}
