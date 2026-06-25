'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { usePaymentReturnBanner } from '@/hooks/usePaymentReturnBanner'

interface Props {
  /** i18n namespace that defines paymentSuccess / paymentFailed / paymentCancelled */
  namespace:
    | 'dashboard.appointments'
    | 'dashboard.bookings'
    | 'marketplace.cart'
    | 'marketplace.checkout'
    | 'workshops.registration'
  cleanPath?: string
}

/**
 * Banner for Payrexx return URLs (`?payment=` or marketplace `?error=`).
 * Pass the i18n namespace that defines paymentSuccess / paymentFailed / paymentCancelled.
 */
export function PaymentReturnBanner({ namespace, cleanPath }: Props) {
  const t = useTranslations(namespace)
  const { banner, dismiss } = usePaymentReturnBanner({ cleanPath })

  if (!banner) return null

  if (banner === 'success') {
    return (
      <div className="bg-action-muted border border-strong rounded-lg p-4 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-action shrink-0" />
          <p className="text-action font-medium">{t('paymentSuccess')}</p>
        </div>
        <Button onClick={dismiss} variant="ghost" size="icon" className="text-action text-lg leading-none" aria-label="Schliessen">
          ×
        </Button>
      </div>
    )
  }

  const isCancelled = banner === 'cancelled'
  return (
    <div className={`border rounded-lg p-4 mb-6 flex items-center justify-between gap-3 ${
      isCancelled
        ? 'bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/30'
        : 'bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/30'
    }`}>
      <div className="flex items-center gap-3">
        {isCancelled
          ? <AlertCircle className="w-5 h-5 text-warning-600 shrink-0" />
          : <XCircle className="w-5 h-5 text-error-600 shrink-0" />}
        <p className={`font-medium ${isCancelled ? 'text-warning-800 dark:text-warning-300' : 'text-error-800 dark:text-error-400'}`}>
          {isCancelled ? t('paymentCancelled') : t('paymentFailed')}
        </p>
      </div>
      <Button onClick={dismiss} variant="ghost" size="icon" className="text-lg leading-none" aria-label="Schliessen">
        ×
      </Button>
    </div>
  )
}
