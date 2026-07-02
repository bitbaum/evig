"use client"

/**
 * Loading state during AI analysis
 */

import { Loader2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export function AIAnalysisLoader() {
  const t = useTranslations('marketplace.aiCamera')

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
      <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
        {t('analyzing')}
      </Heading>
      <p className="text-text-secondary">
        {t('analyzingHint')}
      </p>
      {/* Indeterminate — the analysis has no measurable percentage, so no fake fill. */}
      <div className="mt-6 bg-surface-overlay rounded-full h-2 overflow-hidden" role="progressbar" aria-label={t('analyzing')}>
        <div className="bg-action h-2 w-full rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}
