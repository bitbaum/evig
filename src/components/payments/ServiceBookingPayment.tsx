'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Shield, Clock, CheckCircle, AlertCircle, Euro, DollarSign } from 'lucide-react'
import StripeCheckout from '@/components/shop/StripeCheckout'
import CurrencySelector from './CurrencySelector'
import type { StripePaymentIntent } from '@/types/common'
import type { SupportedCurrency, ServicePricing } from '@/lib/payments/currency'

// API response pricing structure (different from client-side ServicePricing)
interface ApiPricingResponse {
  currency: string
  subtotal: number
  vat: number
  vatRate: string
  providerFee: number
  total: number
}

// Local display pricing structure
interface DisplayPricing {
  subtotal: number
  vat: number
  total: number
}

interface PaymentSuccessResult {
  appointmentId: string
  invoiceId: string
  paymentIntentId?: string
  invoiceNumber?: string
}

interface ServiceBookingPaymentProps {
  service: {
    id: string
    slug: string
    name: string
    price_cents: number
    requires_approval: boolean
  }
  onSuccess?: (result: PaymentSuccessResult) => void
  onError?: (error: string) => void
}

export default function ServiceBookingPayment({
  service,
  onSuccess,
  onError
}: ServiceBookingPaymentProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success' | 'error'>('details')
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('CHF')
  const [currencyPricing, setCurrencyPricing] = useState<ServicePricing | null>(null)
  const [bookingData, setBookingData] = useState({
    description: '',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    deviceInfo: '',
    useEscrow: true,
    preferredDate: '',
    preferredTimeSlots: [] as string[]
  })
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string
    amount: number
    appointmentId: string
    invoiceId: string
    invoiceNumber: string
    pricing: ApiPricingResponse
  } | null>(null)
  const [error, setError] = useState<string>('')

  const servicePrice = service.price_cents / 100
  const currentPricing: DisplayPricing = currencyPricing
    ? {
        subtotal: currencyPricing.convertedPrice,
        vat: currencyPricing.vat,
        total: currencyPricing.total
      }
    : {
        subtotal: servicePrice,
        vat: servicePrice * 0.077, // Swiss VAT
        total: servicePrice * 1.077 + Math.round(servicePrice * 0.029) + 0.30
      }

  const handleCurrencyChange = (currency: SupportedCurrency, pricing: ServicePricing) => {
    setSelectedCurrency(currency)
    setCurrencyPricing(pricing)
  }

  const handleBookingSubmit = async () => {
    setStep('processing')
    setError('')

    try {
      const response = await fetch('/api/appointments/book-with-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceSlug: service.slug,
          ...bookingData,
          currency: selectedCurrency,
          amount: currentPricing.total,
          includeVAT: true,
          businessType: 'service'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Booking failed')
      }

      setPaymentData({
        clientSecret: result.clientSecret,
        amount: result.amount,
        appointmentId: result.appointmentId,
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        pricing: result.pricing
      })

      setStep('payment')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      setStep('error')
      onError?.(message)
    }
  }

  const handlePaymentSuccess = async (paymentIntent: StripePaymentIntent) => {
    setStep('processing')

    try {
      // The webhook will handle updating the appointment status
      // For immediate feedback, we can show success
      setStep('success')
      if (paymentData) {
        onSuccess?.({
          appointmentId: paymentData.appointmentId,
          invoiceId: paymentData.invoiceId,
          paymentIntentId: paymentIntent.id,
          invoiceNumber: paymentData.invoiceNumber
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError('Payment succeeded but booking confirmation failed')
      setStep('error')
      onError?.(message)
    }
  }

  const handlePaymentError = (error: string) => {
    setError(error)
    setStep('error')
    onError?.(error)
  }

  if (step === 'success') {
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
            <h3 className="font-semibold text-green-800 mb-2">Buchungsdetails</h3>
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

          {bookingData.useEscrow && (
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

  if (step === 'error') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-red-800">Fehler bei der Buchung</CardTitle>
          <CardDescription>
            Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => setStep('details')}
            className="w-full"
          >
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'payment' && paymentData) {
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
            {paymentData?.pricing && (
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
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </CardContent>
      </Card>
    )
  }

  if (step === 'processing') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Buchung wird verarbeitet...</h3>
          <p className="text-gray-600 text-center">
            Bitte warten Sie, während wir Ihre Buchung erstellen und die Zahlung vorbereiten.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Default: details step
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Service buchen: {service.name}</CardTitle>
        <CardDescription>
          Buchen Sie diesen Service mit sofortiger Zahlung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Details */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Service-Details</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Service:</strong> {service.name}</p>
            <p><strong>Preis:</strong> {selectedCurrency} {currentPricing.subtotal.toFixed(2)}</p>
            <p><strong>MwSt ({selectedCurrency === 'CHF' ? '7.7' : '19.0'}%):</strong> {selectedCurrency} {currentPricing.vat.toFixed(2)}</p>
            <p><strong>Gebühren:</strong> {selectedCurrency} {(currentPricing.total * 0.029 + 0.30).toFixed(2)} (ca.)</p>
            <p><strong>Gesamt:</strong> {selectedCurrency} {(currentPricing.total * 1.029 + 0.30).toFixed(2)}</p>
            {service.requires_approval && (
              <div className="flex items-center mt-2">
                <Badge variant="secondary">Genehmigung erforderlich</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Currency Selector */}
        <CurrencySelector
          baseAmount={servicePrice}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          businessType="service"
        />

        {/* Booking Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Beschreibung Ihres Problems *
            </label>
            <textarea
              value={bookingData.description}
              onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Beschreiben Sie das Problem so detailliert wie möglich..."
              className="w-full p-3 border rounded-lg"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dringlichkeit
            </label>
            <select
              value={bookingData.urgency}
              onChange={(e) => setBookingData(prev => ({
                ...prev,
                urgency: e.target.value as 'low' | 'normal' | 'high' | 'urgent'
              }))}
              className="w-full p-3 border rounded-lg"
            >
              <option value="low">Niedrig - Innerhalb 2 Wochen</option>
              <option value="normal">Normal - Innerhalb 1 Woche</option>
              <option value="high">Hoch - Innerhalb 3 Tagen</option>
              <option value="urgent">Dringend - Heute oder morgen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Geräte-Informationen (optional)
            </label>
            <input
              type="text"
              value={bookingData.deviceInfo}
              onChange={(e) => setBookingData(prev => ({ ...prev, deviceInfo: e.target.value }))}
              placeholder="z.B. MacBook Pro 2021, iPhone 13, etc."
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="escrow"
              checked={bookingData.useEscrow}
              onChange={(e) => setBookingData(prev => ({ ...prev, useEscrow: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="escrow" className="text-sm">
              <strong>Escrow-Schutz aktivieren</strong> - Geld wird erst freigegeben, wenn Service abgeschlossen ist
            </label>
          </div>
        </div>

        {bookingData.useEscrow && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Mit Escrow-Schutz sind Ihre Zahlungsmittel sicher. Sie werden automatisch
              freigegeben, sobald der Service erfolgreich abgeschlossen wurde.
            </AlertDescription>
          </Alert>
        )}

          <Button
            onClick={handleBookingSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            disabled={!bookingData.description.trim()}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Buchung erstellen und bezahlen ({selectedCurrency} {(currentPricing.total * 1.029 + 0.30).toFixed(2)})
          </Button>
      </CardContent>
    </Card>
  )
}