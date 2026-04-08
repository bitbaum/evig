'use client'

/**
 * Payment view — placeholder until payment provider is integrated
 */

import { CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Zahlung abschliessen</CardTitle>
        <CardDescription>
          Schliesse die Zahlung für {service.name} ab
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Service:</span>
            <span className="font-semibold">{service.name}</span>
          </div>
          {paymentData.pricing && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span>Service-Preis:</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>MwSt ({paymentData.pricing.vatRate}):</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.vat}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Gebühren:</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.providerFee}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>Gesamt:</span>
                <span>{paymentData.pricing.currency} {paymentData.pricing.total}</span>
              </div>
            </>
          )}
        </div>

        {/* Placeholder until payment provider is integrated */}
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">
            Online-Zahlung wird bald verfügbar sein
          </p>
          <p className="text-sm text-gray-500">
            Kontaktiere uns direkt für Buchungen
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
