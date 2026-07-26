'use client'

import { Stethoscope } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

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

      <p className="text-xs text-text-tertiary">
        {t('disclaimer')}
      </p>
    </div>
  )
}
