'use client'

import { Link } from '@/i18n/navigation'
import { CheckCircle, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

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
      <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">{t('successHeading')}</Heading>

      <div className="bg-action-muted border border-strong rounded-lg p-4 mb-4">
        <div className="flex items-center text-action mb-2">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">{t('successTitle')}</span>
        </div>
        <p className="text-action text-sm">
          {requiresPayment && isPaymentSuccess
            ? t('successPayment')
            : t('successRegistered')
          }
          {' '}{t('successDashboard')}
        </p>
      </div>

      {invoiceNumber && (
        <div className="bg-surface-raised border rounded-lg p-3 mb-4">
          <div className="flex items-center text-text-secondary text-sm">
            <FileText className="w-4 h-4 mr-2" />
            <span>{t('invoiceNumber', { number: invoiceNumber })}</span>
          </div>
        </div>
      )}

      <Button as={Link} href="/dashboard/workshops" variant="primary" className="w-full">
        {t('dashboardLink')}
      </Button>
    </div>
  )
}
