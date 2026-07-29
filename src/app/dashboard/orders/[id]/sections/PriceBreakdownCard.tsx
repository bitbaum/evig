/** Price breakdown card — amount, service fee, payout/total and buyer protection. */

'use client'

import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { formatCHF } from '@/config/marketplace'
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared'
import type { NonNullOrder } from './shared'

export function PriceBreakdownCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders')
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>{t('priceSection')}</Heading>
      <div className="space-y-2 text-sm font-mono tabular-nums">
        <PriceRow label={t('amountLabel')} value={formatCHF(Number(order.amountChf))} />
        <PriceRow label={t('serviceFee')} value={formatCHF(Number(order.commissionChf))} />
        {order.role === 'seller' && (
          <div className="flex justify-between font-medium pt-2 border-t border-subtle">
            <span className="text-text-secondary">{t('yourPayout')}</span>
            <span className="text-action">{formatCHF(Number(order.sellerPayoutChf))}</span>
          </div>
        )}
        {order.role === 'buyer' && (
          <div className="flex justify-between font-bold pt-2 border-t border-subtle">
            <span className="text-text-primary">{t('totalPaid')}</span>
            <span className="text-text-primary">{formatCHF(Number(order.amountChf))}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
        <Shield className="w-3.5 h-3.5 text-action" />
        {t('buyerProtection')}
      </div>
    </div>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  )
}
