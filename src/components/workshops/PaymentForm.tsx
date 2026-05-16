'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, CreditCard, Shield, ExternalLink } from 'lucide-react'

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
      <div className="flex items-center justify-center p-3 bg-primary-50 rounded-lg">
        <Shield className="w-4 h-4 text-primary-600 mr-2" />
        <span className="text-sm text-primary-800">{t('sslNote')}</span>
      </div>

      <button
        onClick={handlePay}
        disabled={isRedirecting}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
      </button>
    </div>
  )
}
