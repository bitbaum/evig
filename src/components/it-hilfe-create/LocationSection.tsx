'use client'

import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
      <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">{t('locationHeading')}</Heading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('postalCode')}
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="8001"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('city')}
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={t('city')}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('canton')}
          </label>
          <input
            type="text"
            value={canton}
            onChange={(e) => onCantonChange(e.target.value)}
            placeholder={t('canton')}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}
