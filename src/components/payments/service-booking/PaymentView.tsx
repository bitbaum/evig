'use client'

/**
 * Payment view with Stripe checkout
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StripeCheckout from '@/components/shop/StripeCheckout'
import type { StripePaymentIntent } from '@/types/common'
import type { ServiceInfo, PaymentData } from './types'

interface PaymentViewProps {
  service: ServiceInfo
  paymentData: PaymentData
  onPaymentSuccess: (paymentIntent: StripePaymentIntent) => void
  onPaymentError: (error: string) => void
}

export function PaymentView({
  service,
  paymentData,
  onPaymentSuccess,
  onPaymentError,
}: PaymentViewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Zahlung abschliessen</CardTitle>
        <CardDescription>
          Schliessen Sie die Zahlung für {service.name} ab
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

        <StripeCheckout
          cartId={paymentData.appointmentId}
          total={paymentData.amount}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      </CardContent>
    </Card>
  )
}
