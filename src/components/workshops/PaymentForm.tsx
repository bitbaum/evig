'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CreditCard, Shield, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentFormProps {
  paymentUrl: string
  amount: string
  currency?: string
}

export function PaymentForm({
  paymentUrl,
  amount,
  currency = 'CHF'
}: PaymentFormProps) {
  const t = useTranslations('components.paymentForm')
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handlePay = () => {
    setIsRedirecting(true)
    window.location.href = paymentUrl
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-3 bg-action-muted rounded-lg">
        <Shield className="w-4 h-4 text-action mr-2" />
        <span className="text-sm text-action">{t('sslNote')}</span>
      </div>

      <Button
        onClick={handlePay}
        disabled={isRedirecting}
        variant="primary"
        className="w-full"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('redirecting')}
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {t('payNow', { currency, amount })}
            <ExternalLink className="w-3 h-3 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
