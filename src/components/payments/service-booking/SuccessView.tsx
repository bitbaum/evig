'use client'

/**
 * Success view after successful booking payment
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Shield, Clock } from 'lucide-react'
import type { ServiceInfo, PaymentData } from './types'
import Heading from '@/components/ui/Heading'

interface SuccessViewProps {
  service: ServiceInfo
  paymentData: PaymentData | null
  useEscrow: boolean
}

export function SuccessView({ service, paymentData, useEscrow }: SuccessViewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <CardTitle className="text-green-800">Buchung erfolgreich!</CardTitle>
        <CardDescription>
          Ihre Service-Buchung wurde erfolgreich erstellt und bezahlt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <Heading level={3} className="font-semibold text-green-800 mb-2">Buchungsdetails</Heading>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>Service:</strong> {service.name}</p>
            <p><strong>Termin-ID:</strong> {paymentData?.appointmentId}</p>
            <p><strong>Rechnung:</strong> {paymentData?.invoiceNumber}</p>
            <p><strong>Betrag:</strong> CHF {paymentData?.amount.toFixed(2)}</p>
            {service.requires_approval && (
              <p className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Wartet auf Genehmigung durch unsere Techniker
              </p>
            )}
          </div>
        </div>

        {useEscrow && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Ihre Zahlung ist durch Escrow geschützt. Die Mittel werden freigegeben,
              sobald der Service abgeschlossen ist.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => window.location.href = '/dashboard/appointments'}
            className="flex-1"
          >
            Zu meinen Terminen
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = `/invoices/${paymentData?.invoiceId}`}
            className="flex-1"
          >
            Rechnung ansehen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
