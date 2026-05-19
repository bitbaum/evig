'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Offer } from './types'
import Heading from '@/components/ui/Heading'

interface UserOfferProps {
  offer: Offer
  withdrawing: boolean
  onWithdraw: () => void
}

export function UserOffer({ offer, withdrawing, onWithdraw }: UserOfferProps) {
  const t = useTranslations('itHelp.offer')

  return (
    <div className="rounded-xl border border-primary-200 bg-white dark:bg-neutral-900 p-6">
      <div className="flex items-center justify-between mb-3">
        <Heading level={3} className="text-lg font-semibold text-neutral-900">{t('heading')}</Heading>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400">
          {t('yourOfferBadge')}
        </span>
      </div>
      <p className="text-neutral-700 mb-3">{offer.message}</p>
      {(offer.estimatedTime || offer.proposedCompensation) && (
        <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
          {offer.estimatedTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {offer.estimatedTime}
            </span>
          )}
          {offer.proposedCompensation && (
            <span>{offer.proposedCompensation}</span>
          )}
        </div>
      )}
      <button
        onClick={onWithdraw}
        disabled={withdrawing}
        className="px-4 py-2.5 min-h-[44px] bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg text-sm font-medium hover:bg-error-100 dark:hover:bg-error-900/30 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
      >
        {withdrawing ? t('withdrawing') : t('withdrawButton')}
      </button>
    </div>
  )
}
