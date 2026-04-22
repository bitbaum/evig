'use client'

/**
 * Payment view — placeholder until payment provider is integrated
 */

import { CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslations } from 'next-intl'
import type { PaymentResult } from '@/types/common'
import type { ServiceInfo, PaymentData } from './types'

interface PaymentViewProps {
  service: ServiceInfo
  paymentData: PaymentData
  onPaymentSuccess: (paymentResult: PaymentResult) => void
  onPaymentError: (error: string) => void
}

export function PaymentView({
  service,
  paymentData,
}: PaymentViewProps) {
  const t = useTranslations('services.payment')

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('paymentViewTitle')}</CardTitle>
        <CardDescription>
          {t('paymentViewDesc', { name: service.name })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>{t('detailService')}</span>
            <span className="font-semibold">{service.name}</span>
          </div>
          {paymentData.pricing && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span>{t('servicePriceLabel')}</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>{t('detailVat', { vatRate: paymentData.pricing.vatRate })}:</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.vat}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>{t('feesLabel')}</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.providerFee}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>{t('detailTotal')}</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.total}</span>
              </div>
            </>
          )}
        </div>

        {/* Placeholder until payment provider is integrated */}
        <EmptyState
          icon={CreditCard}
          iconBg="bg-orange-50 dark:bg-orange-900/20"
          iconColor="text-orange-500 dark:text-orange-400"
          title={t('comingSoonTitle')}
          description={t('comingSoonDesc')}
        />
      </CardContent>
    </Card>
  )
}
