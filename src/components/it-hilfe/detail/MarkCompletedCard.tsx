'use client'

import { CheckCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

interface MarkCompletedCardProps {
  onMarkCompleted: () => void
  submitting: boolean
}

/**
 * Card shown to the accepted helper while a request is in the matched state,
 * inviting them to mark the repair as done.
 */
export function MarkCompletedCard({ onMarkCompleted, submitting }: MarkCompletedCardProps) {
  const t = useTranslations('itHelp.detail')
  return (
    <div className="rounded-xl border border-strong bg-surface-base p-6">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-action shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <Heading level={3} className="text-lg font-semibold text-text-primary mb-1">
            {t('markCompletedTitle')}
          </Heading>
          <p className="text-sm text-text-secondary mb-4">
            {t('markCompletedDesc')}
          </p>
          <Button type="button" onClick={onMarkCompleted} disabled={submitting} variant="primary">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('markCompletedSaving')}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                {t('markCompletedButton')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
