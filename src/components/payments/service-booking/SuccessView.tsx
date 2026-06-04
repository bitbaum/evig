'use client'

/**
 * Success view after successful booking payment
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Shield, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ServiceInfo, PaymentData } from './types'
import Heading from '@/components/ui/Heading'

interface SuccessViewProps {
  service: ServiceInfo
  paymentData: PaymentData | null
  useEscrow: boolean
}

export function SuccessView({ service, paymentData, useEscrow }: SuccessViewProps) {
  const t = useTranslations('services.payment')

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CheckCircle className="w-16 h-16 text-action mx-auto mb-4" />
        <CardTitle className="text-action">{t('successTitle')}</CardTitle>
        <CardDescription>
          {t('successDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-action-muted-muted p-4 rounded-lg">
          <Heading level={3} className="font-semibold text-action mb-2">{t('bookingDetails')}</Heading>
          <div className="space-y-2 text-sm text-action">
            <p><strong>{t('detailService')}</strong> {service.name}</p>
            <p><strong>{t('detailAppointmentId')}</strong> {paymentData?.appointmentId}</p>
            <p><strong>{t('detailInvoice')}</strong> {paymentData?.invoiceNumber}</p>
            <p><strong>{t('detailAmount')}</strong> CHF {paymentData?.amount.toFixed(2)}</p>
            {service.requires_approval && (
              <p className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {t('waitingApproval')}
              </p>
            )}
          </div>
        </div>

        {useEscrow && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('escrowProtected')}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => window.location.href = '/dashboard/appointments'}
            className="flex-1"
          >
            {t('myAppointments')}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = `/invoices/${paymentData?.invoiceId}`}
            className="flex-1"
          >
            {t('viewInvoice')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
