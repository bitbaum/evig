'use client'

import Link from 'next/link'
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
      <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">{t('successHeading')}</Heading>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center text-green-800 mb-2">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">{t('successTitle')}</span>
        </div>
        <p className="text-green-700 text-sm">
          {requiresPayment && isPaymentSuccess
            ? t('successPayment')
            : t('successRegistered')
          }
          {' '}{t('successDashboard')}
        </p>
      </div>

      {invoiceNumber && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center text-gray-700 text-sm">
            <FileText className="w-4 h-4 mr-2" />
            <span>{t('invoiceNumber', { number: invoiceNumber })}</span>
          </div>
        </div>
      )}

      <Link
        href="/dashboard/workshops"
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        {t('dashboardLink')}
      </Link>
    </div>
  )
}
