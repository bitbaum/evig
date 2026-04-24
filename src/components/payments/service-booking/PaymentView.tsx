'use client'

import { useEffect } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import type { ServiceInfo, PaymentData } from './types'

interface PaymentViewProps {
  service: ServiceInfo
  paymentData: PaymentData
  onPaymentSuccess: (paymentResult: { id: string }) => void
  onPaymentError: (error: string) => void
}

export function PaymentView({ service, paymentData }: PaymentViewProps) {
  const t = useTranslations('services.payment')

  // Redirect to Payrexx hosted payment page as soon as this view mounts
  useEffect(() => {
    if (paymentData.paymentUrl) {
      window.location.href = paymentData.paymentUrl
    }
  }, [paymentData.paymentUrl])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('paymentViewTitle')}</CardTitle>
        <CardDescription>
          {t('paymentViewDesc', { name: service.name })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentData.pricing && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span>{t('detailService')}</span>
              <span className="font-semibold">{service.name}</span>
            </div>
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
          </div>
        )}

        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t('redirectingToPayment')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
