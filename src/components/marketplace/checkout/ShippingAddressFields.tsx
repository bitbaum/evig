'use client'

/**
 * ShippingAddressFields — the one shipping-address form used by both
 * checkout flows (single-item checkout + RevampIT cart). Renders the
 * Swiss-format fields, the "prefilled from profile" hint and the optional
 * "save to profile for next time" opt-in.
 */

import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import type { ShippingAddress } from '@/hooks/useShippingAddress'

interface ShippingAddressFieldsProps {
  address: ShippingAddress
  onChange: (updater: (prev: ShippingAddress) => ShippingAddress) => void
  postalCodeValid: boolean
  prefilled: boolean
  canOfferSave: boolean
  saveToProfile: boolean
  onSaveToggle: (save: boolean) => void
}

export function ShippingAddressFields({
  address,
  onChange,
  postalCodeValid,
  prefilled,
  canOfferSave,
  saveToProfile,
  onSaveToggle,
}: ShippingAddressFieldsProps) {
  const t = useTranslations('marketplace.checkout.address')

  return (
    <div className="space-y-4">
      {prefilled && (
        <p className="flex items-center gap-2 rounded-lg bg-action-muted px-3 py-2 text-sm text-action">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('prefilledFromProfile')}
        </p>
      )}
      <div>
        <label htmlFor="shipping-name" className="mb-1 block text-sm font-medium text-text-secondary">{t('name')}</label>
        <Input
          id="shipping-name"
          type="text"
          autoComplete="name"
          value={address.name}
          onChange={(e) => onChange(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('namePlaceholder')}
        />
      </div>
      <div>
        <label htmlFor="shipping-street" className="mb-1 block text-sm font-medium text-text-secondary">{t('street')}</label>
        <Input
          id="shipping-street"
          type="text"
          autoComplete="street-address"
          value={address.street}
          onChange={(e) => onChange(prev => ({ ...prev, street: e.target.value }))}
          placeholder={t('streetPlaceholder')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="shipping-plz" className="mb-1 block text-sm font-medium text-text-secondary">{t('postalCode')}</label>
          <Input
            id="shipping-plz"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={address.postal_code}
            onChange={(e) => onChange(prev => ({ ...prev, postal_code: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            maxLength={4}
            className={address.postal_code && !postalCodeValid ? 'border-error-500' : ''}
            placeholder="8000"
          />
          {address.postal_code && !postalCodeValid && (
            <p className="mt-1 text-xs text-error-500">{t('postalCodeError')}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="shipping-city" className="mb-1 block text-sm font-medium text-text-secondary">{t('city')}</label>
          <Input
            id="shipping-city"
            type="text"
            autoComplete="address-level2"
            value={address.city}
            onChange={(e) => onChange(prev => ({ ...prev, city: e.target.value }))}
            placeholder={t('cityPlaceholder')}
          />
        </div>
      </div>
      {canOfferSave && (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={saveToProfile}
            onChange={(e) => onSaveToggle(e.target.checked)}
            className="mt-0.5 rounded border-strong text-action focus:ring-action"
          />
          {t('saveToProfile')}
        </label>
      )}
    </div>
  )
}
