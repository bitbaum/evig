'use client'

import { Stethoscope, MapPin, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { REVAMPIT_STORE } from '@/config/it-hilfe'

interface AIDiagnosisCardProps {
  diagnosis: string
  deviceInfo?: string
}

export function AIDiagnosisCard({ diagnosis, deviceInfo }: AIDiagnosisCardProps) {
  const t = useTranslations('components.aiDiagnosisCard')
  return (
    <div className="bg-surface-raised rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-3">
        <Stethoscope className="w-5 h-5 text-action" />
        <Heading level={3} className="text-lg font-semibold text-text-primary">{t('title')}</Heading>
      </div>

      {deviceInfo && (
        <p className="text-sm text-text-tertiary mb-2">{deviceInfo}</p>
      )}

      <p className="text-text-secondary mb-4 whitespace-pre-wrap">{diagnosis}</p>

      <div className="bg-surface-base/60 rounded-lg p-4 mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-action mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {t('bringIn')}
            </p>
            <p className="text-sm text-text-secondary">
              {REVAMPIT_STORE.name} &ndash; {REVAMPIT_STORE.address}, {REVAMPIT_STORE.postalCode} {REVAMPIT_STORE.city}
            </p>
            <a
              href={REVAMPIT_STORE.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-action hover:text-action mt-1"
            >
              {t('mapsLink')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-tertiary">
        {t('disclaimer')}
      </p>
    </div>
  )
}
