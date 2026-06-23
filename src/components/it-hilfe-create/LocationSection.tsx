'use client'

import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SWISS_CANTONS } from '@/config/swiss-cantons'

interface Props {
  postalCode: string
  city: string
  canton: string
  onPostalCodeChange: (value: string) => void
  onCityChange: (value: string) => void
  onCantonChange: (value: string) => void
}

export function LocationSection({
  postalCode,
  city,
  canton,
  onPostalCodeChange,
  onCityChange,
  onCantonChange,
}: Props) {
  const t = useTranslations('itHelp.create')

  return (
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">{t('locationHeading')}</Heading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('postalCode')}
          </label>
          <Input
            type="text"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="8001"
            className="px-4 border-default rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('city')}
          </label>
          <Input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={t('city')}
            className="px-4 border-default rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('canton')}
          </label>
          <Select
            value={canton}
            onChange={(e) => onCantonChange(e.target.value)}
          >
            <option value="">{t('cantonPlaceholder')}</option>
            {SWISS_CANTONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
