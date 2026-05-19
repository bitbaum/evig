'use client'

import { CheckCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

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
    <div className="rounded-xl border border-primary-200 bg-white dark:bg-neutral-900 p-6">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-1">
            {t('markCompletedTitle')}
          </Heading>
          <p className="text-sm text-neutral-600 mb-4">
            {t('markCompletedDesc')}
          </p>
          <button
            type="button"
            onClick={onMarkCompleted}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
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
          </button>
        </div>
      </div>
    </div>
  )
}
