'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Offer } from './types'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { StatusBadge } from '@/components/ui/status-badge'

interface UserOfferProps {
  offer: Offer
  withdrawing: boolean
  onWithdraw: () => void
}

export function UserOffer({ offer, withdrawing, onWithdraw }: UserOfferProps) {
  const t = useTranslations('itHelp.offer')

  return (
    <div className="rounded-xl border border-strong bg-surface-base p-6">
      <div className="flex items-center justify-between mb-3">
        <Heading level={3} className="text-lg font-semibold text-text-primary">{t('heading')}</Heading>
        <StatusBadge variant="warning">{t('yourOfferBadge')}</StatusBadge>
      </div>
      <p className="text-text-secondary mb-3">{offer.message}</p>
      {(offer.estimatedTime || offer.proposedCompensation) && (
        <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-4">
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
      <Button
        variant="destructive-ghost"
        onClick={onWithdraw}
        disabled={withdrawing}
        className="px-4 py-2.5 min-h-touch bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg text-sm font-medium hover:bg-error-100 dark:hover:bg-error-900/30 h-auto"
      >
        {withdrawing ? t('withdrawing') : t('withdrawButton')}
      </Button>
    </div>
  )
}
