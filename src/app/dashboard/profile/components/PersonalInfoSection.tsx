'use client'

import { User, Building2, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import type { ProfileData } from '../hooks/useProfileData'

interface PersonalInfoSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
}

export function PersonalInfoSection({ profile, handleChange }: PersonalInfoSectionProps) {
  const t = useTranslations('dashboard.profile.personalInfo')
  const tAddr = useTranslations('dashboard.profile.address')

  return (
    <div className="bg-surface-base rounded-xl border border-subtle p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-text-secondary" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-text-primary">
            {t('title')}
          </Heading>
          <p className="text-sm text-text-tertiary">{t('description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('firstName')}
          </label>
          <Input
            type="text"
            value={profile.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Max"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('lastName')}
          </label>
          <Input
            type="text"
            value={profile.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Muster"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('company')} <span className="text-text-muted">{tAddr('optional')}</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              type="text"
              value={profile.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="pl-11"
              placeholder="Firma AG"
            />
          </div>
        </div>
      </div>

      {/* Address — the saved address prefills the marketplace checkout, so
          buyers only ever type it once. */}
      <div className="mt-8 border-t border-subtle pt-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised">
            <MapPin className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <Heading level={3} className="text-base font-semibold text-text-primary">
              {tAddr('heading')}
            </Heading>
            <p className="text-sm text-text-tertiary">{tAddr('subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {tAddr('streetLabel')}
            </label>
            <Input
              type="text"
              autoComplete="street-address"
              value={profile.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              placeholder={tAddr('streetPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {tAddr('plzLabel')}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={4}
              value={profile.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="8000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {tAddr('cityLabel')}
            </label>
            <Input
              type="text"
              autoComplete="address-level2"
              value={profile.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder={tAddr('cityPlaceholder')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
