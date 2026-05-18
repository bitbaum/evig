'use client'

import { Link } from '@/i18n/navigation'
import { CheckCircle, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

interface RegistrationSuccessCardProps {
  requiresPayment: boolean
  isPaymentSuccess: boolean
  invoiceNumber?: string
}

export function RegistrationSuccessCard({
  requiresPayment,
  isPaymentSuccess,
  invoiceNumber
}: RegistrationSuccessCardProps) {
  const t = useTranslations('workshops.detail')

  return (
    <div>
      <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">{t('successHeading')}</Heading>

      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 rounded-lg p-4 mb-4">
        <div className="flex items-center text-primary-800 dark:text-primary-300 mb-2">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">{t('successTitle')}</span>
        </div>
        <p className="text-primary-700 dark:text-primary-400 text-sm">
          {requiresPayment && isPaymentSuccess
            ? t('successPayment')
            : t('successRegistered')
          }
          {' '}{t('successDashboard')}
        </p>
      </div>

      {invoiceNumber && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-4">
          <div className="flex items-center text-neutral-700 text-sm">
            <FileText className="w-4 h-4 mr-2" />
            <span>{t('invoiceNumber', { number: invoiceNumber })}</span>
          </div>
        </div>
      )}

      <Link
        href="/dashboard/workshops"
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        {t('dashboardLink')}
      </Link>
    </div>
  )
}
